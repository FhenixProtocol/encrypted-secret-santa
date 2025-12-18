"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  Gift,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
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
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !nickname.trim()) return;

    const hash = await createGame(
      gameName.trim(),
      nickname.trim(),
      password || undefined
    );
    if (hash) {
      setGameName("");
      setNickname("");
      setPassword("");
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

          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Nickname
              </div>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Santa Claus"
              className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40"
              disabled={!isConnected || isLoading}
            />
            <p className="text-xs text-santa-deepRed/50 mt-1">
              This name will be visible to other players
            </p>
          </div>

          <div>
            <label className="text-sm text-santa-deepRed/80 mb-2 block font-medium">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password (optional)
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for public game"
                className="input w-full bg-white border border-santa-deepRed/20 focus:border-fhenix-purple rounded-lg text-santa-deepRed placeholder:text-santa-deepRed/40 pr-10"
                disabled={!isConnected || isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-santa-deepRed/40 hover:text-santa-deepRed transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-santa-deepRed/50 mt-1">
              If set, players will need this password to join
            </p>
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
            disabled={
              !isConnected ||
              !isInitialized ||
              !gameName.trim() ||
              !nickname.trim() ||
              isLoading
            }
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
