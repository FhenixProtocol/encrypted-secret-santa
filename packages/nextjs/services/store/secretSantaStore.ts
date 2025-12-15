import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoredGameInfo {
  gameId: string; // Stored as string for JSON serialization
  creator: string;
  name: string;
  createdAt: number;
  chainId: number;
  joinedAt: number; // When user joined/created
}

interface SecretSantaState {
  games: StoredGameInfo[];
  addGame: (game: StoredGameInfo) => void;
  removeGame: (gameId: string) => void;
  getGamesByChain: (chainId: number) => StoredGameInfo[];
  getGamesByUser: (userAddress: string) => StoredGameInfo[];
  hasGame: (gameId: string, chainId: number) => boolean;
  clearAll: () => void;
}

export const useSecretSantaStore = create<SecretSantaState>()(
  persist(
    (set, get) => ({
      games: [],

      addGame: (game: StoredGameInfo) =>
        set((state) => {
          // Don't add if already exists
          const exists = state.games.some(
            (g) => g.gameId === game.gameId && g.chainId === game.chainId
          );
          if (exists) return state;
          return { games: [game, ...state.games] };
        }),

      removeGame: (gameId: string) =>
        set((state) => ({
          games: state.games.filter((game) => game.gameId !== gameId),
        })),

      getGamesByChain: (chainId: number) => {
        return get().games.filter((game) => game.chainId === chainId);
      },

      getGamesByUser: (userAddress: string) => {
        return get().games.filter(
          (game) => game.creator.toLowerCase() === userAddress.toLowerCase()
        );
      },

      hasGame: (gameId: string, chainId: number) => {
        return get().games.some(
          (g) => g.gameId === gameId && g.chainId === chainId
        );
      },

      clearAll: () => set({ games: [] }),
    }),
    {
      name: "secret-santa-games-storage",
    }
  )
);
