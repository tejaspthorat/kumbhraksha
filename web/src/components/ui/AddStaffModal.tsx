'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Shield, MapPin, AlertCircle, Smile } from 'lucide-react';
import GlassCard from './GlassCard';
import { createStaff, updateStaff } from '@/app/actions/staff';
import { useStore } from '@/lib/store';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

const AVATARS = ['👮', '👷', '👨‍⚕️', '👩‍⚕️', '💂', '🕵️', '👨‍🏫', '👩‍🏫'];
const ROLES = ['Security', 'Medical', 'Support', 'Maintenance', 'Coordinator'];
const STAFF_ROLES = ['COORDINATOR', 'SECURITY', 'MEDICAL', 'TECHNICIAN', 'VOLUNTEER'];

export default function AddStaffModal({ isOpen, onClose, editData }: AddStaffModalProps) {
  const { zones } = useStore();
  const [name, setName] = useState(editData?.name || '');
  const [email, setEmail] = useState(editData?.email || '');
  const [role, setRole] = useState(editData?.role || ROLES[0]);
  const [staffRole, setStaffRole] = useState(editData?.staffRole || STAFF_ROLES[0]);
  const [zoneId, setZoneId] = useState<string>(editData?.zoneId?.toString() || (zones[0]?.id?.toString() || ''));
  const [avatar, setAvatar] = useState(editData?.avatar || AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedZoneId = parseInt(zoneId);
    if (isNaN(parsedZoneId)) {
      setError('Please select a valid zone. Add a zone first if none exist.');
      setLoading(false);
      return;
    }

    try {
      if (editData) {
        await updateStaff(editData.id, {
          name,
          email,
          role,
          staffRole,
          zoneId: parsedZoneId,
          avatar,
        });
      } else {
        await createStaff({
          name,
          email,
          role,
          staffRole,
          zoneId: parsedZoneId,
          avatar,
        });
      }
      onClose();
      // Reset if adding new
      if (!editData) {
        setName('');
        setEmail('');
        setRole(ROLES[0]);
        setAvatar(AVATARS[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{editData ? 'Edit Staff' : 'Add Staff Member'}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors"
                      required
                    />
                    <UserPlus size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors"
                      required
                      disabled={!!editData}
                    />
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Internal Role</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent transition-colors appearance-none"
                      >
                        {ROLES.map(r => <option key={r} value={r} className="bg-[#1a2b3c]">{r}</option>)}
                      </select>
                      <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Staff Category</label>
                    <div className="relative">
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent transition-colors appearance-none"
                      >
                        {STAFF_ROLES.map(r => <option key={r} value={r} className="bg-[#1a2b3c]">{r}</option>)}
                      </select>
                      <AlertCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Assigned Zone</label>
                  <div className="relative">
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent transition-colors appearance-none"
                    >
                      {zones.map(z => <option key={z.id} value={z.id} className="bg-[#1a2b3c]">{z.name}</option>)}
                    </select>
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Select Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAvatar(a)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                          avatar === a ? 'bg-accent border-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'
                        } border`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-linear-to-r from-accent to-accent-light text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : editData ? 'Update Staff Member' : 'Create Staff Member'}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
