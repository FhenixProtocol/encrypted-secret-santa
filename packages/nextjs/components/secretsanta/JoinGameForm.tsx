"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  UserPlus,
  Loader2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  User,
  Clock,
} from "lucide-react";
import {
  useJoinGame,
  JoinStep,
  usePendingJoinStatus,
  useCompleteJoinOnly,
} from "@/hooks/useSecretSanta";
import { useCofheStore } from "@/services/store/cofheStore";
import { useAccount } from "wagmi";

interface JoinGameFormProps {
  onSuccess?: () => void;
}

const stepMessages: Record<JoinStep, string> = {
  idle: "",
  requesting: "Submitting join request...",
  waiting: "Verifying password on-chain...",
  completing: "Completing registration...",
  done: "Successfully joined!",
  error: "",
};

export const JoinGameForm = ({ onSuccess }: JoinGameFormProps) => {
  const { isConnected } = useAccount();
  const { isInitialized } = useCofheStore();
  const { requestJoin, reset, step, isLoading, isSuccess, error } =
    useJoinGame();
  const [gameIdInput, setGameIdInput] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasCalledSuccess = useRef(false);

  // Check for pending join requests - memoize to avoid excessive RPC calls
  const parsedGameId = useMemo(() => {
    try {
      const trimmed = gameIdInput.trim();
      if (!trimmed) return null;
      const id = BigInt(trimmed);
      return id >= BigInt(0) ? id : null;
    } catch {
      return null;
    }
  }, [gameIdInput]);

  const { status: pendingStatus, refetch: refetchPendingStatus } =
    usePendingJoinStatus(parsedGameId);
  const {
    completeJoin: retryComplete,
    reset: resetRetry,
    isLoading: isRetrying,
    isSuccess: retrySuccess,
    error: retryError,
  } = useCompleteJoinOnly();

  // Check if there's a pending join ready to complete
  const hasPendingJoinReady =
    pendingStatus?.hasPending &&
    pendingStatus?.isDecrypted &&
    !pendingStatus?.isRegistered;
  const hasPendingJoinWaiting =
    pendingStatus?.hasPending &&
    !pendingStatus?.isDecrypted &&
    !pendingStatus?.isRegistered;

  // Reset form on success (either normal join or retry)
  useEffect(() => {
    const success = isSuccess || retrySuccess;
    if (success && !hasCalledSuccess.current) {
      hasCalledSuccess.current = true;
      onSuccess?.();
      refetchPendingStatus();
      // Delay reset to show success message
      const timer = setTimeout(() => {
        setGameIdInput("");
        setNickname("");
        setPassword("");
        reset();
        resetRetry();
        hasCalledSuccess.current = false;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    isSuccess,
    retrySuccess,
    onSuccess,
    reset,
    resetRetry,
    refetchPendingStatus,
  ]);

  // Refetch pending status when retry fails (wrong password deletes the pending join on-chain)
  useEffect(() => {
    if (retryError) {
      // Delay slightly to let the chain state settle
      const timer = setTimeout(() => {
        refetchPendingStatus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryError, refetchPendingStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidGameId() || !nickname.trim()) return;

    const gameId = BigInt(gameIdInput.trim());
    await requestJoin(gameId, nickname.trim(), password || undefined);
  };

  const handleReset = () => {
    reset();
    setPassword("");
  };

  const isValidGameId = () => {
    try {
      const id = BigInt(gameIdInput.trim());
      return id >= BigInt(0);
    } catch {
      return false;
    }
  };

  const isProcessing = step !== "idle" && step !== "done" && step !== "error";

  return (
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid">
      <div className="bg-pastel-mint rounded-sm p-5">
        <div className="flex items-center justify-end gap-3 mb-4">
          <h3 className="text-lg font-bold font-display text-santa-deepRed">
            Join Game
          </h3>
          <UserPlus className="w-5 h-5 text-santa-deepRed" />
        </div>

        <p className="text-sm text-santa-deepRed/70 mb-4">
          Enter the game ID shared by the game creator to join.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              Game ID
            </label>
            <input
              type="number"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              placeholder="e.g., 0"
              min="0"
              className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40"
              disabled={!isConnected || isProcessing}
            />
          </div>

          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Nickname
              </div>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Secret Santa Claus"
              className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40"
              disabled={!isConnected || isProcessing}
            />
            <p className="text-xs text-santa-deepRed/50 mt-1">
              This name will be visible to other players
            </p>
          </div>

          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password (if required)
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for public games"
                className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40 pr-10"
                disabled={!isConnected || isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-santa-deepRed/40 hover:text-santa-deepRed transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-santa-deepRed/50 mt-1">
              Only needed if the game is password-protected
            </p>
          </div>

          {/* Pending join request - ready to complete */}
          {hasPendingJoinReady && !isProcessing && (
            <div className="p-3 bg-fhenix-purple/10 border border-fhenix-purple/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-fhenix-purple flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-santa-deepRed font-medium">
                    Pending join request found!
                  </p>
                  <p className="text-xs text-santa-deepRed/60 mt-1">
                    Click to complete, or submit a new request with a different
                    password.
                  </p>
                  <button
                    type="button"
                    onClick={() => parsedGameId && retryComplete(parsedGameId)}
                    disabled={isRetrying}
                    className="mt-2 btn-fhenix h-9 px-4 text-sm flex items-center gap-2"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Join
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending join request - still waiting for decryption */}
          {hasPendingJoinWaiting && !isProcessing && (
            <div className="p-3 bg-yellow-100/50 border border-yellow-300 rounded-lg">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-yellow-600 animate-spin flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-santa-deepRed font-medium">
                    Join request pending...
                  </p>
                  <p className="text-xs text-santa-deepRed/60 mt-1">
                    Password is being verified on-chain. This may take a few
                    seconds.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchPendingStatus()}
                    className="mt-2 text-xs text-fhenix-purple hover:text-fhenix-purple/80 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Check status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Retry error */}
          {retryError && (
            <div className="p-3 bg-pastel-coral/30 border border-pastel-coral rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-santa-deepRed flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-santa-deepRed">{retryError}</p>
                  {retryError.toLowerCase().includes("password") && (
                    <p className="text-xs text-santa-deepRed/60 mt-1">
                      You can try joining again with the correct password.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={resetRetry}
                className="mt-2 text-xs text-fhenix-purple hover:text-fhenix-purple/80 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Dismiss
              </button>
            </div>
          )}

          {/* Progress indicator for 2-step join */}
          {isProcessing && (
            <div className="p-3 bg-fhenix-purple/10 border border-fhenix-purple/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-fhenix-purple animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm text-santa-deepRed font-medium">
                    {stepMessages[step]}
                  </p>
                  {step === "waiting" && (
                    <p className="text-xs text-santa-deepRed/60 mt-1">
                      This may take a few seconds while FHE decryption
                      completes...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-pastel-coral/30 border border-pastel-coral rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-santa-deepRed flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-santa-deepRed">{error}</p>
                  {error.toLowerCase().includes("password") && (
                    <p className="text-xs text-santa-deepRed/60 mt-1">
                      Check the password and try again.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-xs text-fhenix-purple hover:text-fhenix-purple/80 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Try again
              </button>
            </div>
          )}

          {(isSuccess || retrySuccess) && (
            <div className="p-3 bg-pastel-pink/50 border border-pastel-pink rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-fhenix-purple" />
              <p className="text-sm text-santa-deepRed">
                Successfully joined the game!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              !isConnected ||
              !isInitialized ||
              !isValidGameId() ||
              !nickname.trim() ||
              isProcessing ||
              isRetrying ||
              isSuccess ||
              retrySuccess
            }
            className="btn-santa w-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {step === "waiting" ? "Verifying..." : "Joining..."}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Join Game
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Connect wallet to join a game
            </p>
          )}

          {isConnected && !isInitialized && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Initializing FHE...
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
