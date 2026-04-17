"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import { getCofheClient } from "@/services/cofhe-client";
import { useCofheStore } from "@/services/store/cofheStore";

const subscribePermits = (listener: () => void) => {
  try {
    return getCofheClient().permits.subscribe(listener);
  } catch {
    return () => {};
  }
};

const getPermitsSnapshot = () => {
  try {
    return getCofheClient().permits.getSnapshot();
  } catch {
    return null;
  }
};

export function usePermit() {
  const { address, chainId } = useAccount();
  const { isInitialized: isCofheInitialized } = useCofheStore();

  const [isGeneratingPermit, setIsGeneratingPermit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-render when permits store changes
  useSyncExternalStore(subscribePermits, getPermitsSnapshot, () => null);

  const hasValidPermit = (() => {
    if (!isCofheInitialized || !address || !chainId) return false;
    try {
      return !!getCofheClient().permits.getActivePermit(chainId, address);
    } catch {
      return false;
    }
  })();

  const checkPermit = useCallback(() => hasValidPermit, [hasValidPermit]);

  const generatePermit = useCallback(async () => {
    if (!isCofheInitialized || !address || isGeneratingPermit) {
      return { success: false, error: "Not ready to generate permit" };
    }

    try {
      setIsGeneratingPermit(true);
      setError(null);

      const permitName = "Secret Santa";
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      await getCofheClient().permits.getOrCreateSelfPermit(undefined, undefined, {
        issuer: address,
        name: permitName,
        expiration: Math.round(expirationDate.getTime() / 1000),
      });

      return { success: true as const };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error generating permit";
      setError(errorMessage);
      return { success: false as const, error: errorMessage };
    } finally {
      setIsGeneratingPermit(false);
    }
  }, [isCofheInitialized, address, isGeneratingPermit]);

  const removePermit = useCallback(async () => {
    if (!isCofheInitialized || !chainId || !address) return false;

    try {
      const client = getCofheClient();
      const active = client.permits.getActivePermitHash(chainId, address);
      if (!active) return false;

      client.permits.removePermit(active, chainId, address);
      setError(null);
      return true;
    } catch (err) {
      console.error("Error removing permit:", err);
      setError("Failed to remove permit");
      return false;
    }
  }, [isCofheInitialized, chainId, address]);

  return {
    hasValidPermit,
    isGeneratingPermit,
    error,
    generatePermit,
    checkPermit,
    removePermit,
  };
}
