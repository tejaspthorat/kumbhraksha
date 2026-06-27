'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { SignOutButton, useUser, useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function NotAllowed() {
  const { user } = useUser();
  const { signOut } = useClerk();

  // Auto-logout staff as per dashboard security requirement
  useEffect(() => {
    if (user) {
      // Small timeout to allow the user to see their email before it disappears
      const timer = setTimeout(() => {
        signOut({ redirectUrl: '/not-allowed' }); // Sign out on client too
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-light/10 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <div className="backdrop-blur-xl bg-white/2 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
          
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-inner">
              <ShieldAlert size={40} className="text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">
            Your current role does not have administrative privileges for this dashboard.
          </p>

          {user && (
            <div className="flex items-center gap-3 bg-white/2 px-4 py-3 rounded-2xl border border-white/5 mb-10 max-w-xs mx-auto">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-light to-accent flex items-center justify-center text-white font-bold text-sm">
                {user.firstName?.charAt(0) || user.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs text-white/20 font-medium uppercase tracking-wider">Authenticated As</p>
                <p className="text-sm text-white/80 font-medium truncate">{user.emailAddresses[0].emailAddress}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <SignOutButton signOutOptions={{ redirectUrl: '/login' }}>
              <button className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 w-full">
                <LogOut size={18} />
                Sign Out and Switch Account
              </button>
            </SignOutButton>
            
            <p className="text-xs text-white/20 mt-4">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none opacity-10 -z-20" />
    </div>
  );
}
