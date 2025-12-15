// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, InEuint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// ════════════════════════════════════════════════════════════════════════════
/// SECRET SANTA - Simplified Single Contract
/// ════════════════════════════════════════════════════════════════════════════
///
/// All games are stored in mappings within this single contract.
/// No factory pattern - simpler and cheaper!
///
/// ════════════════════════════════════════════════════════════════════════════
/// FLOW
/// ════════════════════════════════════════════════════════════════════════════
///
/// CREATE GAME:
///   1. Creator encrypts entropy client-side
///   2. createGame(name, entropy) → new game ID
///   3. Creator auto-registered, share game ID with friends
///
/// JOIN GAME:
///   1. Player encrypts entropy client-side
///   2. joinGame(gameId, entropy) → registered in game
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
    }

    struct GameInfo {
        uint256 gameId;
        address creator;
        string name;
        uint256 createdAt;
        uint8 state;
        uint256 playerCount;
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

    // ══════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════

    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        string name
    );

    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event GameFinalized(uint256 indexed gameId);
    event GameRevealed(uint256 indexed gameId);

    // ══════════════════════════════════════════════════════════════
    // CREATE GAME
    // ══════════════════════════════════════════════════════════════

    /// @notice Create a new Secret Santa game
    /// @param name The name of the game
    /// @param creatorEntropy Encrypted random value for assignment randomness
    /// @return gameId The ID of the created game
    function createGame(
        string calldata name,
        InEuint32 calldata creatorEntropy
    ) external returns (uint256 gameId) {
        gameId = gameCount++;

        Game storage game = games[gameId];
        game.gameId = gameId;
        game.creator = msg.sender;
        game.name = name;
        game.createdAt = block.timestamp;
        game.state = GameState.REGISTRATION;
        game.entropy = FHE.asEuint32(creatorEntropy);
        FHE.allowThis(game.entropy);

        // Auto-register creator
        game.participants.push(msg.sender);
        playerIndex[gameId][msg.sender] = 1; // 1-indexed

        gamesByCreator[msg.sender].push(gameId);
        gamesByPlayer[msg.sender].push(gameId);

        emit GameCreated(gameId, msg.sender, name);
    }

    // ══════════════════════════════════════════════════════════════
    // JOIN GAME
    // ══════════════════════════════════════════════════════════════

    /// @notice Join a game by ID
    /// @param gameId The ID of the game to join
    /// @param userEntropy Encrypted random value for assignment randomness
    function joinGame(
        uint256 gameId,
        InEuint32 calldata userEntropy
    ) external {
        require(gameId < gameCount, "game not found");
        Game storage game = games[gameId];

        require(game.state == GameState.REGISTRATION, "not registration phase");
        require(playerIndex[gameId][msg.sender] == 0, "already registered");

        // Add player
        game.participants.push(msg.sender);
        playerIndex[gameId][msg.sender] = game.participants.length; // 1-indexed

        // XOR entropy for combined randomness
        game.entropy = FHE.xor(game.entropy, FHE.asEuint32(userEntropy));
        FHE.allowThis(game.entropy);

        gamesByPlayer[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender);
    }

    // ══════════════════════════════════════════════════════════════
    // FINALIZE GAME (LCG Permutation)
    // ══════════════════════════════════════════════════════════════

    /// @notice Finalize a game and generate encrypted assignments (creator only)
    /// @param gameId The ID of the game to finalize
    function finalizeGame(uint256 gameId) external {
        require(gameId < gameCount, "game not found");
        Game storage game = games[gameId];

        require(msg.sender == game.creator, "not creator");
        require(game.state == GameState.REGISTRATION, "not registration phase");
        require(game.participants.length >= 3, "need at least 3 players");

        uint256 n = game.participants.length;
        euint32 nEnc = FHE.asEuint32(uint32(n));

        // Random shift: dest[i] = (i + shift) mod n, shift ∈ [1, n-1]
        // Guarantees no self-assignments (since shift != 0)
        // Pattern is deducible but not sequential in participant order
        // since participant join order is already semi-random
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
        require(gameId < gameCount, "game not found");
        Game storage game = games[gameId];

        require(msg.sender == game.creator, "not creator");
        require(game.state == GameState.ACTIVE, "not active");

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
        require(gameId < gameCount, "game not found");
        Game storage game = games[gameId];

        require(game.state != GameState.REGISTRATION, "game not started");

        uint256 idx = playerIndex[gameId][msg.sender];
        require(idx != 0, "not registered");

        return destinations[gameId][idx - 1]; // Convert from 1-indexed
    }

    /// @notice Get game info
    function getGame(uint256 gameId) external view returns (GameInfo memory) {
        require(gameId < gameCount, "game not found");
        Game storage game = games[gameId];

        return GameInfo({
            gameId: game.gameId,
            creator: game.creator,
            name: game.name,
            createdAt: game.createdAt,
            state: uint8(game.state),
            playerCount: game.participants.length
        });
    }

    /// @notice Get all participants in a game
    function getParticipants(uint256 gameId) external view returns (address[] memory) {
        require(gameId < gameCount, "game not found");
        return games[gameId].participants;
    }

    /// @notice Get a specific participant by index
    function getParticipant(uint256 gameId, uint256 idx) external view returns (address) {
        require(gameId < gameCount, "game not found");
        require(idx < games[gameId].participants.length, "invalid index");
        return games[gameId].participants[idx];
    }

    /// @notice Get participant count for a game
    function getParticipantCount(uint256 gameId) external view returns (uint256) {
        require(gameId < gameCount, "game not found");
        return games[gameId].participants.length;
    }

    /// @notice Check if a user is registered in a game
    function isRegistered(uint256 gameId, address user) external view returns (bool) {
        return playerIndex[gameId][user] != 0;
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
                playerCount: game.participants.length
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
                        playerCount: game.participants.length
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
        require(gameId < gameCount, "game not found");
        require(games[gameId].state == GameState.REVEALED, "not revealed");
        return destinations[gameId][idx];
    }
}
