"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Key,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useCofhe } from "@/hooks/useCofhe";
import { usePermit } from "@/hooks/usePermit";
import { useAccount, useChainId, useChains } from "wagmi";

interface PermitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermitModal = ({ isOpen, onClose }: PermitModalProps) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { isInitialized, isInitializing, error: cofheError } = useCofhe();
  const {
    hasValidPermit,
    isGeneratingPermit,
    error: permitError,
    generatePermit,
    removePermit,
  } = usePermit();

  const chainName =
    chains.find((c) => c.id === chainId)?.name || `Chain ${chainId}`;

  // Track if we just generated a permit (to auto-close)
  const wasGenerating = useRef(false);

  // Auto-close modal when permit is successfully generated
  useEffect(() => {
    if (wasGenerating.current && hasValidPermit && !isGeneratingPermit) {
      wasGenerating.current = false;
      const timer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasValidPermit, isGeneratingPermit, onClose]);

  if (!isOpen) return null;

  const handleGeneratePermit = async () => {
    wasGenerating.current = true;
    await generatePermit();
  };

  const handleRevokePermit = async () => {
    await removePermit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-santa-deepRed/10 bg-fhenix-purple/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fhenix-purple/20 rounded-lg">
              <Key className="w-5 h-5 text-fhenix-purple" />
            </div>
            <h2 className="text-lg font-bold text-santa-deepRed font-display">
              Manage Permit
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-santa-deepRed/50 hover:text-santa-deepRed rounded-lg hover:bg-santa-deepRed/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Section */}
          <div className="p-4 bg-pastel-cream rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-fhenix-purple flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-santa-deepRed">
                  A permit is required to reveal your encrypted Secret Santa
                  assignment. Click &quot;Generate&quot; and sign the message in
                  your wallet to create one.
                </p>
                <p className="text-xs text-santa-deepRed/60">
                  Permits are stored locally and are chain-specific.
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-pastel-mint/30 rounded-lg">
              <span className="text-sm text-santa-deepRed/70">
                Network
              </span>
              <span className="text-sm font-mono text-santa-deepRed">
                {chainName}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-pastel-mint/30 rounded-lg">
              <span className="text-sm text-santa-deepRed/70">
                COFHE Status
              </span>
              <div className="flex items-center gap-2">
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 text-fhenix-purple animate-spin" />
                    <span className="text-sm text-santa-deepRed">
                      Initializing...
                    </span>
                  </>
                ) : isInitialized ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-fhenix-purple" />
                    <span className="text-sm text-santa-deepRed">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-pastel-coral" />
                    <span className="text-sm text-santa-deepRed">Not Ready</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-pastel-mint/30 rounded-lg">
              <span className="text-sm text-santa-deepRed/70">
                Permit Status
              </span>
              <div className="flex items-center gap-2">
                {hasValidPermit ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-fhenix-purple" />
                    <span className="text-sm text-santa-deepRed">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-pastel-coral" />
                    <span className="text-sm text-santa-deepRed">
                      Not Generated
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {(cofheError || permitError) && (
            <div className="p-4 bg-pastel-coral/30 border border-pastel-coral rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-santa-deepRed flex-shrink-0 mt-0.5" />
                <p className="text-sm text-santa-deepRed">
                  {cofheError?.message || permitError}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-santa-deepRed/10 space-y-3 bg-pastel-cream/30">
          {!hasValidPermit ? (
            <button
              onClick={handleGeneratePermit}
              disabled={!isInitialized || isGeneratingPermit || !address}
              className="btn-fhenix w-full h-12 flex items-center justify-center gap-2"
            >
              {isGeneratingPermit ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Generate Permit
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRevokePermit}
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-pastel-coral/30 hover:bg-pastel-coral/50 border border-pastel-coral text-santa-deepRed rounded-lg font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Revoke
              </button>
              <button
                onClick={handleGeneratePermit}
                disabled={isGeneratingPermit}
                className="btn-fhenix flex-1 h-12 flex items-center justify-center gap-2"
              >
                {isGeneratingPermit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          )}

          {!address && (
            <p className="text-center text-sm text-santa-deepRed/50">
              Connect wallet to generate permit
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
