import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://kumbhraksha.app"),
  applicationName: "KumbhRaksha",
  title: {
    default:
      "KumbhRaksha — Crowd safety & missing-persons network for the Nashik Kumbh Mela",
    template: "%s · KumbhRaksha",
  },
  description:
    "An AI-powered crowd-management and missing-persons platform built for the Nashik Simhastha Kumbh Mela, Maharashtra. KumbhRaksha turns every pilgrim's phone into a live search network and gives the Integrated Command & Control Center (ICCC) real-time crowd density, CCTV coverage, and an expanding alert cascade to reunite families and prevent stampedes — no extra hardware required.",
  keywords: [
    "Kumbh Mela",
    "Nashik Kumbh Mela",
    "Simhastha Kumbh",
    "crowd management",
    "crowd safety",
    "missing persons",
    "stampede prevention",
    "ICCC",
    "Integrated Command and Control Center",
    "CCTV analytics",
    "crowd density",
    "public safety",
    "Maharashtra",
    "pilgrim safety",
  ],
  authors: [{ name: "KumbhRaksha" }],
  creator: "KumbhRaksha",
  category: "Public Safety",
  openGraph: {
    type: "website",
    siteName: "KumbhRaksha",
    title:
      "KumbhRaksha — Crowd safety & missing-persons network for the Nashik Kumbh Mela",
    description:
      "Turn every pilgrim's phone into a live search network. Real-time crowd density, CCTV coverage and an expanding alert cascade for the Nashik Kumbh Mela ICCC.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "KumbhRaksha — Crowd safety for the Nashik Kumbh Mela",
    description:
      "AI crowd management + missing-persons network for the Nashik Simhastha Kumbh Mela. No hardware — just the phones people already carry.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        {/* Apply persisted theme before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
