import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeployedContract {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  isShielded: boolean;
  deployer: string;
  chainId: number;
  transactionHash: string;
  deployedAt: number;
}

interface DeployedContractsState {
  contracts: DeployedContract[];
  addContract: (contract: DeployedContract) => void;
  removeContract: (address: string) => void;
  getContractsByChain: (chainId: number) => DeployedContract[];
  clearAll: () => void;
}

export const useDeployedContractsStore = create<DeployedContractsState>()(
  persist(
    (set, get) => ({
      contracts: [],

      addContract: (contract) =>
        set((state) => ({
          contracts: [contract, ...state.contracts],
        })),

      removeContract: (address) =>
        set((state) => ({
          contracts: state.contracts.filter(
            (c) => c.address.toLowerCase() !== address.toLowerCase()
          ),
        })),

      getContractsByChain: (chainId) => {
        return get().contracts.filter((c) => c.chainId === chainId);
      },

      clearAll: () => set({ contracts: [] }),
    }),
    {
      name: "deployed-contracts-storage",
    }
  )
);
