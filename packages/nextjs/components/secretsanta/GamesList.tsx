"use client";

import { useEffect } from "react";
import { Gift, RefreshCw, Loader2 } from "lucide-react";
import { useMyGames, GameInfo } from "@/hooks/useSecretSanta";
import { GameCard } from "./GameCard";
import { useAccount } from "wagmi";

interface GamesListProps {
  onGameSelect?: (game: GameInfo) => void;
  refreshTrigger?: number;
}

export const GamesList = ({ onGameSelect, refreshTrigger }: GamesListProps) => {
  const { isConnected } = useAccount();
  const { games, isLoading, error, fetchMyGames } = useMyGames();

  useEffect(() => {
    if (isConnected) {
      fetchMyGames();
    }
  }, [isConnected, fetchMyGames, refreshTrigger]);

  return (
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid">
      <div className="bg-pastel-cream rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-santa-deepRed" />
            <h3 className="text-lg font-bold font-display text-santa-deepRed">
              My Games
            </h3>
          </div>

          <button
            onClick={() => fetchMyGames()}
            disabled={isLoading || !isConnected}
            className="p-2 text-santa-deepRed/60 hover:text-santa-deepRed transition-colors rounded-lg hover:bg-santa-deepRed/10"
            title="Refresh games"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {!isConnected ? (
          <div className="py-12 text-center">
            <p className="text-sm text-santa-deepRed/50">
              Connect wallet to see your games
            </p>
          </div>
        ) : isLoading && games.length === 0 ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-fhenix-purple/40 animate-spin mx-auto mb-4" />
            <p className="text-sm text-santa-deepRed/60">Loading your games...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-pastel-coral">{error}</p>
            <button onClick={() => fetchMyGames()} className="text-sm text-santa-deepRed/60 hover:text-santa-deepRed mt-2">
              Try Again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="py-12 text-center">
            <Gift className="w-12 h-12 text-santa-deepRed/20 mx-auto mb-4" />
            <p className="text-santa-deepRed/60 mb-2">No games yet</p>
            <p className="text-sm text-santa-deepRed/40">
              Create a new game or join one using a game ID!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <GameCard
                key={game.gameId.toString()}
                game={game}
                onClick={() => onGameSelect?.(game)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
