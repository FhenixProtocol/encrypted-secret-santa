"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Key, Gift, User } from "lucide-react";
import { useMyTarget, useParticipantsWithNames, ParticipantWithName } from "@/hooks/useSecretSanta";
import { usePermit } from "@/hooks/usePermit";
import { useCofheStore } from "@/services/store/cofheStore";
import { PermitModal } from "@/components/PermitModal";

interface TargetRevealProps {
  gameId: bigint;
  refreshTrigger?: number;
}

export const TargetReveal = ({ gameId, refreshTrigger }: TargetRevealProps) => {
  const { isInitialized } = useCofheStore();
  const { hasValidPermit } = usePermit();
  const {
    encryptedIndex,
    targetIndex,
    isLoading,
    error,
    fetchMyTarget,
    unsealTarget,
  } = useMyTarget(gameId);
  const { participants, fetchParticipantsWithNames } = useParticipantsWithNames(gameId);

  const [showTarget, setShowTarget] = useState(false);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);

  useEffect(() => {
    fetchMyTarget();
    fetchParticipantsWithNames();
  }, [fetchMyTarget, fetchParticipantsWithNames, refreshTrigger]);

  const handleReveal = async () => {
    if (!hasValidPermit) {
      setIsPermitModalOpen(true);
      return;
    }

    if (targetIndex === null) {
      await unsealTarget();
    }
    setShowTarget(true);
  };

  const getTarget = (): ParticipantWithName | null => {
    if (targetIndex === null || !participants.length) return null;
    if (targetIndex >= 0 && targetIndex < participants.length) {
      return participants[targetIndex];
    }
    return null;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const target = getTarget();

  return (
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform rotate-2 hover:rotate-0 transition-transform duration-300 encrypted-glow">
      <div className="bg-pastel-coral rounded-sm p-5 relative overflow-hidden">
        {/* Subtle encryption scan line effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fhenix-purple to-transparent animate-pulse" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-5 h-5 text-santa-deepRed" />
          <h3 className="text-lg font-bold font-display text-santa-deepRed">
            Your Secret Assignment
          </h3>
        </div>

        <p className="text-sm text-santa-deepRed/70 mb-6">
          Your assignment is encrypted on-chain using FHE. Only you can decrypt it with your permit.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-white/50 border border-santa-deepRed/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-santa-deepRed flex-shrink-0 mt-0.5" />
            <p className="text-sm text-santa-deepRed">{error}</p>
          </div>
        )}

        {!encryptedIndex ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 text-fhenix-purple/40 animate-spin mx-auto mb-4" />
            <p className="text-sm text-santa-deepRed/60">Loading your encrypted assignment...</p>
          </div>
        ) : showTarget && target ? (
          <div className="space-y-4">
            <div className="p-6 bg-fhenix-purple/10 border border-fhenix-purple/30 rounded-lg text-center">
              <p className="text-sm text-santa-deepRed/70 mb-2">
                You are the Secret Santa for:
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-fhenix-purple/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-fhenix-purple" />
                </div>
                {target.name ? (
                  <>
                    <span className="text-xl text-santa-deepRed font-bold">
                      {target.name}
                    </span>
                    <span className="font-mono text-sm text-santa-deepRed/60">
                      {truncateAddress(target.address)}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-lg text-santa-deepRed font-bold">
                    {truncateAddress(target.address)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowTarget(false)}
              className="w-full py-3 text-santa-deepRed/70 hover:text-santa-deepRed flex items-center justify-center gap-2 transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Hide Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-white/30 border border-santa-deepRed/10 rounded-lg text-center">
              <div className="w-16 h-16 rounded-full bg-fhenix-purple/10 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-fhenix-purple/40" />
              </div>
              <p className="text-santa-deepRed/60 font-mono">
                {"••••••••••••••••"}
              </p>
              <p className="text-xs text-santa-deepRed/40 mt-2">
                Click below to reveal your assignment
              </p>
            </div>

            {!hasValidPermit ? (
              <button
                onClick={() => setIsPermitModalOpen(true)}
                className="btn-fhenix w-full h-12 flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Generate Permit First
              </button>
            ) : (
              <button
                onClick={handleReveal}
                disabled={isLoading || !isInitialized}
                className="btn-fhenix w-full h-12 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Reveal My Assignment
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <PermitModal isOpen={isPermitModalOpen} onClose={() => setIsPermitModalOpen(false)} />
      </div>
    </div>
  );
};
