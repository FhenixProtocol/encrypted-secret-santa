"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import type { Permit } from "@cofhe/sdk/permits";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { cofheClient, getCofheClient } from "@/services/cofhe-client";
import { useCofheStore } from "@/services/store/cofheStore";

export function useCofhe() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  const { setIsInitialized: setGlobalIsInitialized } = useCofheStore();

  const chainId = publicClient?.chain?.id;
  const accountAddress = walletClient?.account?.address;

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isBrowser = typeof window !== "undefined";

  // Connect when wallet is ready; reconnect on chain/account change.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isBrowser || !isConnected || !publicClient || !walletClient) {
      setGlobalIsInitialized(false);
      return;
    }

    let cancelled = false;
    setIsInitializing(true);
    setError(null);

    cofheClient
      .connect(publicClient, walletClient)
      .then(() => {
        if (cancelled) return;
        setGlobalIsInitialized(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setGlobalIsInitialized(false);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isConnected, publicClient, walletClient, chainId, accountAddress, isBrowser, setGlobalIsInitialized]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isInitialized = useCofheConnected();

  return {
    isInitialized,
    isInitializing,
    error,
    FheTypes,
    Encryptable,
  };
}

// Subscribe to CoFHE client connection state
const getConnectionSnapshot = () => {
  try {
    return getCofheClient().getSnapshot();
  } catch {
    return null;
  }
};

const subscribeConnection = (listener: () => void) => {
  try {
    return getCofheClient().subscribe(listener);
  } catch {
    return () => {};
  }
};

export const useCofheConnected = () => {
  const state = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    () => null
  );
  return !!state?.connected;
};

export const useCofheAccount = () => {
  const state = useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    () => null
  );
  return state?.account ?? null;
};

// Subscribe to permit store
const getPermitsSnapshot = () => {
  try {
    return getCofheClient().permits.getSnapshot();
  } catch {
    return null;
  }
};

const subscribePermits = (listener: () => void) => {
  try {
    return getCofheClient().permits.subscribe(listener);
  } catch {
    return () => {};
  }
};

export const useCofheActivePermit = (): Permit | undefined => {
  const connected = useCofheConnected();
  const { address, chainId } = useAccount();
  // Drive re-renders off the permits store snapshot
  useSyncExternalStore(subscribePermits, getPermitsSnapshot, () => null);

  return useMemo(() => {
    if (!connected || !address || !chainId) return undefined;
    try {
      return getCofheClient().permits.getActivePermit(chainId, address);
    } catch {
      return undefined;
    }
  }, [connected, address, chainId]);
};

export const useCofheActivePermitHash = (): string | undefined => {
  const connected = useCofheConnected();
  const { address, chainId } = useAccount();
  useSyncExternalStore(subscribePermits, getPermitsSnapshot, () => null);

  return useMemo(() => {
    if (!connected || !address || !chainId) return undefined;
    try {
      return getCofheClient().permits.getActivePermitHash(chainId, address);
    } catch {
      return undefined;
    }
  }, [connected, address, chainId]);
};

export const useCofheAllPermits = (): Permit[] | undefined => {
  const connected = useCofheConnected();
  const { address, chainId } = useAccount();
  useSyncExternalStore(subscribePermits, getPermitsSnapshot, () => null);

  return useMemo(() => {
    if (!connected || !address || !chainId) return undefined;
    try {
      const permits = getCofheClient().permits.getPermits(chainId, address);
      return Object.values(permits ?? {});
    } catch {
      return undefined;
    }
  }, [connected, address, chainId]);
};

// Per-address active permit map (preserves compatibility with old useCofhejsActivePermitHashes consumers)
export const useCofheActivePermitHashes = (): Record<Address, string | undefined> => {
  const activeHash = useCofheActivePermitHash();
  const { address } = useAccount();
  return useMemo(() => {
    if (!address) return {} as Record<Address, string | undefined>;
    return { [address as Address]: activeHash } as Record<Address, string | undefined>;
  }, [address, activeHash]);
};

export { FheTypes, Encryptable } from "@cofhe/sdk";
