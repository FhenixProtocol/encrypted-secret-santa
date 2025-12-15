"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Loader2, Copy, CheckCircle2, Share2 } from "lucide-react";
import { useGameInfo, GameState, gameStateLabels } from "@/hooks/useSecretSanta";
import { useIsRegistered } from "@/hooks/useSecretSanta";
import { ParticipantsList } from "./ParticipantsList";
import { TargetReveal } from "./TargetReveal";
import { GameActions } from "./GameActions";
import { useAccount } from "wagmi";

interface GameDetailsProps {
  gameId: bigint;
  onBack: () => void;
}

export const GameDetails = ({ gameId, onBack }: GameDetailsProps) => {
  const { address } = useAccount();
  const { gameInfo, isLoading, error, fetchGameInfo } = useGameInfo(gameId);
  const { isRegistered, checkRegistration } = useIsRegistered(gameId);
  const [copied, setCopied] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchGameInfo();
  }, [fetchGameInfo]);

  useEffect(() => {
    if (gameId !== null) {
      checkRegistration();
    }
  }, [gameId, checkRegistration]);

  const isCreator = address?.toLowerCase() === gameInfo?.creator.toLowerCase();

  const getStateColor = () => {
    if (!gameInfo) return "text-base-content/60";
    switch (gameInfo.state) {
      case GameState.REGISTRATION:
        return "text-yellow-500";
      case GameState.ACTIVE:
        return "text-green-500";
      case GameState.REVEALED:
        return "text-primary";
      default:
        return "text-base-content/60";
    }
  };

  const copyGameId = async () => {
    await navigator.clipboard.writeText(gameId.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !gameInfo) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-base-content/60">Loading game details...</p>
      </div>
    );
  }

  if (error || !gameInfo) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 mb-4">{error || "Game not found"}</p>
        <button onClick={onBack} className="btn btn-ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm rounded-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <button
          onClick={() => fetchGameInfo()}
          disabled={isLoading}
          className="btn btn-ghost btn-sm rounded-sm"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Game Info Card */}
      <div className="p-6 bg-base-100 border border-base-300 rounded-sm relative overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-base-content mb-2">
              {gameInfo.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs text-base-content/60 uppercase">Status:</span>
              <span className={`font-pixel text-sm uppercase ${getStateColor()}`}>
                {gameStateLabels[gameInfo.state]}
              </span>
            </div>
          </div>

          <button
            onClick={copyGameId}
            className="flex items-center gap-2 px-3 py-2 bg-base-200 border border-base-300 rounded-sm hover:border-primary transition-all"
            title="Copy Game ID"
          >
            <span className="font-pixel text-xs text-base-content/60">ID:</span>
            <span className="font-mono text-base-content">{gameId.toString()}</span>
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-base-content/50" />
            )}
          </button>
        </div>

        {/* Share banner for registration phase */}
        {gameInfo.state === GameState.REGISTRATION && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-sm mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">
                Share Game ID <strong>{gameId.toString()}</strong> with friends to let them join!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-base-200 rounded-sm">
            <p className="text-xs font-pixel text-base-content/60 uppercase mb-1">Players</p>
            <p className="text-xl font-bold text-base-content">{gameInfo.playerCount.toString()}</p>
          </div>
          <div className="p-3 bg-base-200 rounded-sm">
            <p className="text-xs font-pixel text-base-content/60 uppercase mb-1">Min. Required</p>
            <p className="text-xl font-bold text-base-content">3</p>
          </div>
          <div className="p-3 bg-base-200 rounded-sm col-span-2">
            <p className="text-xs font-pixel text-base-content/60 uppercase mb-1">Creator</p>
            <p className="text-sm font-mono text-base-content truncate">
              {gameInfo.creator.slice(0, 10)}...{gameInfo.creator.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout for game content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Participants & Actions */}
        <div className="space-y-6">
          <ParticipantsList
            gameId={gameId}
            creatorAddress={gameInfo.creator}
          />

          {isCreator && (
            <GameActions
              gameId={gameId}
              gameState={gameInfo.state}
              playerCount={gameInfo.playerCount}
              isCreator={isCreator}
              onActionComplete={() => {
                fetchGameInfo();
                setRefreshTrigger((t) => t + 1);
              }}
            />
          )}
        </div>

        {/* Right Column: Target Reveal */}
        <div>
          {isRegistered && gameInfo.state >= GameState.ACTIVE ? (
            <TargetReveal gameId={gameId} refreshTrigger={refreshTrigger} />
          ) : gameInfo.state === GameState.REGISTRATION ? (
            <div className="p-6 bg-base-100 border border-base-300 rounded-sm text-center">
              <p className="text-base-content/60 mb-2">
                Assignments will be available once the game is finalized.
              </p>
              <p className="text-sm text-base-content/40">
                {isCreator
                  ? "Finalize the game when everyone has joined."
                  : "Wait for the creator to finalize the game."}
              </p>
            </div>
          ) : !isRegistered ? (
            <div className="p-6 bg-base-100 border border-base-300 rounded-sm text-center">
              <p className="text-base-content/60">
                You are not a participant in this game.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
