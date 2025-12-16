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
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid">
      <div className="bg-pastel-mint rounded-sm p-5">
        <div className="flex items-center justify-end gap-3 mb-4">
          <h3 className="text-lg font-bold font-display text-santa-deepRed">
            Join Game
          </h3>
          <UserPlus className="w-5 h-5 text-santa-deepRed" />
        </div>

        <p className="text-sm text-santa-deepRed/70 mb-4">
          Enter the game ID shared by the game creator to join.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              Game ID
            </label>
            <input
              type="number"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              placeholder="e.g., 0"
              min="0"
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
            <div className="p-3 bg-pastel-pink/50 border border-pastel-pink rounded-lg">
              <p className="text-sm text-santa-deepRed">
                Successfully joined the game!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isConnected || !isInitialized || !isValidGameId() || isLoading}
            className="btn-santa w-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Join Game
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Connect wallet to join a game
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
