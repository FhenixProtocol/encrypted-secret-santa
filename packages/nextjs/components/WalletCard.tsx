"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Lock, Unlock, Wallet, LogOut } from "lucide-react";
import { useState } from "react";

export const WalletCard = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [isHovered, setIsHovered] = useState(false);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  if (!isConnected) {
    return (
      <button
        onClick={() => openConnectModal?.()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="btn-fhenix flex items-center gap-2 h-10 px-4"
      >
        {isHovered ? (
          <Unlock className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Wallet Address */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-fhenix-purple/30 rounded-lg h-10">
        <Wallet className="w-4 h-4 text-fhenix-purple" />
        <span className="text-white text-sm font-mono">{truncatedAddress}</span>
      </div>

      {/* Disconnect */}
      <button
        onClick={() => disconnect()}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all h-10 w-10 flex items-center justify-center group"
        title="Disconnect"
      >
        <LogOut className="w-4 h-4 text-white/50 group-hover:text-white" />
      </button>
    </div>
  );
};
