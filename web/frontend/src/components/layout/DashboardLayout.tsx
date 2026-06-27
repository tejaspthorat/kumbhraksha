"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useStore } from "@/lib/store";
import ChatLoader from "./ChatLoader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fetchDashboardData, ready } = useStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar />
      <div className="lg:ml-[260px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Chat panel overlay */}
      <ChatLoader />
    </div>
  );
}
