"use client";

import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useFrameContext } from "~/components/providers/frame-provider";
import { useCofheStore } from "~/services/store/cofheStore";
import { useCofhe } from "~/hooks/useCofhe";
import { usePermit } from "~/hooks/usePermit";
import { truncateAddress } from "~/lib/truncateAddress";
import { Button } from "~/components/ui/button";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export function Demo() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { context, isSDKLoaded, isInFrame } = useFrameContext();
  const { isInitialized: isCofheInitialized } = useCofheStore();
  const { isInitializing: isCofheInitializing, error: cofheError } = useCofhe();
  const { hasValidPermit, isGeneratingPermit, generatePermit } = usePermit();

  // Get chain name
  const getChainName = (id: number) => {
    switch (id) {
      case 84532:
        return "Base Sepolia";
      case 421614:
        return "Arbitrum Sepolia";
      case 11155111:
        return "Ethereum Sepolia";
      default:
        return `Chain ${id}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold">Encrypted Santa</h1>
        </div>
        <ConnectButton.Custom>
          {({ openConnectModal, openAccountModal, mounted, account, chain }) => {
            const connected = mounted && account && chain;
            return (
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                onClick={connected ? openAccountModal : openConnectModal}
              >
                {connected ? (
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {truncateAddress(account.address)}
                  </span>
                ) : (
                  "Connect"
                )}
              </Button>
            );
          }}
        </ConnectButton.Custom>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Frame Context Section */}
        <section className="p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Farcaster Context
          </h2>
          <div className="space-y-2">
            <StatusRow
              label="SDK Loaded"
              status={isSDKLoaded ? "success" : "loading"}
            />
            <StatusRow
              label="In Frame"
              status={isInFrame ? "success" : "warning"}
              message={!isInFrame ? "Running outside Farcaster" : undefined}
            />
            {context?.user && (
              <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {context.user.displayName || context.user.username || `FID: ${context.user.fid}`}
                </span>
                {context.user.pfpUrl && (
                  <img
                    src={context.user.pfpUrl}
                    alt="Profile"
                    className="w-6 h-6 rounded-full ml-auto"
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Wallet Section */}
        <section className="p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Wallet Status
          </h2>
          <div className="space-y-2">
            <StatusRow
              label="Connected"
              status={isConnected ? "success" : "error"}
            />
            {isConnected && address && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Address</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {truncateAddress(address)}
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <span>{getChainName(chainId)}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* FHE Status Section */}
        <section className="p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            FHE Status
          </h2>
          <div className="space-y-2">
            <StatusRow
              label="CoFHE Initialized"
              status={
                isCofheInitializing
                  ? "loading"
                  : isCofheInitialized
                  ? "success"
                  : cofheError
                  ? "error"
                  : "pending"
              }
              message={cofheError?.message}
            />
            <StatusRow
              label="Permit"
              status={
                isGeneratingPermit
                  ? "loading"
                  : hasValidPermit
                  ? "success"
                  : "warning"
              }
            />

            {isConnected && isCofheInitialized && !hasValidPermit && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={generatePermit}
                disabled={isGeneratingPermit}
              >
                {isGeneratingPermit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Generate Permit
                  </>
                )}
              </Button>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="p-4 rounded-lg border border-border bg-card">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            About
          </h2>
          <p className="text-sm text-muted-foreground">
            Encrypted Santa is a Farcaster mini-app powered by Fhenix FHE
            (Fully Homomorphic Encryption). Features will be added soon!
          </p>
        </section>
      </main>

      {/* Bottom Navigation Placeholder */}
      <nav className="flex items-center justify-around p-4 border-t border-border bg-card">
        <span className="text-xs text-muted-foreground">
          Navigation coming soon...
        </span>
      </nav>
    </div>
  );
}

// Status Row Component
interface StatusRowProps {
  label: string;
  status: "success" | "error" | "warning" | "loading" | "pending";
  message?: string;
}

function StatusRow({ label, status, message }: StatusRowProps) {
  const getIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "loading":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {message && (
          <span className="text-xs text-muted-foreground">{message}</span>
        )}
        {getIcon()}
      </div>
    </div>
  );
}
