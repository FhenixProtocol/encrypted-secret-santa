"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { getCofheClient } from "@/services/cofhe-client";
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

  const patterns = [
    /User rejected the request/i,
    /user rejected/i,
    /rejected by user/i,
    /reverted with reason string ['"](.+?)['"]/i,
    /execution reverted: (.+?)(?:\n|$)/i,
    /reason: (.+?)(?:\n|$)/i,
    /InvalidPassword/i,
    /InvalidDecryptionProof/i,
    /NoPendingJoin/i,
    /AlreadyRegistered/i,
    /NotRegistrationPhase/i,
    /GameNotFound/i,
    /PendingJoinExists/i,
    /insufficient funds/i,
    /network error/i,
    /could not connect/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const result = match[1] || match[0];
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  }

  const detailsMatch = message.match(/Details:\s*(.+?)(?:\n|$)/i);
  if (detailsMatch) {
    return detailsMatch[1].trim();
  }

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
  if (chain?.id === 421614) {
    return CONTRACT_ADDRESS;
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useGameInfo
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
// Hook: useMyGames
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

          addGame({
            gameId: game.gameId.toString(),
            creator: game.creator,
            name: game.name,
            createdAt: Number(game.createdAt),
            chainId: chain.id,
            joinedAt: Date.now(),
          });
        } catch {
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
// Hook: useCreateGame
// ═══════════════════════════════════════════════════════════════════════════

export function useCreateGame() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { isInitialized } = useCofheStore();
  const { addGame } = useSecretSantaStore();
  const { writeContractAsync, data: txHash, isPending } = useWriteContract();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = useCallback(
    async (gameName: string, creatorName: string, password?: string) => {
      if (!contractAddress || !address || !chain || !publicClient) {
        setError("Wallet not connected or wrong network");
        return null;
      }

      if (!isInitialized) {
        setError("CoFHE not initialized");
        return null;
      }

      if (isSubmitting) return null;

      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      try {
        const entropy = generateEntropy();
        const hasPassword = password !== undefined && password.length > 0;
        const passwordValue = hasPassword ? BigInt(hashPassword(password)) : BigInt(0);

        const [encryptedEntropy, encryptedPassword] = await getCofheClient()
          .encryptInputs([
            Encryptable.uint32(entropy),
            Encryptable.uint32(passwordValue),
          ])
          .execute();

        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "createGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameName, creatorName, encryptedEntropy as any, encryptedPassword as any, hasPassword],
        });

        setIsConfirming(true);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setIsConfirming(false);

        if (receipt.status === "success") {
          setIsSuccess(true);

          try {
            const gameCount = await publicClient.readContract({
              address: contractAddress,
              abi: SECRET_SANTA_ABI,
              functionName: "gameCount",
            });

            const newGameId = gameCount - BigInt(1);

            const gameInfo = await publicClient.readContract({
              address: contractAddress,
              abi: SECRET_SANTA_ABI,
              functionName: "getGame",
              args: [newGameId],
            });

            addGame({
              gameId: newGameId.toString(),
              creator: gameInfo.creator as string,
              name: gameInfo.name,
              createdAt: Number(gameInfo.createdAt),
              chainId: chain.id,
              joinedAt: Date.now(),
            });
          } catch (storeErr) {
            console.error("Failed to save game to local store:", storeErr);
          }
        }

        setIsSubmitting(false);
        return hash;
      } catch (err) {
        setIsSubmitting(false);
        setIsConfirming(false);
        setError(parseError(err));
        return null;
      }
    },
    [contractAddress, address, chain, isInitialized, isSubmitting, writeContractAsync, publicClient, addGame]
  );

  return {
    createGame,
    txHash,
    isLoading: isSubmitting || isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: extract ctHash from JoinRequested event in a tx receipt
// ═══════════════════════════════════════════════════════════════════════════

function extractCtHashFromReceipt(
  receiptLogs: readonly { address: string; topics: readonly `0x${string}`[]; data: `0x${string}` }[],
  contractAddress: `0x${string}`
): `0x${string}` | null {
  for (const log of receiptLogs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: SECRET_SANTA_ABI,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (decoded.eventName === "JoinRequested") {
        return (decoded.args as { ctHash: `0x${string}` }).ctHash;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useJoinGame — 2-step for password games, off-chain decrypt + verify
// ═══════════════════════════════════════════════════════════════════════════

export type JoinStep = "idle" | "requesting" | "decrypting" | "completing" | "done" | "error";

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

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setIsSuccess(false);
    setCurrentGameId(null);
  }, []);

  const completeWithCtHash = useCallback(
    async (gameId: bigint, ctHash: `0x${string}`, gameInfo: { creator: string; name: string; createdAt: bigint }) => {
      if (!contractAddress || !publicClient || !chain || !address) return null;

      setStep("decrypting");

      const { decryptedValue, signature } = await getCofheClient()
        .decryptForTx(ctHash)
        .withPermit()
        .execute();

      setStep("completing");

      const matched = decryptedValue !== BigInt(0);

      const completeHash = await writeContractAsync({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "completeJoinGame",
        args: [gameId, matched, signature],
      });

      const completeReceipt = await publicClient.waitForTransactionReceipt({ hash: completeHash });

      if (completeReceipt.status !== "success") {
        throw new Error("Complete join transaction failed");
      }

      setIsSuccess(true);
      setStep("done");

      addGame({
        gameId: gameId.toString(),
        creator: gameInfo.creator,
        name: gameInfo.name,
        createdAt: Number(gameInfo.createdAt),
        chainId: chain.id,
        joinedAt: Date.now(),
      });

      return completeHash;
    },
    [contractAddress, publicClient, chain, address, writeContractAsync, addGame]
  );

  const requestJoin = useCallback(
    async (gameId: bigint, playerName: string, password?: string) => {
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
        const gameInfo = await publicClient.readContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "getGame",
          args: [gameId],
        });

        const gameHasPassword = gameInfo.hasPassword;

        const entropy = generateEntropy();
        const passwordValue = password ? BigInt(hashPassword(password)) : BigInt(0);

        const [encryptedPassword, encryptedEntropy] = await getCofheClient()
          .encryptInputs([
            Encryptable.uint32(passwordValue),
            Encryptable.uint32(entropy),
          ])
          .execute();

        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "requestJoinGame",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: [gameId, playerName, encryptedPassword as any, encryptedEntropy as any],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          setError("Transaction failed");
          setStep("error");
          return null;
        }

        // For public games, we're done immediately
        if (!gameHasPassword) {
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

        // Password-protected: extract ctHash from event, decrypt off-chain, submit completion
        const ctHash = extractCtHashFromReceipt(receipt.logs, contractAddress);
        if (!ctHash) {
          setError("Could not locate JoinRequested event in receipt");
          setStep("error");
          return null;
        }

        await completeWithCtHash(gameId, ctHash, {
          creator: gameInfo.creator as string,
          name: gameInfo.name,
          createdAt: gameInfo.createdAt,
        });

        return hash;
      } catch (err) {
        setError(parseError(err));
        setStep("error");
        return null;
      }
    },
    [contractAddress, address, chain, isInitialized, writeContractAsync, publicClient, addGame, completeWithCtHash]
  );

  return {
    requestJoin,
    reset,
    step,
    currentGameId,
    isLoading: isPending || step === "requesting" || step === "decrypting" || step === "completing",
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: usePendingJoinStatus
// ═══════════════════════════════════════════════════════════════════════════

export interface PendingJoinInfo {
  gameId: bigint;
  hasPending: boolean;
  registered: boolean;
  ctHash: `0x${string}`;
}

export function usePendingJoinStatus(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const contractAddress = useContractAddress();
  const [status, setStatus] = useState<PendingJoinInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const gameIdStr = gameId?.toString() ?? null;

  const checkStatus = useCallback(async () => {
    if (!publicClient || !contractAddress || !address || gameIdStr === null) {
      setStatus(null);
      return null;
    }

    const gameIdBigInt = BigInt(gameIdStr);
    setIsLoading(true);
    try {
      const [hasPending, registered, ctHash] = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getJoinStatus",
        args: [gameIdBigInt, address],
      });

      const info: PendingJoinInfo = {
        gameId: gameIdBigInt,
        hasPending,
        registered,
        ctHash: ctHash as `0x${string}`,
      };

      setStatus(info);
      return info;
    } catch (err) {
      console.error("Error checking join status:", err);
      setStatus(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, address, gameIdStr]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    isLoading,
    refetch: checkStatus,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useCompleteJoinOnly - retry step 2 on an existing pending join
// ═══════════════════════════════════════════════════════════════════════════

export function useCompleteJoinOnly() {
  const publicClient = usePublicClient();
  const { address, chain } = useAccount();
  const contractAddress = useContractAddress();
  const { addGame } = useSecretSantaStore();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeJoin = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress || !publicClient || !chain || !address) {
        setError("Wallet not connected or wrong network");
        return null;
      }

      setError(null);
      setIsSuccess(false);
      setIsLoading(true);

      try {
        const [hasPending, registered, ctHash] = await publicClient.readContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "getJoinStatus",
          args: [gameId, address],
        });

        if (registered) {
          setError("Already registered in this game");
          setIsLoading(false);
          return null;
        }

        if (!hasPending) {
          setError("No pending join request found");
          setIsLoading(false);
          return null;
        }

        const { decryptedValue, signature } = await getCofheClient()
          .decryptForTx(ctHash as `0x${string}`)
          .withPermit()
          .execute();

        const matched = decryptedValue !== BigInt(0);

        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "completeJoinGame",
          args: [gameId, matched, signature],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          setIsSuccess(true);

          try {
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
          } catch (storeErr) {
            console.error("Failed to save game to local store:", storeErr);
          }

          return hash;
        } else {
          setError("Transaction failed");
          return null;
        }
      } catch (err) {
        setError(parseError(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, publicClient, chain, address, writeContractAsync, addGame]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsSuccess(false);
  }, []);

  return {
    completeJoin,
    reset,
    isLoading: isPending || isLoading,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useFinalizeGame
// ═══════════════════════════════════════════════════════════════════════════

export function useFinalizeGame() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const contractAddress = useContractAddress();
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const finalizeGame = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress || !publicClient || !address) {
        setError("Wrong network or not connected");
        return null;
      }

      setError(null);
      setIsSuccess(false);
      setIsSimulating(true);

      try {
        await publicClient.simulateContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "finalizeGame",
          args: [gameId],
          account: address,
        });

        setIsSimulating(false);

        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "finalizeGame",
          args: [gameId],
        });

        setIsConfirming(true);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setIsConfirming(false);

        if (receipt.status === "success") {
          setIsSuccess(true);
          return hash;
        } else {
          setError("Transaction failed");
          return null;
        }
      } catch (err) {
        setIsSimulating(false);
        setIsConfirming(false);
        const errorMsg = parseError(err);
        console.error("FinalizeGame error:", err);
        setError(errorMsg);
        return null;
      }
    },
    [contractAddress, publicClient, writeContractAsync, address]
  );

  return {
    finalizeGame,
    isLoading: isSimulating || isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useRevealGame
// ═══════════════════════════════════════════════════════════════════════════

export function useRevealGame() {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const revealGame = useCallback(
    async (gameId: bigint) => {
      if (!contractAddress || !publicClient) {
        setError("Wrong network");
        return null;
      }

      setError(null);
      setIsSuccess(false);

      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "revealGame",
          args: [gameId],
        });

        setIsConfirming(true);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setIsConfirming(false);

        if (receipt.status === "success") {
          setIsSuccess(true);
          return hash;
        } else {
          setError("Transaction failed");
          return null;
        }
      } catch (err) {
        setIsConfirming(false);
        setError(parseError(err));
        return null;
      }
    },
    [contractAddress, publicClient, writeContractAsync]
  );

  return {
    revealGame,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useParticipants
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
// Hook: useParticipantsWithNames
// ═══════════════════════════════════════════════════════════════════════════

export interface ParticipantWithName {
  address: `0x${string}`;
  name: string;
}

export function useParticipantsWithNames(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const [participants, setParticipants] = useState<ParticipantWithName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipantsWithNames = useCallback(async () => {
    if (!publicClient || !contractAddress || gameId === null) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const [addresses, names] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "getParticipants",
          args: [gameId],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: SECRET_SANTA_ABI,
          functionName: "getParticipantNames",
          args: [gameId],
        }),
      ]);

      const result: ParticipantWithName[] = (addresses as `0x${string}`[]).map(
        (addr, i) => ({
          address: addr,
          name: (names as string[])[i] || "",
        })
      );

      setParticipants(result);
      return result;
    } catch (err) {
      setError(parseError(err));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, gameId]);

  return { participants, isLoading, error, fetchParticipantsWithNames };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: usePlayerName
// ═══════════════════════════════════════════════════════════════════════════

export function usePlayerName(gameId: bigint | null, playerAddress: `0x${string}` | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlayerName = useCallback(async () => {
    if (!publicClient || !contractAddress || gameId === null || !playerAddress) {
      return "";
    }

    setIsLoading(true);

    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getPlayerName",
        args: [gameId, playerAddress],
      });

      setName(result as string);
      return result as string;
    } catch {
      return "";
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, gameId, playerAddress]);

  return { name, isLoading, fetchPlayerName };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useIsRegistered
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
// Hook: useMyTarget - Decrypt the user's assigned target via permit
// ═══════════════════════════════════════════════════════════════════════════

export function useMyTarget(gameId: bigint | null) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const { address } = useAccount();
  const { isInitialized } = useCofheStore();
  const [encryptedIndex, setEncryptedIndex] = useState<`0x${string}` | null>(null);
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
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: SECRET_SANTA_ABI,
        functionName: "getMyTarget",
        args: [gameId],
        account: address,
      });

      const ctHash = result as `0x${string}`;
      setEncryptedIndex(ctHash);
      return ctHash;
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
      const plaintext = await getCofheClient()
        .decryptForView(encryptedIndex, FheTypes.Uint32)
        .execute();

      const index = Number(plaintext);
      setTargetIndex(index);
      return index;
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
