"use client";

import { useState } from "react";
import {
  Snowflake,
  Lock,
  Plus,
  UserPlus,
  HelpCircle,
  Droplets,
} from "lucide-react";
import { WalletCard } from "@/components/WalletCard";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import {
  CreateGameForm,
  JoinGameForm,
  GamesList,
  GameDetails,
  PermitCard,
} from "@/components/secretsanta";
import { GameInfo } from "@/hooks/useSecretSanta";
import { useCofhe } from "@/hooks/useCofhe";
import Image from "next/image";

// Snowflake decoration component
const SnowflakeDecoration = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <Snowflake className={`text-white/20 ${className}`} style={style} />;

// Encryption lock decoration
const LockDecoration = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <Lock className={`text-fhenix-purple/10 ${className}`} style={style} />;

export default function Home() {
  // Initialize CoFHE when wallet is connected
  useCofhe();

  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCard, setActiveCard] = useState<"create" | "join" | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleGameSelect = (game: GameInfo) => {
    setSelectedGame(game);
  };

  const handleBackToHome = () => {
    setSelectedGame(null);
  };

  const handleGamesChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-fhenix-purple selection:text-white">
      {/* Snowflake decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <SnowflakeDecoration className="absolute top-20 left-[10%] w-8 h-8 animate-twinkle" />
        <SnowflakeDecoration
          className="absolute top-40 right-[15%] w-12 h-12 animate-twinkle"
          style={{ animationDelay: "0.5s" }}
        />
        <SnowflakeDecoration
          className="absolute top-[60%] left-[5%] w-6 h-6 animate-twinkle"
          style={{ animationDelay: "1s" }}
        />
        <SnowflakeDecoration
          className="absolute top-[30%] right-[8%] w-10 h-10 animate-twinkle"
          style={{ animationDelay: "1.5s" }}
        />
        <SnowflakeDecoration
          className="absolute bottom-[20%] left-[20%] w-8 h-8 animate-twinkle"
          style={{ animationDelay: "2s" }}
        />
        <SnowflakeDecoration
          className="absolute bottom-[40%] right-[25%] w-6 h-6 animate-twinkle"
          style={{ animationDelay: "0.7s" }}
        />
      </div>

      {/* Encryption-themed decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <LockDecoration
          className="absolute top-[25%] left-[3%] w-6 h-6 animate-float"
          style={{ animationDelay: "0.5s" }}
        />
        <LockDecoration
          className="absolute top-[70%] right-[5%] w-5 h-5 animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        {/* Binary streams */}
        <div className="absolute top-[10%] right-[3%] flex flex-col gap-1 opacity-20">
          <span className="text-fhenix-purple text-xs font-mono animate-pulse">
            01101
          </span>
          <span
            className="text-fhenix-purple text-xs font-mono animate-pulse"
            style={{ animationDelay: "0.2s" }}
          >
            10010
          </span>
        </div>
        <div className="absolute bottom-[25%] left-[2%] flex flex-col gap-1 opacity-20">
          <span
            className="text-fhenix-purple text-xs font-mono animate-pulse"
            style={{ animationDelay: "0.3s" }}
          >
            10110
          </span>
        </div>
      </div>

      {/* Subtle glow effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fhenix-purple/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fhenix-blue/10 blur-[150px] rounded-full"></div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto flex flex-col gap-4 p-4 md:p-6">
        {/* Header - Logo and Wallet */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2"></div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.alchemy.com/faucets/arbitrum-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all text-white text-sm font-medium"
            >
              <Droplets className="w-4 h-4" />
              <span className="hidden sm:inline">Faucet</span>
            </a>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all text-white text-sm font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How to Play</span>
            </button>
            <WalletCard />
          </div>
        </header>

        {/* Title - Compact */}
        <div className="text-center py-2">
          <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight font-display">
            {selectedGame ? selectedGame.name : "Encrypted Santa"}
          </h1>
          {selectedGame && (
            <p className="text-white/60 mt-2 text-sm">
              Game #{selectedGame.gameId.toString()}
            </p>
          )}
        </div>

        {/* Main Content */}
        {selectedGame ? (
          <GameDetails gameId={selectedGame.gameId} onBack={handleBackToHome} />
        ) : (
          <div className="space-y-4">
            {/* Stacked Photo Cards - Create & Join */}
            <div className="relative flex justify-center items-center min-h-[560px] pt-6">
              {/* Tab buttons floating on top */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                <button
                  onClick={() => setActiveCard("create")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg ${
                    activeCard === "create" || activeCard === null
                      ? "bg-white text-santa-deepRed"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Create Game
                </button>
                <button
                  onClick={() => setActiveCard("join")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg ${
                    activeCard === "join"
                      ? "bg-white text-santa-deepRed"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Join Game
                </button>
              </div>
              {/* Create Game Card */}
              <div
                onClick={() => activeCard === "join" && setActiveCard("create")}
                className={`absolute w-full max-w-sm transition-all duration-300 top-10 ${
                  activeCard === "join"
                    ? "z-10 -rotate-3 scale-95 -translate-x-[55%] cursor-pointer hover:scale-[0.97] hover:-translate-x-[53%]"
                    : "z-20 rotate-0 scale-100 translate-x-0"
                }`}
              >
                <CreateGameForm onSuccess={handleGamesChanged} />
              </div>

              {/* Join Game Card */}
              <div
                onClick={() => activeCard !== "join" && setActiveCard("join")}
                className={`absolute w-full max-w-sm transition-all duration-300 top-10 ${
                  activeCard === "join"
                    ? "z-20 rotate-0 scale-100 translate-x-0"
                    : "z-10 rotate-3 scale-95 translate-x-[55%] cursor-pointer hover:scale-[0.97] hover:translate-x-[53%]"
                }`}
              >
                <JoinGameForm onSuccess={handleGamesChanged} />
              </div>
            </div>

            {/* My Games List */}
            <div className="max-w-sm mx-auto">
              <GamesList
                refreshTrigger={refreshKey}
                onGameSelect={handleGameSelect}
              />
            </div>

            {/* Permit Management Card */}
            <div className="max-w-sm mx-auto">
              <PermitCard />
            </div>
          </div>
        )}
      </main>

      {/* Footer - Compact */}
      <footer className="relative z-10 py-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">Powered by</span>
            <Image
              src="/fhenix_logo_dark.svg"
              alt="Fhenix"
              width={60}
              height={60}
              className="opacity-80"
            />
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">on</span>
            <Image
              src="/arbitrum.png"
              alt="Arbitrum"
              width={72}
              height={72}
              className="opacity-80"
            />
          </div>
        </div>
      </footer>

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </div>
  );
}
