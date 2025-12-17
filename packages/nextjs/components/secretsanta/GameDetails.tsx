"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Loader2, Copy, CheckCircle2, Share2, Lock } from "lucide-react";
import { useGameInfo, GameState, gameStateLabels, usePlayerName } from "@/hooks/useSecretSanta";
import { useIsRegistered } from "@/hooks/useSecretSanta";
import { ParticipantsList } from "./ParticipantsList";
import { TargetReveal } from "./TargetReveal";
import { GameActions } from "./GameActions";
import { PermitCard } from "./PermitCard";
import { useAccount } from "wagmi";

interface GameDetailsProps {
  gameId: bigint;
  onBack: () => void;
}

export const GameDetails = ({ gameId, onBack }: GameDetailsProps) => {
  const { address } = useAccount();
  const { gameInfo, isLoading, error, fetchGameInfo } = useGameInfo(gameId);
  const { isRegistered, checkRegistration } = useIsRegistered(gameId);
  const { name: creatorName, fetchPlayerName: fetchCreatorName } = usePlayerName(
    gameId,
    gameInfo?.creator ?? null
  );
  const [copied, setCopied] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchGameInfo();
  }, [fetchGameInfo]);

  useEffect(() => {
    if (gameInfo?.creator) {
      fetchCreatorName();
    }
  }, [gameInfo?.creator, fetchCreatorName]);

  useEffect(() => {
    if (gameId !== null) {
      checkRegistration();
    }
  }, [gameId, checkRegistration]);

  const isCreator = address?.toLowerCase() === gameInfo?.creator.toLowerCase();

  const getStateStyles = () => {
    if (!gameInfo) return "text-santa-deepRed/60 bg-santa-deepRed/10";
    switch (gameInfo.state) {
      case GameState.REGISTRATION:
        return "text-santa-deepRed bg-pastel-coral/30";
      case GameState.ACTIVE:
        return "text-santa-deepRed bg-pastel-mint/50";
      case GameState.REVEALED:
        return "text-fhenix-purple bg-fhenix-purple/10";
      default:
        return "text-santa-deepRed/60 bg-santa-deepRed/10";
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
        <Loader2 className="w-8 h-8 text-fhenix-purple animate-spin mx-auto mb-4" />
        <p className="text-white/60">Loading game details...</p>
      </div>
    );
  }

  if (error || !gameInfo) {
    return (
      <div className="py-20 text-center">
        <p className="text-pastel-coral mb-4">{error || "Game not found"}</p>
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" />
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
          className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={() => fetchGameInfo()}
          disabled={isLoading}
          className="text-white/70 hover:text-white p-2 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Game Info Card - Polaroid Style with slight rotation */}
      <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="bg-pastel-cream rounded-sm p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold font-display text-santa-deepRed">
                  {gameInfo.name}
                </h2>
                {gameInfo.hasPassword && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-santa-deepRed/10 rounded-lg" title="Password protected">
                    <Lock className="w-4 h-4 text-santa-deepRed/70" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-santa-deepRed/60">Status:</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStateStyles()}`}>
                  {gameStateLabels[gameInfo.state]}
                </span>
              </div>
            </div>

            <button
              onClick={copyGameId}
              className="flex items-center gap-2 px-3 py-2 bg-white/50 border border-santa-deepRed/20 rounded-lg hover:border-fhenix-purple/50 transition-all"
              title="Copy Game ID"
            >
              <span className="text-xs text-santa-deepRed/60">ID:</span>
              <span className="font-mono text-santa-deepRed">{gameId.toString()}</span>
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-fhenix-purple" />
              ) : (
                <Copy className="w-4 h-4 text-santa-deepRed/40" />
              )}
            </button>
          </div>

          {/* Share banner for registration phase */}
          {gameInfo.state === GameState.REGISTRATION && (
            <div className="p-3 bg-fhenix-purple/10 border border-fhenix-purple/30 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-fhenix-purple" />
                <span className="text-sm text-santa-deepRed">
                  Share Game ID <strong>{gameId.toString()}</strong> with friends to let them join!
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-santa-deepRed/60 mb-1">Players</p>
              <p className="text-xl font-bold text-santa-deepRed">{gameInfo.playerCount.toString()}</p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-santa-deepRed/60 mb-1">Min. Required</p>
              <p className="text-xl font-bold text-santa-deepRed">3</p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg col-span-2">
              <p className="text-xs text-santa-deepRed/60 mb-1">Creator</p>
              {creatorName ? (
                <div>
                  <p className="text-sm font-medium text-santa-deepRed">{creatorName}</p>
                  <p className="text-xs font-mono text-santa-deepRed/50 truncate">
                    {gameInfo.creator.slice(0, 10)}...{gameInfo.creator.slice(-8)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-mono text-santa-deepRed truncate">
                  {gameInfo.creator.slice(0, 10)}...{gameInfo.creator.slice(-8)}
                </p>
              )}
            </div>
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

          {/* Permit Management */}
          {isRegistered && <PermitCard />}
        </div>

        {/* Right Column: Target Reveal */}
        <div>
          {isRegistered && gameInfo.state >= GameState.ACTIVE ? (
            <TargetReveal gameId={gameId} refreshTrigger={refreshTrigger} />
          ) : gameInfo.state === GameState.REGISTRATION ? (
            <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="bg-pastel-cream rounded-sm p-5 text-center">
                <div className="encrypted-badge mx-auto mb-4 w-fit">
                  <Lock className="w-3 h-3" />
                  <span>Pending Encryption</span>
                </div>
                <p className="text-santa-deepRed/70 mb-2">
                  Assignments will be available once the game is finalized.
                </p>
                <p className="text-sm text-santa-deepRed/50">
                  {isCreator
                    ? "Finalize the game when everyone has joined."
                    : "Wait for the creator to finalize the game."}
                </p>
              </div>
            </div>
          ) : !isRegistered ? (
            <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="bg-pastel-cream rounded-sm p-5 text-center">
                <p className="text-santa-deepRed/70">
                  You are not a participant in this game.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
