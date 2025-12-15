"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { EncryptedText } from "@/components/EncryptedText";
import { CreateGameForm, JoinGameForm, GamesList, GameDetails } from "@/components/secretsanta";
import { GameInfo } from "@/hooks/useSecretSanta";
import { useCofhe } from "@/hooks/useCofhe";

export default function Home() {
  // Initialize CoFHE when wallet is connected
  useCofhe();

  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGameSelect = (game: GameInfo) => {
    setSelectedGame(game);
  };

  const handleBackToHome = () => {
    setSelectedGame(null);
  };

  const handleGamesChanged = () => {
    // Trigger refresh of the games list
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-base-200 font-sans selection:bg-primary selection:text-base-100">
      {/* Background Grid Effect */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] [data-theme='fhenixdark']_&]:opacity-20 transition-opacity duration-300"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      {/* Background Mask/Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8 p-4 md:p-8 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary opacity-50"></div>
            <span className="text-primary font-pixel text-sm tracking-widest uppercase">
              {selectedGame ? `Game #${selectedGame.gameId.toString()}` : "FHE Encrypted Gift Exchange"}
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-base-content tracking-tight font-display uppercase">
            <EncryptedText text={selectedGame ? selectedGame.name : "Secret Santa"} />
          </h1>
          <p className="text-base-content/60 text-lg font-medium">
            {selectedGame
              ? "View participants, reveal your assignment, and manage the game."
              : "Create or join a Secret Santa game with fully encrypted assignments. No one knows who got whom!"}
          </p>
        </header>

        {/* Main Content */}
        {selectedGame ? (
          <GameDetails gameId={selectedGame.gameId} onBack={handleBackToHome} />
        ) : (
          <div className="space-y-8">
            {/* Create & Join Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CreateGameForm onSuccess={handleGamesChanged} />
              <JoinGameForm onSuccess={handleGamesChanged} />
            </div>

            {/* My Games List */}
            <GamesList refreshTrigger={refreshKey} onGameSelect={handleGameSelect} />
          </div>
        )}
      </main>
    </div>
  );
}
