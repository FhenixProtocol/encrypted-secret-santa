"use client";

import { GameInfo, GameState, gameStateLabels } from "@/hooks/useSecretSanta";
import { Users, Calendar, Crown, ChevronRight, Lock } from "lucide-react";
import { useAccount } from "wagmi";

interface GameCardProps {
  game: GameInfo;
  onClick?: () => void;
}

export const GameCard = ({ game, onClick }: GameCardProps) => {
  const { address } = useAccount();
  const isCreator = address?.toLowerCase() === game.creator.toLowerCase();

  const getStateStyles = () => {
    switch (game.state) {
      case GameState.REGISTRATION:
        return "text-santa-deepRed bg-pastel-coral/30 border-pastel-coral";
      case GameState.ACTIVE:
        return "text-santa-deepRed bg-pastel-mint/50 border-pastel-mint";
      case GameState.REVEALED:
        return "text-fhenix-purple bg-fhenix-purple/10 border-fhenix-purple/30";
      default:
        return "text-santa-deepRed/60 bg-santa-deepRed/10 border-santa-deepRed/20";
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white border border-santa-deepRed/10 rounded-lg hover:border-fhenix-purple/50 hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-santa-deepRed truncate">{game.name}</h4>
            {game.hasPassword && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-santa-deepRed/10 rounded-lg" title="Password protected">
                <Lock className="w-3 h-3 text-santa-deepRed/70" />
              </div>
            )}
            {isCreator && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-fhenix-purple/10 rounded-lg">
                <Crown className="w-3 h-3 text-fhenix-purple" />
                <span className="text-xs text-fhenix-purple font-medium">Creator</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-santa-deepRed/60">
            <div className="flex items-center gap-1">
              <span className="text-xs text-santa-deepRed/50">ID:</span>
              <span className="font-mono">{game.gameId.toString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{game.playerCount.toString()} players</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(game.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <div className={`px-2 py-1 text-xs font-medium rounded-lg border ${getStateStyles()}`}>
            {gameStateLabels[game.state]}
          </div>
          <ChevronRight className="w-5 h-5 text-santa-deepRed/30 group-hover:text-fhenix-purple transition-colors" />
        </div>
      </div>
    </button>
  );
};
