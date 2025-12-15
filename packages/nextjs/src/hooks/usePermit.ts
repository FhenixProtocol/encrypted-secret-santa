"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import { cofhejs, permitStore } from "cofhejs/web";
import { useCofheStore } from "~/services/store/cofheStore";

// Check permit validity
const getPermitSnapshot = () => {
  const permitResult = cofhejs?.getPermit();
  return !!(permitResult?.success && permitResult?.data);
};

export function usePermit() {
  const { address, chainId } = useAccount();
  const { isInitialized: isCofheInitialized } = useCofheStore();

  const [isGeneratingPermit, setIsGeneratingPermit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to permit state changes
  const hasValidPermit = useSyncExternalStore(
    permitStore.store.subscribe,
    () => (isCofheInitialized ? getPermitSnapshot() : false),
    () => false // Server snapshot
  );

  // Generate new permit
  const generatePermit = useCallback(async () => {
    if (!isCofheInitialized || !address || isGeneratingPermit) {
      return { success: false, error: "Not ready" };
    }

    try {
      setIsGeneratingPermit(true);
      setError(null);

      // Set expiration 30 days from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const result = await cofhejs.createPermit({
        type: "self",
        name: "Encrypted Santa",
        issuer: address,
        expiration: Math.round(expirationDate.getTime() / 1000),
      });

      if (result?.success) {
        return { success: true };
      } else {
        const errorMessage = result?.error?.message || "Failed to create permit";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGeneratingPermit(false);
    }
  }, [isCofheInitialized, address, isGeneratingPermit]);

  // Remove permit
  const removePermit = useCallback(async () => {
    if (!isCofheInitialized || !chainId || !address) {
      return false;
    }

    try {
      const allPermits = permitStore.getPermits(chainId.toString(), address);
      if (allPermits && Object.keys(allPermits).length > 0) {
        const permitHash = Object.keys(allPermits)[0];
        permitStore.removePermit(chainId.toString(), address, permitHash, true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error removing permit:", err);
      return false;
    }
  }, [isCofheInitialized, chainId, address]);

  return {
    hasValidPermit,
    isGeneratingPermit,
    error,
    generatePermit,
    removePermit,
  };
}
