"use client";

import { useEffect, type ReactNode } from "react";

export function ErudaProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only load Eruda in development
    if (process.env.NODE_ENV !== "development") return;

    const loadEruda = async () => {
      try {
        const eruda = await import("eruda");
        eruda.default.init({
          element: document.body,
          tool: ["console", "elements", "network", "resources", "info"],
        });

        // Style the eruda button
        const erudaContainer = document.querySelector(".eruda-entry-btn");
        if (erudaContainer) {
          (erudaContainer as HTMLElement).style.opacity = "0.5";
          (erudaContainer as HTMLElement).style.transform = "scale(0.7)";
        }
      } catch (err) {
        console.error("Failed to load Eruda:", err);
      }
    };

    loadEruda();

    return () => {
      // Cleanup Eruda on unmount
      const eruda = (window as any).eruda;
      if (eruda) {
        eruda.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
