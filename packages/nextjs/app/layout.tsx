import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Secret Santa | Fhenix",
  description: "Create or join a Secret Santa game with fully encrypted assignments powered by FHE. No one knows who got whom!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="christmas">
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#FFFFFF",
                color: "#9B1B30",
                border: "1px solid #8B5CF6",
                borderRadius: "8px",
              },
              success: {
                style: {
                  border: "1px solid #8B5CF6",
                },
                iconTheme: {
                  primary: "#8B5CF6",
                  secondary: "#FFFFFF",
                },
              },
              error: {
                style: {
                  border: "1px solid #FFA090",
                },
                iconTheme: {
                  primary: "#FFA090",
                  secondary: "#9B1B30",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
