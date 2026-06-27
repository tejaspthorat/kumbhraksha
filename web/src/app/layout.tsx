import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrowdAI — Intelligent Crowd Management System",
  description: "Real-time AI-powered crowd monitoring, density analysis, predictive alerts, and safety management platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
          {/* {!isSignedIn && (
            <header className="flex justify-end items-center p-4 gap-4 h-16 border-b border-white/4">
              <SignInButton mode="modal"><button className="text-sm text-white/60 hover:text-white transition-colors">Sign In</button></SignInButton>
              <SignUpButton mode="modal"><button className="bg-linear-to-r from-primary-light to-accent text-white rounded-full font-medium text-sm h-10 px-5 shadow-lg shadow-primary-light/10 hover:shadow-primary-light/20 transition-all">Sign Up</button></SignUpButton>
            </header>
          )} */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
