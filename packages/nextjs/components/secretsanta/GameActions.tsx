"use client";

import { Loader2, Play, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { useFinalizeGame, useRevealGame, GameState } from "@/hooks/useSecretSanta";

interface GameActionsProps {
  gameId: bigint;
  gameState: GameState;
  playerCount: bigint;
  isCreator: boolean;
  onActionComplete?: () => void;
}

export const GameActions = ({
  gameId,
  gameState,
  playerCount,
  isCreator,
  onActionComplete,
}: GameActionsProps) => {
  const {
    finalizeGame,
    isLoading: isFinalizing,
    isSuccess: finalizeSuccess,
    error: finalizeError,
  } = useFinalizeGame();
  const {
    revealGame,
    isLoading: isRevealing,
    isSuccess: revealSuccess,
    error: revealError,
  } = useRevealGame();

  const canFinalize = gameState === GameState.REGISTRATION && playerCount >= BigInt(3);
  const canReveal = gameState === GameState.ACTIVE;

  const handleFinalize = async () => {
    const hash = await finalizeGame(gameId);
    if (hash) {
      onActionComplete?.();
    }
  };

  const handleReveal = async () => {
    const hash = await revealGame(gameId);
    if (hash) {
      onActionComplete?.();
    }
  };

  if (!isCreator) {
    return null;
  }

  return (
    <div className="p-4 bg-base-200 border border-base-300 rounded-sm space-y-4">
      <h4 className="text-sm font-bold font-display uppercase tracking-wide text-base-content">
        Creator Actions
      </h4>

      {/* Finalize button */}
      {gameState === GameState.REGISTRATION && (
        <div className="space-y-2">
          <button
            onClick={handleFinalize}
            disabled={!canFinalize || isFinalizing}
            className="btn btn-fhenix w-full font-bold tracking-wider rounded-sm font-display uppercase"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Finalizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Finalize Game
              </>
            )}
          </button>

          {!canFinalize && playerCount < BigInt(3) && (
            <p className="text-xs text-yellow-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Need at least 3 players to finalize ({playerCount.toString()}/3)
            </p>
          )}

          {finalizeError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {finalizeError}
            </p>
          )}

          {finalizeSuccess && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Game finalized! Assignments are now live.
            </p>
          )}
        </div>
      )}

      {/* Reveal All button */}
      {gameState === GameState.ACTIVE && (
        <div className="space-y-2">
          <button
            onClick={handleReveal}
            disabled={isRevealing}
            className="btn btn-secondary w-full font-bold tracking-wider rounded-sm font-display uppercase"
          >
            {isRevealing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Revealing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Reveal All Assignments
              </>
            )}
          </button>

          <p className="text-xs text-base-content/60">
            This will make all assignments visible to everyone in the game.
          </p>

          {revealError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {revealError}
            </p>
          )}

          {revealSuccess && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              All assignments revealed!
            </p>
          )}
        </div>
      )}

      {/* Already revealed message */}
      {gameState === GameState.REVEALED && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-sm">
          <p className="text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            All assignments have been revealed!
          </p>
        </div>
      )}
    </div>
  );
};
