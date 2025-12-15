// Tab types for navigation
export type TabType = "home" | "actions" | "wallet";

// Status types
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

// FHE status
export type FheStatus = "uninitialized" | "initializing" | "ready" | "error";

// Frame context user info
export interface FrameUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

// Contract info
export interface ContractInfo {
  address: `0x${string}`;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
}
