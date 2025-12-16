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
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid">
      <div className="bg-pastel-pink rounded-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-5 h-5 text-santa-deepRed" />
          <h3 className="text-lg font-bold font-display text-santa-deepRed">
            Create Game
          </h3>
        </div>

        <p className="text-sm text-santa-deepRed/70 mb-4">
          Start a new Secret Santa game. Share the game ID with friends!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g., Office Secret Santa 2024"
              className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40"
              disabled={!isConnected || isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-pastel-coral/30 border border-pastel-coral rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-santa-deepRed flex-shrink-0 mt-0.5" />
              <p className="text-sm text-santa-deepRed">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-pastel-mint/50 border border-pastel-mint rounded-lg">
              <p className="text-sm text-santa-deepRed">
                Game created successfully! Check your games list below.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isConnected || !isInitialized || !gameName.trim() || isLoading}
            className="btn-fhenix w-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Game
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Connect wallet to create a game
            </p>
          )}

          {isConnected && !isInitialized && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Initializing FHE...
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
