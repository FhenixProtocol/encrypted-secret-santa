// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, InEuint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// ════════════════════════════════════════════════════════════════════════════
/// SECRET SANTA - Password Protected Games with FHE
/// ════════════════════════════════════════════════════════════════════════════
///
/// All games are stored in mappings within this single contract.
/// Games can optionally be password protected using FHE encryption.
///
/// ════════════════════════════════════════════════════════════════════════════
/// FLOW
/// ════════════════════════════════════════════════════════════════════════════
///
/// CREATE GAME:
///   1. Creator encrypts entropy (and optionally password) client-side
///   2. createGame(name, entropy, password, hasPassword) → new game ID
///   3. Creator auto-registered, share game ID (and password) with friends
///
/// JOIN GAME (2-step for password games):
///   1. Player encrypts entropy and password client-side
///   2. requestJoinGame(gameId, password, entropy)
///      - Public games: immediately joined
///      - Password games: starts async password verification
///   3. completeJoinGame(gameId) - only for password games after decryption ready
///
/// FINALIZE:
///   1. Creator calls finalizeGame() when ready (3+ players)
///   2. LCG permutation creates encrypted assignments
///   3. Each player can only decrypt their own target
///
/// ════════════════════════════════════════════════════════════════════════════

contract SecretSanta {
    // ══════════════════════════════════════════════════════════════
    // TYPES
    // ══════════════════════════════════════════════════════════════

    enum GameState {
        REGISTRATION,
        ACTIVE,
        REVEALED
    }

    struct Game {
        uint256 gameId;
        address creator;
        string name;
        uint256 createdAt;
        GameState state;
        address[] participants;
        euint32 entropy;
        euint32 password;      // Encrypted password (only used if hasPassword)
        bool hasPassword;      // Flag for password protection
    }

    struct GameInfo {
        uint256 gameId;
        address creator;
        string name;
        uint256 createdAt;
        uint8 state;
        uint256 playerCount;
        bool hasPassword;      // Indicates if game requires password
    }

    struct PendingJoin {
        ebool passwordMatch;   // Encrypted comparison result
        euint32 userEntropy;   // Store entropy for later use
        string playerName;     // Store name for later use
        bool exists;
    }

    // ══════════════════════════════════════════════════════════════
    // STATE
    // ══════════════════════════════════════════════════════════════

    uint256 public gameCount;

    // Game data
    mapping(uint256 => Game) internal games;

    // Player registration per game: gameId => player => participantIndex (1-indexed, 0 = not registered)
    mapping(uint256 => mapping(address => uint256)) public playerIndex;

    // Encrypted destinations per game: gameId => participantIndex => encrypted target index
    mapping(uint256 => mapping(uint256 => euint32)) internal destinations;

    // Track games by creator and player
    mapping(address => uint256[]) public gamesByCreator;
    mapping(address => uint256[]) public gamesByPlayer;

    // Pending join requests for password-protected games
    mapping(uint256 => mapping(address => PendingJoin)) internal pendingJoins;

    // Per-game player names: gameId => player => name
    mapping(uint256 => mapping(address => string)) public playerNames;

    // ══════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════

    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        string name,
        bool hasPassword
    );

    event PlayerJoined(uint256 indexed gameId, address indexed player, string name);
    event JoinRequested(uint256 indexed gameId, address indexed player);
    event GameFinalized(uint256 indexed gameId);
    event GameRevealed(uint256 indexed gameId);

    // ══════════════════════════════════════════════════════════════
    // ERRORS
    // ══════════════════════════════════════════════════════════════

    error GameNotFound();
    error NotRegistrationPhase();
    error AlreadyRegistered();
    error NoPendingJoin();
    error DecryptionNotReady();
    error InvalidPassword();
    error NotCreator();
    error NotActive();
    error NeedAtLeast3Players();
    error NotRegistered();
    error GameNotStarted();

    // ══════════════════════════════════════════════════════════════
    // CREATE GAME
    // ══════════════════════════════════════════════════════════════

    /// @notice Create a new Secret Santa game
    /// @param name The name of the game
    /// @param creatorName The display name of the creator
    /// @param creatorEntropy Encrypted random value for assignment randomness
    /// @param password Encrypted password (ignored if hasPassword is false)
    /// @param hasPassword Whether the game requires a password to join
    /// @return gameId The ID of the created game
    function createGame(
        string calldata name,
        string calldata creatorName,
        InEuint32 calldata creatorEntropy,
        InEuint32 calldata password,
        bool hasPassword
    ) external returns (uint256 gameId) {
        gameId = gameCount++;

        Game storage game = games[gameId];
        game.gameId = gameId;
        game.creator = msg.sender;
        game.name = name;
        game.createdAt = block.timestamp;
        game.state = GameState.REGISTRATION;
        game.entropy = FHE.asEuint32(creatorEntropy);
        game.hasPassword = hasPassword;

        FHE.allowThis(game.entropy);

        if (hasPassword) {
            game.password = FHE.asEuint32(password);
            FHE.allowThis(game.password);
        }

        // Auto-register creator (no password check needed)
        game.participants.push(msg.sender);
        playerIndex[gameId][msg.sender] = 1; // 1-indexed
        playerNames[gameId][msg.sender] = creatorName;

        gamesByCreator[msg.sender].push(gameId);
        gamesByPlayer[msg.sender].push(gameId);

        emit GameCreated(gameId, msg.sender, name, hasPassword);
        emit PlayerJoined(gameId, msg.sender, creatorName);
    }

    // ══════════════════════════════════════════════════════════════
    // JOIN GAME (2-step for password games)
    // ══════════════════════════════════════════════════════════════

    /// @notice Request to join a game (Step 1)
    /// @dev For public games, joins immediately. For password games, starts async verification.
    /// @param gameId The ID of the game to join
    /// @param playerName The display name for this player
    /// @param password Encrypted password guess (ignored for public games)
    /// @param userEntropy Encrypted random value for assignment randomness
    function requestJoinGame(
        uint256 gameId,
        string calldata playerName,
        InEuint32 calldata password,
        InEuint32 calldata userEntropy
    ) external {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        if (game.state != GameState.REGISTRATION) revert NotRegistrationPhase();
        if (playerIndex[gameId][msg.sender] != 0) revert AlreadyRegistered();
        // Note: We allow overwriting existing pending joins so users can retry with different passwords

        if (!game.hasPassword) {
            // No password - directly join
            _addPlayer(gameId, playerName, userEntropy);
            return;
        }

        // Password protected - start async verification
        euint32 submittedPwd = FHE.asEuint32(password);
        ebool passwordMatch = FHE.eq(game.password, submittedPwd);

        // Store entropy as euint32 for later use
        euint32 storedEntropy = FHE.asEuint32(userEntropy);
        FHE.allowThis(storedEntropy);

        // Request decryption of the match result
        FHE.decrypt(passwordMatch);

        // Store pending join (overwrites any previous attempt)
        pendingJoins[gameId][msg.sender] = PendingJoin({
            passwordMatch: passwordMatch,
            userEntropy: storedEntropy,
            playerName: playerName,
            exists: true
        });

        emit JoinRequested(gameId, msg.sender);
    }

    /// @notice Complete joining a password-protected game (Step 2)
    /// @dev Called after password verification decryption is ready
    /// @param gameId The ID of the game to join
    function completeJoinGame(uint256 gameId) external {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        if (game.state != GameState.REGISTRATION) revert NotRegistrationPhase();
        if (!pendingJoins[gameId][msg.sender].exists) revert NoPendingJoin();

        PendingJoin storage pending = pendingJoins[gameId][msg.sender];

        // Get decrypted result
        (bool matched, bool decrypted) = FHE.getDecryptResultSafe(pending.passwordMatch);
        if (!decrypted) revert DecryptionNotReady();
        if (!matched) revert InvalidPassword();

        // Password matched - add player using stored entropy and name
        _addPlayerWithStoredEntropy(gameId, pending.playerName, pending.userEntropy);

        // Clean up pending join
        delete pendingJoins[gameId][msg.sender];
    }

    /// @notice Internal function to add a player with fresh entropy input
    function _addPlayer(uint256 gameId, string calldata playerName, InEuint32 calldata userEntropy) internal {
        Game storage game = games[gameId];

        game.participants.push(msg.sender);
        playerIndex[gameId][msg.sender] = game.participants.length; // 1-indexed
        playerNames[gameId][msg.sender] = playerName;

        // XOR entropy for combined randomness
        game.entropy = FHE.xor(game.entropy, FHE.asEuint32(userEntropy));
        FHE.allowThis(game.entropy);

        gamesByPlayer[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender, playerName);
    }

    /// @notice Internal function to add a player with already-stored entropy
    function _addPlayerWithStoredEntropy(uint256 gameId, string memory playerName, euint32 userEntropy) internal {
        Game storage game = games[gameId];

        game.participants.push(msg.sender);
        playerIndex[gameId][msg.sender] = game.participants.length; // 1-indexed
        playerNames[gameId][msg.sender] = playerName;

        // XOR entropy for combined randomness
        game.entropy = FHE.xor(game.entropy, userEntropy);
        FHE.allowThis(game.entropy);

        gamesByPlayer[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender, playerName);
    }

    // ══════════════════════════════════════════════════════════════
    // VIEW: JOIN STATUS
    // ══════════════════════════════════════════════════════════════

    /// @notice Check the join status for a player
    /// @param gameId The game ID
    /// @param player The player address
    /// @return hasPending Whether there's a pending join request
    /// @return isDecrypted Whether the password verification is complete
    /// @return isRegistered Whether the player is already registered
    function getJoinStatus(
        uint256 gameId,
        address player
    ) external view returns (bool hasPending, bool isDecrypted, bool isRegistered) {
        hasPending = pendingJoins[gameId][player].exists;
        isRegistered = playerIndex[gameId][player] != 0;

        if (hasPending) {
            (, isDecrypted) = FHE.getDecryptResultSafe(pendingJoins[gameId][player].passwordMatch);
        }
    }

    // ══════════════════════════════════════════════════════════════
    // FINALIZE GAME (LCG Permutation)
    // ══════════════════════════════════════════════════════════════

    /// @notice Finalize a game and generate encrypted assignments (creator only)
    /// @param gameId The ID of the game to finalize
    function finalizeGame(uint256 gameId) external {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        if (msg.sender != game.creator) revert NotCreator();
        if (game.state != GameState.REGISTRATION) revert NotRegistrationPhase();
        if (game.participants.length < 3) revert NeedAtLeast3Players();

        uint256 n = game.participants.length;
        euint32 nEnc = FHE.asEuint32(uint32(n));

        // Random shift: dest[i] = (i + shift) mod n, shift ∈ [1, n-1]
        // Guarantees no self-assignments (since shift != 0)
        euint32 shift = FHE.add(
            FHE.rem(game.entropy, FHE.asEuint32(uint32(n - 1))),
            FHE.asEuint32(1)
        );

        for (uint256 i = 0; i < n; i++) {
            euint32 dest = FHE.rem(
                FHE.add(shift, FHE.asEuint32(uint32(i))),
                nEnc
            );
            destinations[gameId][i] = dest;
            FHE.allow(dest, game.participants[i]);
            FHE.allowThis(dest);
        }

        game.state = GameState.ACTIVE;

        emit GameFinalized(gameId);
    }

    // ══════════════════════════════════════════════════════════════
    // REVEAL (Optional - makes all assignments public)
    // ══════════════════════════════════════════════════════════════

    /// @notice Reveal all assignments to everyone (creator only)
    /// @param gameId The ID of the game to reveal
    function revealGame(uint256 gameId) external {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        if (msg.sender != game.creator) revert NotCreator();
        if (game.state != GameState.ACTIVE) revert NotActive();

        uint256 n = game.participants.length;

        // Allow everyone to see all destinations
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n; j++) {
                FHE.allow(destinations[gameId][i], game.participants[j]);
            }
        }

        game.state = GameState.REVEALED;

        emit GameRevealed(gameId);
    }

    // ══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════════

    /// @notice Get your encrypted target index (decrypt client-side with permit)
    function getMyTarget(uint256 gameId) external view returns (euint32) {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        if (game.state == GameState.REGISTRATION) revert GameNotStarted();

        uint256 idx = playerIndex[gameId][msg.sender];
        if (idx == 0) revert NotRegistered();

        return destinations[gameId][idx - 1]; // Convert from 1-indexed
    }

    /// @notice Get game info
    function getGame(uint256 gameId) external view returns (GameInfo memory) {
        if (gameId >= gameCount) revert GameNotFound();
        Game storage game = games[gameId];

        return GameInfo({
            gameId: game.gameId,
            creator: game.creator,
            name: game.name,
            createdAt: game.createdAt,
            state: uint8(game.state),
            playerCount: game.participants.length,
            hasPassword: game.hasPassword
        });
    }

    /// @notice Get all participants in a game
    function getParticipants(uint256 gameId) external view returns (address[] memory) {
        if (gameId >= gameCount) revert GameNotFound();
        return games[gameId].participants;
    }

    /// @notice Get a specific participant by index
    function getParticipant(uint256 gameId, uint256 idx) external view returns (address) {
        if (gameId >= gameCount) revert GameNotFound();
        require(idx < games[gameId].participants.length, "invalid index");
        return games[gameId].participants[idx];
    }

    /// @notice Get participant count for a game
    function getParticipantCount(uint256 gameId) external view returns (uint256) {
        if (gameId >= gameCount) revert GameNotFound();
        return games[gameId].participants.length;
    }

    /// @notice Check if a user is registered in a game
    function isRegistered(uint256 gameId, address user) external view returns (bool) {
        return playerIndex[gameId][user] != 0;
    }

    /// @notice Get a player's display name for a game
    function getPlayerName(uint256 gameId, address player) external view returns (string memory) {
        return playerNames[gameId][player];
    }

    /// @notice Get all participant names for a game
    function getParticipantNames(uint256 gameId) external view returns (string[] memory) {
        if (gameId >= gameCount) revert GameNotFound();
        address[] memory participants = games[gameId].participants;
        string[] memory names = new string[](participants.length);
        for (uint256 i = 0; i < participants.length; i++) {
            names[i] = playerNames[gameId][participants[i]];
        }
        return names;
    }

    /// @notice Get games created by an address
    function getGamesByCreator(address creator) external view returns (uint256[] memory) {
        return gamesByCreator[creator];
    }

    /// @notice Get games a player is participating in
    function getGamesByPlayer(address player) external view returns (uint256[] memory) {
        return gamesByPlayer[player];
    }

    /// @notice List games with pagination
    function listGames(
        uint256 offset,
        uint256 limit
    ) external view returns (GameInfo[] memory) {
        if (offset >= gameCount) return new GameInfo[](0);

        uint256 count = gameCount - offset;
        if (count > limit) count = limit;

        GameInfo[] memory result = new GameInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            Game storage game = games[offset + i];
            result[i] = GameInfo({
                gameId: game.gameId,
                creator: game.creator,
                name: game.name,
                createdAt: game.createdAt,
                state: uint8(game.state),
                playerCount: game.participants.length,
                hasPassword: game.hasPassword
            });
        }
        return result;
    }

    /// @notice List only open games (registration phase)
    function listOpenGames(
        uint256 offset,
        uint256 limit
    ) external view returns (GameInfo[] memory) {
        // Count open games first
        uint256 openCount = 0;
        for (uint256 i = 0; i < gameCount; i++) {
            if (games[i].state == GameState.REGISTRATION) openCount++;
        }

        if (openCount == 0 || offset >= openCount) return new GameInfo[](0);

        uint256 count = openCount - offset;
        if (count > limit) count = limit;

        GameInfo[] memory result = new GameInfo[](count);
        uint256 found = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < gameCount && found < count; i++) {
            if (games[i].state == GameState.REGISTRATION) {
                if (skipped >= offset) {
                    Game storage game = games[i];
                    result[found] = GameInfo({
                        gameId: game.gameId,
                        creator: game.creator,
                        name: game.name,
                        createdAt: game.createdAt,
                        state: uint8(game.state),
                        playerCount: game.participants.length,
                        hasPassword: game.hasPassword
                    });
                    found++;
                } else {
                    skipped++;
                }
            }
        }
        return result;
    }

    /// @notice Get destination for a player index (only after reveal)
    function getDestination(uint256 gameId, uint256 idx) external view returns (euint32) {
        if (gameId >= gameCount) revert GameNotFound();
        require(games[gameId].state == GameState.REVEALED, "not revealed");
        return destinations[gameId][idx];
    }
}
