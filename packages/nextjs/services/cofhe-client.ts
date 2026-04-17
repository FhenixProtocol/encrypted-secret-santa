import { createCofheConfig, createCofheClient } from "@cofhe/sdk/web";
import { chains } from "@cofhe/sdk/chains";

type CofheClientInstance = ReturnType<typeof createCofheClient>;

let _instance: CofheClientInstance | null = null;

function createInstance(): CofheClientInstance {
  const config = createCofheConfig({
    supportedChains: [chains.arbSepolia],
  });
  return createCofheClient(config);
}

export function getCofheClient(): CofheClientInstance {
  if (typeof window === "undefined") {
    throw new Error("CoFHE client is only available in browser context");
  }
  if (!_instance) {
    _instance = createInstance();
  }
  return _instance;
}

// Lazy proxy — defers createCofheClient() until first property access in browser.
// Safe to import at module level in "use client" components without breaking SSR.
export const cofheClient = new Proxy({} as CofheClientInstance, {
  get(_target, prop) {
    return getCofheClient()[prop as keyof CofheClientInstance];
  },
});
