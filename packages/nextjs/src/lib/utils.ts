import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// App metadata
export const METADATA = {
  name: "Encrypted Santa",
  description: "A Farcaster mini-app with FHE-powered privacy",
  image: {
    url: "/banner.png",
    width: 1200,
    height: 630,
  },
  icon: {
    url: "/icon.png",
    width: 512,
    height: 512,
  },
  splashBackground: "#0052FF",
};
