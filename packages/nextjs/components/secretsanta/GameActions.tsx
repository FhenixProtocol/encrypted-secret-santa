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
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform rotate-1 hover:rotate-0 transition-transform duration-300">
      <div className="bg-pastel-pink rounded-sm p-5 space-y-4">
        <h4 className="text-sm font-bold font-display text-santa-deepRed">
          Creator Actions
        </h4>

        {/* Finalize button */}
        {gameState === GameState.REGISTRATION && (
          <div className="space-y-2">
            <button
              onClick={handleFinalize}
              disabled={!canFinalize || isFinalizing}
              className="btn-fhenix w-full h-11 flex items-center justify-center gap-2"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Finalize Game
                </>
              )}
            </button>

            {!canFinalize && playerCount < BigInt(3) && (
              <p className="text-xs text-santa-deepRed/70 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Need at least 3 players to finalize ({playerCount.toString()}/3)
              </p>
            )}

            {finalizeError && (
              <p className="text-xs text-santa-deepRed flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {finalizeError}
              </p>
            )}

            {finalizeSuccess && (
              <p className="text-xs text-fhenix-purple flex items-center gap-1">
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
              className="btn-santa w-full h-11 flex items-center justify-center gap-2"
            >
              {isRevealing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Revealing...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Reveal All Assignments
                </>
              )}
            </button>

            <p className="text-xs text-santa-deepRed/60">
              This will make all assignments visible to everyone in the game.
            </p>

            {revealError && (
              <p className="text-xs text-santa-deepRed flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {revealError}
              </p>
            )}

            {revealSuccess && (
              <p className="text-xs text-fhenix-purple flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All assignments revealed!
              </p>
            )}
          </div>
        )}

        {/* Already revealed message */}
        {gameState === GameState.REVEALED && (
          <div className="p-3 bg-fhenix-purple/10 border border-fhenix-purple/30 rounded-lg">
            <p className="text-sm text-fhenix-purple flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              All assignments have been revealed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
