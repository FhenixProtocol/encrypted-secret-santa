"use client";

import { GameInfo, GameState, gameStateLabels } from "@/hooks/useSecretSanta";
import { Users, Calendar, Crown, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";

interface GameCardProps {
  game: GameInfo;
  onClick?: () => void;
}

export const GameCard = ({ game, onClick }: GameCardProps) => {
  const { address } = useAccount();
  const isCreator = address?.toLowerCase() === game.creator.toLowerCase();

  const getStateColor = () => {
    switch (game.state) {
      case GameState.REGISTRATION:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case GameState.ACTIVE:
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case GameState.REVEALED:
        return "text-primary bg-primary/10 border-primary/30";
      default:
        return "text-base-content/60 bg-base-200 border-base-300";
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-base-100 border border-base-300 rounded-sm hover:border-primary transition-all text-left group relative overflow-hidden"
    >
      {/* Corner accents on hover */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-base-content truncate">{game.name}</h4>
            {isCreator && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-sm">
                <Crown className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-pixel">CREATOR</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
            <div className="flex items-center gap-1">
              <span className="font-pixel text-xs">ID:</span>
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
          <div className={`px-2 py-1 text-xs font-pixel uppercase rounded-sm border ${getStateColor()}`}>
            {gameStateLabels[game.state]}
          </div>
          <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </button>
  );
};
