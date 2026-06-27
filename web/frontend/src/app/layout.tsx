import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "KumbhRaksha — Turn every phone into a search network",
  description:
    "A living missing-persons network for mass gatherings. Citizens report and search; authorities coordinate the response in real time — no hardware required.",
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
        <body className="min-h-full flex flex-col bg-canvas text-ink font-sans" suppressHydrationWarning>
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
