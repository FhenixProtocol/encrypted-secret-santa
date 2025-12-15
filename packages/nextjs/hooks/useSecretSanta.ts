"use client";

import { useState, useCallback } from "react";
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
} from "@/utils/secretSantaContract";

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
      };

      setGameInfo(game);
      return game;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch game";
      setError(message);
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
      const message = err instanceof Error ? err.message : "Failed to fetch games";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, chain, address, addGame]);

  return { games, isLoading, error, fetchMyGames };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useCreateGame - Create a new Secret Santa game
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
    async (gameName: string) => {
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

        const encrypted = await cofhejs.encrypt([Encryptable.uint32(entropy)]);
        console.log("Encryption result:", encrypted);

        if (!encrypted.success || !encrypted.data) {
          setError("Failed to encrypt entropy: " + (encrypted.error || "Unknown error"));
          return null;
        }

        // Pass encrypted data directly
        const encryptedEntropy = encrypted.data[0];
        console.log("Encrypted entropy to send:", encryptedEntropy);

        // Create the game
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "createGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameName, encryptedEntropy as any],
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
        const message = err instanceof Error ? err.message : "Failed to create game";
        setError(message);
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
// Hook: useJoinGame - Join an existing game by ID
// ═══════════════════════════════════════════════════════════════════════════

export function useJoinGame() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { isInitialized } = useCofheStore();
  const { addGame } = useSecretSantaStore();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = useCallback(
    async (gameId: bigint) => {
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
        const encrypted = await cofhejs.encrypt([Encryptable.uint32(entropy)]);

        if (!encrypted.success || !encrypted.data) {
          setError("Failed to encrypt entropy");
          return null;
        }

        // Pass encrypted data directly
        const encryptedEntropy = encrypted.data[0];

        // Join the game
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "joinGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameId, encryptedEntropy as any],
        });

        // Wait for transaction confirmation
        setIsConfirming(true);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setIsConfirming(false);

        if (receipt.status === "success") {
          // Fetch the game info
          const gameInfo = await publicClient.readContract({
            address: contractAddress,
            abi: SECRET_SANTA_ABI,
            functionName: "getGame",
            args: [gameId],
          });

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
        }

        return hash;
      } catch (err) {
        setIsConfirming(false);
        const message = err instanceof Error ? err.message : "Failed to join game";
        setError(message);
        return null;
      }
    },
    [contractAddress, address, chain, isInitialized, writeContractAsync, publicClient, addGame]
  );

  return {
    joinGame,
    txHash,
    isLoading: isPending || isConfirming,
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
        const message = err instanceof Error ? err.message : "Failed to finalize game";
        setError(message);
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
        const message = err instanceof Error ? err.message : "Failed to reveal game";
        setError(message);
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
      const message = err instanceof Error ? err.message : "Failed to fetch participants";
      setError(message);
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
      const message = err instanceof Error ? err.message : "Failed to fetch target";
      setError(message);
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
      const message = err instanceof Error ? err.message : "Failed to unseal target";
      setError(message);
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
export { GameState, gameStateLabels, generateEntropy } from "@/utils/secretSantaContract";
export type { GameInfo } from "@/utils/secretSantaContract";
