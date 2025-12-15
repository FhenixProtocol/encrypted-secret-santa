"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Key, Gift, User } from "lucide-react";
import { useMyTarget, useParticipants } from "@/hooks/useSecretSanta";
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
  const { participants, fetchParticipants } = useParticipants(gameId);

  const [showTarget, setShowTarget] = useState(false);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);

  useEffect(() => {
    fetchMyTarget();
    fetchParticipants();
  }, [fetchMyTarget, fetchParticipants, refreshTrigger]);

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

  const getTargetAddress = () => {
    if (targetIndex === null || !participants.length) return null;
    if (targetIndex >= 0 && targetIndex < participants.length) {
      return participants[targetIndex];
    }
    return null;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const targetAddress = getTargetAddress();

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
          Your Secret Assignment
        </h3>
      </div>

      <p className="text-sm text-base-content/60 mb-6">
        Your assignment is encrypted on-chain. Only you can decrypt it with your permit.
      </p>

      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!encryptedIndex ? (
        <div className="py-8 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-base-content/60">Loading your encrypted assignment...</p>
        </div>
      ) : showTarget && targetAddress ? (
        <div className="space-y-4">
          <div className="p-6 bg-primary/5 border border-primary/30 rounded-sm text-center">
            <p className="text-sm font-pixel text-primary uppercase tracking-widest mb-2">
              You are the Secret Santa for:
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono text-lg text-base-content font-bold">
                {truncateAddress(targetAddress)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowTarget(false)}
            className="btn btn-ghost w-full rounded-sm"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-6 bg-base-200 border border-base-300 rounded-sm text-center">
            <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-base-content/40" />
            </div>
            <p className="text-base-content/60 font-mono">
              {"••••••••••••••••"}
            </p>
            <p className="text-xs text-base-content/40 mt-2">
              Click below to reveal your assignment
            </p>
          </div>

          {!hasValidPermit ? (
            <button
              onClick={() => setIsPermitModalOpen(true)}
              className="btn btn-fhenix w-full font-bold tracking-wider rounded-sm h-12 font-display uppercase"
            >
              <Key className="w-5 h-5 mr-2" />
              Generate Permit First
            </button>
          ) : (
            <button
              onClick={handleReveal}
              disabled={isLoading || !isInitialized}
              className="btn btn-fhenix w-full font-bold tracking-wider rounded-sm h-12 font-display uppercase"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Reveal My Assignment
                </>
              )}
            </button>
          )}
        </div>
      )}

      <PermitModal isOpen={isPermitModalOpen} onClose={() => setIsPermitModalOpen(false)} />
    </div>
  );
};
