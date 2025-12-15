"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";

interface FrameContextValue {
  context: FrameContext | null;
  isSDKLoaded: boolean;
  isInFrame: boolean;
  error: Error | null;
  actions: typeof sdk.actions | null;
}

const FrameContextContext = createContext<FrameContextValue>({
  context: null,
  isSDKLoaded: false,
  isInFrame: false,
  error: null,
  actions: null,
});

export function FrameProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [actions, setActions] = useState<typeof sdk.actions | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Check if we're in a frame context
        const frameContext = await sdk.context;

        if (frameContext) {
          setContext(frameContext);
          setIsInFrame(true);
          setActions(sdk.actions);

          // Signal ready to the frame
          sdk.actions.ready();
        }

        setIsSDKLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Farcaster SDK:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsSDKLoaded(true);
      }
    };

    initializeSDK();
  }, []);

  return (
    <FrameContextContext.Provider
      value={{
        context,
        isSDKLoaded,
        isInFrame,
        error,
        actions,
      }}
    >
      {children}
    </FrameContextContext.Provider>
  );
}

export function useFrameContext() {
  const context = useContext(FrameContextContext);
  if (!context) {
    throw new Error("useFrameContext must be used within a FrameProvider");
  }
  return context;
}
