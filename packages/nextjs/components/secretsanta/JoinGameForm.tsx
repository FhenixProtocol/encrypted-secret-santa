"use client";

import { useState } from "react";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useJoinGame } from "@/hooks/useSecretSanta";
import { useCofheStore } from "@/services/store/cofheStore";
import { useAccount } from "wagmi";

interface JoinGameFormProps {
  onSuccess?: () => void;
}

export const JoinGameForm = ({ onSuccess }: JoinGameFormProps) => {
  const { isConnected } = useAccount();
  const { isInitialized } = useCofheStore();
  const { joinGame, isLoading, isSuccess, error } = useJoinGame();
  const [gameIdInput, setGameIdInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gameId = BigInt(gameIdInput.trim());

    const hash = await joinGame(gameId);
    if (hash) {
      onSuccess?.();
      setGameIdInput("");
    }
  };

  const isValidGameId = () => {
    try {
      const id = BigInt(gameIdInput.trim());
      return id >= BigInt(0);
    } catch {
      return false;
    }
  };

  return (
    <div className="p-6 bg-base-100 border border-base-300 rounded-sm relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-secondary"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-secondary"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-secondary"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-secondary"></div>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-secondary/10 rounded-sm">
          <UserPlus className="w-5 h-5 text-secondary" />
        </div>
        <h3 className="text-lg font-bold font-display uppercase tracking-wide text-base-content">
          Join Game
        </h3>
      </div>

      <p className="text-sm text-base-content/60 mb-4">
        Enter the game ID shared by the game creator to join an existing game.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-pixel text-base-content/60 uppercase tracking-widest mb-2 block">
            Game ID
          </label>
          <input
            type="number"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
            placeholder="e.g., 0"
            min="0"
            className="input input-bordered w-full bg-base-200 border-base-300 focus:border-secondary rounded-sm"
            disabled={!isConnected || isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-sm">
            <p className="text-sm text-green-500">
              Successfully joined the game!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isConnected || !isInitialized || !isValidGameId() || isLoading}
          className="btn btn-secondary w-full font-bold tracking-wider rounded-sm h-12 font-display uppercase"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Joining...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Join Game
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-center text-sm font-pixel text-base-content/40 uppercase tracking-widest">
            {"// Connect wallet to join a game"}
          </p>
        )}

        {isConnected && !isInitialized && (
          <p className="text-center text-sm font-pixel text-base-content/40 uppercase tracking-widest">
            {"// Initializing FHE..."}
          </p>
        )}
      </form>
    </div>
  );
};
