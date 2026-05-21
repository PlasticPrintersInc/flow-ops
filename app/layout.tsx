import type { Metadata } from "next";
import { IBM_Plex_Mono, Roboto, Merriweather } from "next/font/google";

import { BottomToolbar } from "@/components/shell/bottom-toolbar";
import { AppProviders } from "@/components/theme/app-providers";
import { getSessionContext } from "@/lib/auth/session";
import { getServerTheme } from "@/lib/theme.server";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Flow Ops",
    template: "%s | Flow Ops",
  },
  description: "Internal operations tooling for department-aware scanning workflows.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, theme] = await Promise.all([getSessionContext(), getServerTheme()]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${merriweather.variable} ${plexMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders initialTheme={theme}>
          <div className="relative min-h-screen">
            <main className="pb-28">{children}</main>
            <BottomToolbar isSupabaseConfigured={session.isConfigured} session={session.user} />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
