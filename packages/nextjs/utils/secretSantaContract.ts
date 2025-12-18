// Secret Santa Contract - deployed on Arbitrum Sepolia
// TODO: Update this address after deploying the updated contract with name support
export const CONTRACT_ADDRESS =
  "0xEf021E90f4409f6f37d5fd0947dCBD10a5A76393" as const;

// Game states
export enum GameState {
  REGISTRATION = 0,
  ACTIVE = 1,
  REVEALED = 2,
}

export const gameStateLabels: Record<GameState, string> = {
  [GameState.REGISTRATION]: "Registration",
  [GameState.ACTIVE]: "Active",
  [GameState.REVEALED]: "Revealed",
};

// Types matching the contract
export interface GameInfo {
  gameId: bigint;
  creator: `0x${string}`;
  name: string;
  createdAt: bigint;
  state: GameState;
  playerCount: bigint;
  hasPassword: boolean;
}

// Join status from getJoinStatus
export interface JoinStatus {
  hasPending: boolean;
  isDecrypted: boolean;
  isRegistered: boolean;
}

// Simplified SecretSanta ABI (single contract with password support)
export const SECRET_SANTA_ABI = [
  // Custom Errors
  { inputs: [], name: "AlreadyRegistered", type: "error" },
  { inputs: [], name: "DecryptionNotReady", type: "error" },
  { inputs: [], name: "GameNotFound", type: "error" },
  { inputs: [], name: "GameNotStarted", type: "error" },
  {
    inputs: [
      { internalType: "uint8", name: "got", type: "uint8" },
      { internalType: "uint8", name: "expected", type: "uint8" },
    ],
    name: "InvalidEncryptedInput",
    type: "error",
  },
  { inputs: [], name: "InvalidPassword", type: "error" },
  { inputs: [], name: "NeedAtLeast3Players", type: "error" },
  { inputs: [], name: "NoPendingJoin", type: "error" },
  { inputs: [], name: "NotActive", type: "error" },
  { inputs: [], name: "NotCreator", type: "error" },
  { inputs: [], name: "NotRegistered", type: "error" },
  { inputs: [], name: "NotRegistrationPhase", type: "error" },
  {
    inputs: [{ internalType: "int32", name: "value", type: "int32" }],
    name: "SecurityZoneOutOfBounds",
    type: "error",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      {
        indexed: false,
        internalType: "bool",
        name: "hasPassword",
        type: "bool",
      },
    ],
    name: "GameCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      { indexed: false, internalType: "string", name: "name", type: "string" },
    ],
    name: "PlayerJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "JoinRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
    ],
    name: "GameFinalized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
    ],
    name: "GameRevealed",
    type: "event",
  },

  // View functions
  {
    inputs: [],
    name: "gameCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getGame",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "gameId", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint8", name: "state", type: "uint8" },
          { internalType: "uint256", name: "playerCount", type: "uint256" },
          { internalType: "bool", name: "hasPassword", type: "bool" },
        ],
        internalType: "struct SecretSanta.GameInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getParticipants",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "uint256", name: "idx", type: "uint256" },
    ],
    name: "getParticipant",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getParticipantCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
    ],
    name: "getPlayerName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getParticipantNames",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" },
    ],
    name: "getJoinStatus",
    outputs: [
      { internalType: "bool", name: "hasPending", type: "bool" },
      { internalType: "bool", name: "isDecrypted", type: "bool" },
      { internalType: "bool", name: "isRegistered", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "getGamesByCreator",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getGamesByPlayer",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" },
    ],
    name: "listGames",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "gameId", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint8", name: "state", type: "uint8" },
          { internalType: "uint256", name: "playerCount", type: "uint256" },
          { internalType: "bool", name: "hasPassword", type: "bool" },
        ],
        internalType: "struct SecretSanta.GameInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "offset", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" },
    ],
    name: "listOpenGames",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "gameId", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint8", name: "state", type: "uint8" },
          { internalType: "uint256", name: "playerCount", type: "uint256" },
          { internalType: "bool", name: "hasPassword", type: "bool" },
        ],
        internalType: "struct SecretSanta.GameInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "getMyTarget",
    outputs: [{ internalType: "euint32", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "uint256", name: "idx", type: "uint256" },
    ],
    name: "getDestination",
    outputs: [{ internalType: "euint32", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Write functions
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "creatorName", type: "string" },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint32",
        name: "creatorEntropy",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint32",
        name: "password",
        type: "tuple",
      },
      { internalType: "bool", name: "hasPassword", type: "bool" },
    ],
    name: "createGame",
    outputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "string", name: "playerName", type: "string" },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint32",
        name: "password",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint32",
        name: "userEntropy",
        type: "tuple",
      },
    ],
    name: "requestJoinGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "completeJoinGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "finalizeGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "revealGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Helper to generate random entropy for FHE
export function generateEntropy(): bigint {
  return BigInt(Math.floor(Math.random() * 0xffffffff));
}

// Helper to hash a password string to uint32
export function hashPassword(password: string): number {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash = hash & 0xffffffff; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
