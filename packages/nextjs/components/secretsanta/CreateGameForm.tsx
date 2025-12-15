"use client";

import { useState } from "react";
import { Plus, Loader2, Gift, AlertCircle } from "lucide-react";
import { useCreateGame } from "@/hooks/useSecretSanta";
import { useCofheStore } from "@/services/store/cofheStore";
import { useAccount } from "wagmi";

interface CreateGameFormProps {
  onSuccess?: () => void;
}

export const CreateGameForm = ({ onSuccess }: CreateGameFormProps) => {
  const { isConnected } = useAccount();
  const { isInitialized } = useCofheStore();
  const { createGame, isLoading, isSuccess, error } = useCreateGame();
  const [gameName, setGameName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) return;

    const hash = await createGame(gameName.trim());
    if (hash) {
      setGameName("");
      onSuccess?.();
    }
  };

  return (
    <div className="p-6 bg-base-100 border border-base-300 rounded-sm relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-sm">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold font-display uppercase tracking-wide text-base-content">
          Create Game
        </h3>
      </div>

      <p className="text-sm text-base-content/60 mb-4">
        Start a new Secret Santa game. Share the game ID with friends to let them join!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-pixel text-base-content/60 uppercase tracking-widest mb-2 block">
            Game Name
          </label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g., Office Secret Santa 2024"
            className="input input-bordered w-full bg-base-200 border-base-300 focus:border-primary rounded-sm"
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
              Game created successfully! Check your games list below.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isConnected || !isInitialized || !gameName.trim() || isLoading}
          className="btn btn-fhenix w-full font-bold tracking-wider rounded-sm h-12 font-display uppercase"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Create Game
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-center text-sm font-pixel text-base-content/40 uppercase tracking-widest">
            {"// Connect wallet to create a game"}
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
