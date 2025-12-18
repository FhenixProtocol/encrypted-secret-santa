"use client";

import { X, Gift, Users, Shuffle, Eye, Lock } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: Gift,
      title: "Create or Join a Game",
      description:
        "Start a new Secret Santa game and share the Game ID with friends, or join an existing game using the ID provided by the organizer.",
    },
    {
      icon: Users,
      title: "Wait for Players",
      description:
        "The game creator waits until all participants have joined. A minimum of 3 players is required to start the game.",
    },
    {
      icon: Shuffle,
      title: "Start the Game",
      description:
        "Once everyone has joined, the creator starts the game. The smart contract randomly assigns each player a Secret Santa target using encrypted computation.",
    },
    {
      icon: Lock,
      title: "Generate Your Permit",
      description:
        "To see your assignment, you need to generate a permit by signing a message with your wallet. This proves you own your address.",
    },
    {
      icon: Eye,
      title: "Reveal Your Assignment",
      description:
        "Use your permit to decrypt and reveal who you need to buy a gift for. Only you can see your assignment - it's fully encrypted!",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-santa-deepRed/10 bg-fhenix-purple/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fhenix-purple/20 rounded-lg">
              <Gift className="w-5 h-5 text-fhenix-purple" />
            </div>
            <h2 className="text-lg font-bold text-santa-deepRed font-display">
              How to Play
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-santa-deepRed/50 hover:text-santa-deepRed rounded-lg hover:bg-santa-deepRed/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Intro */}
          <div className="p-4 bg-pastel-cream rounded-lg">
            <p className="text-sm text-santa-deepRed">
              Encrypted Santa uses Fully Homomorphic Encryption (FHE) to ensure
              that Secret Santa assignments remain truly secret. Not even the
              blockchain can see who got whom!
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 bg-pastel-mint/20 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-fhenix-purple/20 rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-fhenix-purple" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-fhenix-purple">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-santa-deepRed text-sm">
                    {step.title}
                  </h3>
                  <p className="text-xs text-santa-deepRed/70 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-fhenix-purple/10 rounded-lg border border-fhenix-purple/20">
            <p className="text-xs text-santa-deepRed/80 text-center">
              <Lock className="w-3 h-3 inline-block mr-1" />
              Powered by Fhenix FHE technology on Arbitrum Sepolia
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="p-4 border-t border-santa-deepRed/10 bg-pastel-cream/30">
          <button onClick={onClose} className="btn-fhenix w-full h-10">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
