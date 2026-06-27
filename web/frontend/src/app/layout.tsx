import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans" suppressHydrationWarning>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
