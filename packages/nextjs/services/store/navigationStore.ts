import { create } from "zustand";

export type PageType = "home" | "game";

interface NavigationState {
  currentPage: PageType;
  selectedGameId: bigint | null;
  setCurrentPage: (page: PageType) => void;
  navigateToGame: (gameId: bigint) => void;
  navigateToHome: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: "home",
  selectedGameId: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  navigateToGame: (gameId) =>
    set({
      currentPage: "game",
      selectedGameId: gameId,
    }),
  navigateToHome: () =>
    set({
      currentPage: "home",
      selectedGameId: null,
    }),
}));
