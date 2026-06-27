"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary-light/15 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[180px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-light to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(122,178,178,0.2)]">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CrowdAI Login</h1>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full mx-auto shadow-2xl",
              card: "bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-none",
              headerTitle: "text-white",
              headerSubtitle: "text-white/40",
              socialButtonsBlockButton: "bg-white/[0.04] border border-white/[0.1] text-white hover:bg-white/[0.1]",
              formButtonPrimary: "bg-gradient-to-r from-primary-light to-accent text-white border-0 shadow-lg shadow-primary-light/10",
              footerActionLink: "text-accent/70 hover:text-accent font-medium",
              formFieldLabel: "text-white/60",
              formFieldInput: "bg-white/[0.04] border border-white/[0.1] text-white",
              dividerLine: "bg-white/[0.1]",
              dividerText: "text-white/20",
              identityPreviewText: "text-white",
              userButtonPopoverActionButtonText: "text-white",
            },
          }}
          routing="path"
          path="/login"
          fallbackRedirectUrl="/dashboard"
          signUpUrl="/register"
        />
      </motion.div>
    </div>
  );
}
