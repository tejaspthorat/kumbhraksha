import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  /** Sidebar collapsed to icon-rail on desktop. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  /** Emergency / crisis mode — tints chrome red and surfaces the broadcast bar. */
  emergencyMode: boolean;
  toggleEmergency: () => void;
  setEmergency: (v: boolean) => void;

  /** Floating AI assistant panel. */
  assistantOpen: boolean;
  toggleAssistant: () => void;
  setAssistant: (v: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      emergencyMode: false,
      toggleEmergency: () => set((s) => ({ emergencyMode: !s.emergencyMode })),
      setEmergency: (v) => set({ emergencyMode: v }),

      assistantOpen: false,
      toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
      setAssistant: (v) => set({ assistantOpen: v }),
    }),
    { name: 'kr-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
