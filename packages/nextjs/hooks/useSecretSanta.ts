"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Encryptable, FheTypes, cofhejs } from "cofhejs/web";
import { useCofheStore } from "@/services/store/cofheStore";
import { useSecretSantaStore } from "@/services/store/secretSantaStore";
import {
  CONTRACT_ADDRESS,
  SECRET_SANTA_ABI,
  GameInfo,
  GameState,
  generateEntropy,
  hashPassword,
} from "@/utils/secretSantaContract";

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Extract clean error message from verbose blockchain errors
// ═══════════════════════════════════════════════════════════════════════════

function parseError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  // Common patterns to extract the main error
  const patterns = [
    // User rejection
    /User rejected the request/i,
    /user rejected/i,
    /rejected by user/i,
    // Contract errors
    /reverted with reason string ['"](.+?)['"]/i,
    /execution reverted: (.+?)(?:\n|$)/i,
    /reason: (.+?)(?:\n|$)/i,
    // Custom errors from contract
    /InvalidPassword/i,
    /DecryptionNotReady/i,
    /NoPendingJoin/i,
    /AlreadyRegistered/i,
    /NotRegistrationPhase/i,
    /GameNotFound/i,
    /PendingJoinExists/i,
    // Insufficient funds
    /insufficient funds/i,
    // Network errors
    /network error/i,
    /could not connect/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      // Return the captured group if exists, otherwise the full match
      const result = match[1] || match[0];
      // Clean up and capitalize first letter
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  }

  // If no pattern matched, try to find "Details:" line
  const detailsMatch = message.match(/Details:\s*(.+?)(?:\n|$)/i);
  if (detailsMatch) {
    return detailsMatch[1].trim();
  }

  // Fallback: return a generic message if the error is too long
  if (message.length > 100) {
    return "Transaction failed. Please try again.";
  }

  return message;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useContractAddress - Get the contract address for current chain
// ═══════════════════════════════════════════════════════════════════════════

export function useContractAddress(): `0x${string}` | undefined {
  const { chain } = useAccount();
  // Only Base Sepolia is supported
  if (chain?.id === 84532) {
    return CONTRACT_ADDRESS;
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useGameInfo - Fetch a single game's info
// ═══════════════════════════════════════════════════════════════════════════

export function useGameInfo(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGameInfo = useCallback(async () => {
    if (!publicClient || !contractAddress || gameId === null) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getGame",
        args: [gameId],
      });

      const game: GameInfo = {
        gameId: result.gameId,
        creator: result.creator as `0x${string}`,
        name: result.name,
        createdAt: result.createdAt,
        state: result.state as GameState,
        playerCount: result.playerCount,
        hasPassword: result.hasPassword,
      };

      setGameInfo(game);
      return game;
    } catch (err) {
      setError(parseError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, gameId]);

  return { gameInfo, isLoading, error, fetchGameInfo };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useMyGames - Fetch games the user is participating in
// ═══════════════════════════════════════════════════════════════════════════

export function useMyGames() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { addGame } = useSecretSantaStore();
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyGames = useCallback(async () => {
    if (!publicClient || !contractAddress || !chain || !address) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the contract's getGamesByPlayer function
      const gameIds = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getGamesByPlayer",
        args: [address],
      });

      if (!gameIds || gameIds.length === 0) {
        setGames([]);
        return [];
      }

      // Fetch info for each game
      const myGames: GameInfo[] = [];

      for (const gameId of gameIds) {
        try {
          const gameInfo = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "getGame",
            args: [gameId],
          });

          const game: GameInfo = {
            gameId: gameInfo.gameId,
            creator: gameInfo.creator as `0x${string}`,
            name: gameInfo.name,
            createdAt: gameInfo.createdAt,
            state: gameInfo.state as GameState,
            playerCount: gameInfo.playerCount,
            hasPassword: gameInfo.hasPassword,
          };
          myGames.push(game);

          // Sync to local store
          addGame({
            gameId: game.gameId.toString(),
            creator: game.creator,
            name: game.name,
            createdAt: Number(game.createdAt),
            chainId: chain.id,
            joinedAt: Date.now(),
          });
        } catch {
          // Skip games that fail to fetch
          continue;
        }
      }

      setGames(myGames);
      return myGames;
    } catch (err) {
      setError(parseError(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, chain, address, addGame]);

  return { games, isLoading, error, fetchMyGames };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useCreateGame - Create a new Secret Santa game (with optional password)
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateGame() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { isInitialized } = useCofheStore();
  const { addGame } = useSecretSantaStore();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = useCallback(
    async (gameName: string, password?: string) => {
      if (!contractAddress || !address || !chain || !publicClient) {
        setError("Wallet not connected or wrong network");
        return null;
      }

      if (!isInitialized) {
        setError("CoFHE not initialized");
        return null;
      }

      setError(null);
      setIsSuccess(false);

      try {
        // Generate and encrypt entropy
        const entropy = generateEntropy();
        console.log("Generated entropy:", entropy);

        // Determine if we have a password
        const hasPassword = password !== undefined && password.length > 0;
        const passwordValue = hasPassword ? BigInt(hashPassword(password)) : BigInt(0);

        // Encrypt both entropy and password
        const encrypted = await cofhejs.encrypt([
          Encryptable.uint32(entropy),
          Encryptable.uint32(passwordValue),
        ]);
        console.log("Encryption result:", encrypted);

        if (!encrypted.success || !encrypted.data) {
          setError("Failed to encrypt data: " + (encrypted.error || "Unknown error"));
          return null;
        }

        const encryptedEntropy = encrypted.data[0];
        const encryptedPassword = encrypted.data[1];
        console.log("Creating game with password:", hasPassword);

        // Create the game
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "createGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameName, encryptedEntropy as any, encryptedPassword as any, hasPassword],
        });
        console.log("Transaction hash:", hash);

        // Wait for transaction confirmation
        setIsConfirming(true);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setIsConfirming(false);

        if (receipt.status === "success") {
          // Get the game count to determine the new game ID (it's count - 1)
          const gameCount = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "gameCount",
          });

          const newGameId = gameCount - BigInt(1);

          // Fetch the game info
          const gameInfo = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "getGame",
            args: [newGameId],
          });

          // Save to local store
          addGame({
            gameId: newGameId.toString(),
            creator: gameInfo.creator as string,
            name: gameInfo.name,
            createdAt: Number(gameInfo.createdAt),
            chainId: chain.id,
            joinedAt: Date.now(),
          });

          setIsSuccess(true);
        }

        return hash;
      } catch (err) {
        setIsConfirming(false);
        setError(parseError(err));
        return null;
      }
    },
    [contractAddress, address, chain, isInitialized, writeContractAsync, publicClient, addGame]
  );

  return {
    createGame,
    txHash,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Join Step type for tracking 2-step join process
// ═══════════════════════════════════════════════════════════════════════════

export type JoinStep = "idle" | "requesting" | "waiting" | "completing" | "done" | "error";

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useJoinGame - Join an existing game (2-step for password games)
// ═══════════════════════════════════════════════════════════════════════════

export function useJoinGame() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { isInitialized } = useCofheStore();
  const { addGame } = useSecretSantaStore();
  const { writeContractAsync, isPending } = useWriteContract();
  const [step, setStep] = useState<JoinStep>("idle");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState<bigint | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setIsSuccess(false);
    setCurrentGameId(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const requestJoin = useCallback(
    async (gameId: bigint, password?: string) => {
      if (!contractAddress || !address || !chain || !publicClient) {
        setError("Wallet not connected or wrong network");
        setStep("error");
        return null;
      }

      if (!isInitialized) {
        setError("CoFHE not initialized");
        setStep("error");
        return null;
      }

      setError(null);
      setIsSuccess(false);
      setStep("requesting");
      setCurrentGameId(gameId);

      try {
        // Check if game requires password
        const gameInfo = await publicClient.readContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "getGame",
          args: [gameId],
        });

        const gameHasPassword = gameInfo.hasPassword;

        // Generate entropy and password hash
        const entropy = generateEntropy();
        const passwordValue = password ? BigInt(hashPassword(password)) : BigInt(0);

        // Encrypt both
        const encrypted = await cofhejs.encrypt([
          Encryptable.uint32(passwordValue),
          Encryptable.uint32(entropy),
        ]);

        if (!encrypted.success || !encrypted.data) {
          setError("Failed to encrypt data");
          setStep("error");
          return null;
        }

        const encryptedPassword = encrypted.data[0];
        const encryptedEntropy = encrypted.data[1];

        // Request to join
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "requestJoinGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameId, encryptedPassword as any, encryptedEntropy as any],
        });

        // Wait for transaction
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          setError("Transaction failed");
          setStep("error");
          return null;
        }

        // For public games, we're done immediately
        if (!gameHasPassword) {
          // Save to local store
          addGame({
            gameId: gameId.toString(),
            creator: gameInfo.creator as string,
            name: gameInfo.name,
            createdAt: Number(gameInfo.createdAt),
            chainId: chain.id,
            joinedAt: Date.now(),
          });
          setIsSuccess(true);
          setStep("done");
          return hash;
        }

        // For password games, start polling
        setStep("waiting");
        startPolling(gameId);

        return hash;
      } catch (err) {
        setError(parseError(err));
        setStep("error");
        return null;
      }
    },
    [contractAddress, address, chain, isInitialized, writeContractAsync, publicClient, addGame]
  );

  const startPolling = useCallback(
    (gameId: bigint) => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      pollingRef.current = setInterval(async () => {
        if (!publicClient || !contractAddress || !address) return;

        try {
          const status = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "getJoinStatus",
            args: [gameId, address],
          });

          const [hasPending, isDecrypted, isRegistered] = status as [boolean, boolean, boolean];

          if (isRegistered) {
            // Already joined (shouldn't happen but handle it)
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsSuccess(true);
            setStep("done");
            return;
          }

          if (hasPending && isDecrypted) {
            // Ready to complete
            if (pollingRef.current) clearInterval(pollingRef.current);
            completeJoin(gameId);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Poll every 3 seconds
    },
    [publicClient, contractAddress, address]
  );

  const completeJoin = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress || !publicClient || !chain || !address) return;

      setStep("completing");

      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "completeJoinGame",
          args: [gameId],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          // Fetch game info and save
          const gameInfo = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "getGame",
            args: [gameId],
          });

          addGame({
            gameId: gameId.toString(),
            creator: gameInfo.creator as string,
            name: gameInfo.name,
            createdAt: Number(gameInfo.createdAt),
            chainId: chain.id,
            joinedAt: Date.now(),
          });

          setIsSuccess(true);
          setStep("done");
        } else {
          setError("Complete join transaction failed");
          setStep("error");
        }
      } catch (err) {
        setError(parseError(err));
        setStep("error");
      }
    },
    [contractAddress, publicClient, chain, address, writeContractAsync, addGame]
  );

  return {
    requestJoin,
    reset,
    step,
    currentGameId,
    isLoading: isPending || step === "requesting" || step === "waiting" || step === "completing",
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useFinalizeGame - Finalize a game (creator only)
// ═══════════════════════════════════════════════════════════════════════════

export function useFinalizeGame() {
  const contractAddress = useContractAddress();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [error, setError] = useState<string | null>(null);

  const finalizeGame = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress) {
        setError("Wrong network");
        return null;
      }

      setError(null);

      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "finalizeGame",
          args: [gameId],
        });

        return hash;
      } catch (err) {
        setError(parseError(err));
        return null;
      }
    },
    [contractAddress, writeContractAsync]
  );

  return {
    finalizeGame,
    txHash,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useRevealGame - Reveal all assignments (creator only)
// ═══════════════════════════════════════════════════════════════════════════

export function useRevealGame() {
  const contractAddress = useContractAddress();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [error, setError] = useState<string | null>(null);

  const revealGame = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress) {
        setError("Wrong network");
        return null;
      }

      setError(null);

      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "revealGame",
          args: [gameId],
        });

        return hash;
      } catch (err) {
        setError(parseError(err));
        return null;
      }
    },
    [contractAddress, writeContractAsync]
  );

  return {
    revealGame,
    txHash,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useParticipants - Get game participants
// ═══════════════════════════════════════════════════════════════════════════

export function useParticipants(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const [participants, setParticipants] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!publicClient || !contractAddress || gameId === null) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getParticipants",
        args: [gameId],
      });

      setParticipants(result as `0x${string}`[]);
      return result as `0x${string}`[];
    } catch (err) {
      setError(parseError(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, gameId]);

  return { participants, isLoading, error, fetchParticipants };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useIsRegistered - Check if user is registered in a game
// ═══════════════════════════════════════════════════════════════════════════

export function useIsRegistered(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const { address } = useAccount();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkRegistration = useCallback(async () => {
    if (!publicClient || !contractAddress || !address || gameId === null) {
      return false;
    }

    setIsLoading(true);

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "isRegistered",
        args: [gameId, address],
      });

      setIsRegistered(result as boolean);
      return result as boolean;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, address, gameId]);

  return { isRegistered, isLoading, checkRegistration };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useMyTarget - Get and unseal the user's encrypted target
// ═══════════════════════════════════════════════════════════════════════════

export function useMyTarget(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const { address } = useAccount();
  const { isInitialized } = useCofheStore();
  const [encryptedIndex, setEncryptedIndex] = useState<bigint | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyTarget = useCallback(async () => {
    if (!publicClient || !contractAddress || !address || gameId === null) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the encrypted target index
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getMyTarget",
        args: [gameId],
        account: address,
      });

      setEncryptedIndex(result as bigint);
      return result as bigint;
    } catch (err) {
      setError(parseError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, address, gameId]);

  const unsealTarget = useCallback(async () => {
    if (!encryptedIndex || !isInitialized) {
      setError("No encrypted target or CoFHE not initialized");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await cofhejs.unseal(encryptedIndex, FheTypes.Uint32);

      if (result.success && result.data !== undefined) {
        const index = Number(result.data);
        setTargetIndex(index);
        return index;
      } else {
        setError("Failed to unseal target - do you have a valid permit?");
        return null;
      }
    } catch (err) {
      setError(parseError(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [encryptedIndex, isInitialized]);

  return {
    encryptedIndex,
    targetIndex,
    isLoading,
    error,
    fetchMyTarget,
    unsealTarget,
  };
}

// Re-export types and utils
export { GameState, gameStateLabels, generateEntropy, hashPassword } from "@/utils/secretSantaContract";
export type { GameInfo } from "@/utils/secretSantaContract";
