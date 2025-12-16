"use client";

import { useState } from "react";
import { Key, Shield, CheckCircle2, Loader2, AlertCircle, Settings } from "lucide-react";
import { usePermit } from "@/hooks/usePermit";
import { useCofhe } from "@/hooks/useCofhe";
import { useAccount } from "wagmi";
import { PermitModal } from "@/components/PermitModal";

export const PermitCard = () => {
  const { isConnected } = useAccount();
  const { isInitialized, isInitializing } = useCofhe();
  const { hasValidPermit, isGeneratingPermit, generatePermit } = usePermit();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickGenerate = async () => {
    await generatePermit();
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid">
        <div className="bg-fhenix-purple/10 rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fhenix-purple/20 rounded-lg">
                <Shield className="w-4 h-4 text-fhenix-purple" />
              </div>
              <h3 className="text-lg font-bold font-display text-santa-deepRed">
                FHE Permit
              </h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 text-santa-deepRed/60 hover:text-santa-deepRed transition-colors rounded-lg hover:bg-santa-deepRed/10"
              title="Manage permit"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-santa-deepRed/60 mb-4">
            A permit is required to decrypt your Secret Santa assignment.
          </p>

          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg mb-3">
            <span className="text-sm text-santa-deepRed/70">Status</span>
            <div className="flex items-center gap-2">
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 text-fhenix-purple animate-spin" />
                  <span className="text-sm text-santa-deepRed">Initializing...</span>
                </>
              ) : !isInitialized ? (
                <>
                  <AlertCircle className="w-4 h-4 text-pastel-coral" />
                  <span className="text-sm text-santa-deepRed">Not Ready</span>
                </>
              ) : hasValidPermit ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-fhenix-purple" />
                  <span className="text-sm text-santa-deepRed">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-pastel-coral" />
                  <span className="text-sm text-santa-deepRed">Not Generated</span>
                </>
              )}
            </div>
          </div>

          {!hasValidPermit && isInitialized && (
            <button
              onClick={handleQuickGenerate}
              disabled={isGeneratingPermit}
              className="btn-fhenix w-full h-10 flex items-center justify-center gap-2 text-sm"
            >
              {isGeneratingPermit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Generate Permit
                </>
              )}
            </button>
          )}

          {hasValidPermit && (
            <div className="p-3 bg-pastel-mint/30 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-fhenix-purple flex-shrink-0" />
              <span className="text-xs text-santa-deepRed">
                You can view your encrypted assignments
              </span>
            </div>
          )}
        </div>
      </div>

      <PermitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
