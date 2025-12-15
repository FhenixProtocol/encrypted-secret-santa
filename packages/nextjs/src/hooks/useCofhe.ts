"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import {
  Encryptable,
  FheTypes,
  Permit,
  PermitOptions,
  cofhejs,
  permitStore,
} from "cofhejs/web";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useCofheStore } from "~/services/store/cofheStore";

interface CofheConfig {
  environment: "TESTNET" | "MAINNET";
  coFheUrl?: string;
  verifierUrl?: string;
  thresholdNetworkUrl?: string;
  ignoreErrors?: boolean;
  generatePermit?: boolean;
}

export function useCofhe(config?: Partial<CofheConfig>) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  const {
    isInitialized: globalIsInitialized,
    setIsInitialized: setGlobalIsInitialized,
  } = useCofheStore();

  const chainId = publicClient?.chain?.id;
  const accountAddress = walletClient?.account?.address;

  const [isInitializing, setIsInitializing] = useState(false);
  const [isGeneratingPermit, setIsGeneratingPermit] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permit, setPermit] = useState<Permit | undefined>(undefined);

  // Browser check
  const isBrowser = typeof window !== "undefined";

  // Reset on chain/account change
  useEffect(() => {
    setGlobalIsInitialized(false);
  }, [chainId, accountAddress, setGlobalIsInitialized]);

  // Initialize when wallet connected
  useEffect(() => {
    if (!isBrowser || !isConnected) return;

    const initialize = async () => {
      if (globalIsInitialized || isInitializing || !publicClient || !walletClient)
        return;

      try {
        setIsInitializing(true);

        const result = await cofhejs.initializeWithViem({
          viemClient: publicClient,
          viemWalletClient: walletClient,
          environment: "TESTNET",
          verifierUrl: config?.verifierUrl,
          coFheUrl: config?.coFheUrl,
          thresholdNetworkUrl: config?.thresholdNetworkUrl,
          ignoreErrors: config?.ignoreErrors ?? false,
          generatePermit: config?.generatePermit ?? false,
        });

        if (result.success) {
          console.log("Cofhe initialized successfully");
          setGlobalIsInitialized(true);
          setPermit(result.data);
          setError(null);
        } else {
          setError(new Error(result.error.message || String(result.error)));
        }
      } catch (err) {
        console.error("Failed to initialize Cofhe:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [
    isConnected,
    walletClient,
    publicClient,
    chainId,
    accountAddress,
    globalIsInitialized,
    isInitializing,
    isBrowser,
    config?.coFheUrl,
    config?.generatePermit,
    config?.ignoreErrors,
    config?.thresholdNetworkUrl,
    config?.verifierUrl,
    setGlobalIsInitialized,
  ]);

  // Create permit function
  const createPermit = useCallback(
    async (permitOptions?: PermitOptions) => {
      if (!globalIsInitialized || !accountAddress) {
        return { success: false, error: "Not initialized or not connected" };
      }

      try {
        setIsGeneratingPermit(true);
        setError(null);

        const result = await cofhejs.createPermit(permitOptions);

        if (result.success) {
          setPermit(result.data);
          return result;
        } else {
          setError(new Error(result.error.message || String(result.error)));
          return result;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(new Error(errorMessage));
        return { success: false, error: { message: errorMessage } };
      } finally {
        setIsGeneratingPermit(false);
      }
    },
    [globalIsInitialized, accountAddress]
  );

  // Return everything needed
  const { createPermit: _, ...cofhejsWithoutCreatePermit } = cofhejs;

  return {
    isInitialized: globalIsInitialized,
    isInitializing,
    isGeneratingPermit,
    error,
    permit,
    createPermit,
    ...cofhejsWithoutCreatePermit,
    FheTypes,
    Encryptable,
  };
}

// Helper hooks for reading internal state
export const useCofhejsInitialized = () => {
  const getState = () => {
    const state = cofhejs.store.getState();
    return state.providerInitialized && state.signerInitialized && state.fheKeysInitialized;
  };

  return useSyncExternalStore(
    cofhejs.store.subscribe,
    getState,
    () => false
  );
};

export const useCofhejsAccount = () => {
  return useSyncExternalStore(
    cofhejs.store.subscribe,
    () => cofhejs.store.getState().account,
    () => null
  );
};

export { FheTypes } from "cofhejs/web";
