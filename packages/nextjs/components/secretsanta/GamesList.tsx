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
    <div className="p-6 bg-base-100 border border-base-300 rounded-sm relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-sm">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold font-display uppercase tracking-wide text-base-content">
            My Games
          </h3>
        </div>

        <button
          onClick={() => fetchMyGames()}
          disabled={isLoading || !isConnected}
          className="btn btn-ghost btn-sm rounded-sm"
          title="Refresh games"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!isConnected ? (
        <div className="py-12 text-center">
          <p className="text-sm font-pixel text-base-content/40 uppercase tracking-widest">
            {"// Connect wallet to see your games"}
          </p>
        </div>
      ) : isLoading && games.length === 0 ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-base-content/60">Loading your games...</p>
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={() => fetchMyGames()} className="btn btn-sm btn-ghost mt-2">
            Try Again
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="py-12 text-center">
          <Gift className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
          <p className="text-base-content/60 mb-2">No games yet</p>
          <p className="text-sm text-base-content/40">
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
  );
};
