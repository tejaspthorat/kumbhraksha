import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "KumbhRaksha — Turn every phone into a search network",
  description:
    "A living missing-persons network for mass gatherings. Citizens report and search; authorities coordinate the response in real time — no hardware required.",
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
