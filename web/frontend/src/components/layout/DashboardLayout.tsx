"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Siren, X } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AIAssistant from "./AIAssistant";
import { useStore } from "@/lib/store";
import { useUiStore } from "@/lib/uiStore";
import ChatLoader from "./ChatLoader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchDashboardData } = useStore();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const emergency = useUiStore((s) => s.emergencyMode);
  const setEmergency = useUiStore((s) => s.setEmergency);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className={clsx("min-h-screen bg-canvas text-ink", emergency && "ring-2 ring-inset ring-accent-red/40")}>
      <Sidebar />
      <div className={clsx("flex flex-col min-h-screen transition-[margin] duration-300", collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")}>
        <TopBar />

        {/* Emergency broadcast bar */}
        <AnimatePresence>
          {emergency && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-accent-red/30 bg-accent-red/10"
            >
              <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-2.5">
                <div className="flex items-center gap-2.5 text-accent-red min-w-0">
                  <Siren size={16} className="shrink-0 animate-[pulse-soft_1.2s_ease-in-out_infinite]" />
                  <p className="text-[13px] font-medium truncate">
                    Emergency mode active — all responder units on heightened alert. Broadcast channel open.
                  </p>
                </div>
                <button
                  onClick={() => setEmergency(false)}
                  className="grid place-items-center size-7 rounded-md text-accent-red hover:bg-accent-red/15 transition-colors shrink-0"
                  aria-label="Dismiss emergency banner"
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>

      {/* Overlays */}
      <ChatLoader />
      <AIAssistant />
    </div>
  );
}
