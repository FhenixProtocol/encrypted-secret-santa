"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  rabbyWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { arbitrumSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Secret Santa",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
  chains: [arbitrumSepolia],
  ssr: true,
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        rabbyWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
});
