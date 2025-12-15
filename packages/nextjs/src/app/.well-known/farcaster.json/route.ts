import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const manifest = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEyMzQ1LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCJ9",
      payload: "eyJkb21haW4iOiJleGFtcGxlLmNvbSJ9",
      signature:
        "MHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw",
    },
    frame: {
      version: "1",
      name: "Encrypted Santa",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/banner.png`,
      buttonTitle: "Open App",
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#0052FF",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return NextResponse.json(manifest);
}
