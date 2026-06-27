'use client';

import { useState } from 'react';
import {
  useFloorPlanStore,
  USER_ROLES,
  USER_ROLE_COLORS,
  type UserRole,
  type FloorUser,
} from '@/lib/floorPlanStore';

interface UserPanelProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function UserPanel({ isOpen, onCloseAction }: UserPanelProps) {
  const { users, addUser, deleteUser, floors } = useFloorPlanStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Staff');
  const [newEmail, setNewEmail] = useState('');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim()) return;
    const user: FloorUser = {
      id: uid(),
      name: newName.trim(),
      role: newRole,
      email: newEmail.trim() || undefined,
      status: 'available',
    };
    addUser(user);
    setNewName('');
    setNewEmail('');
    setShowAdd(false);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        background: '#0a1520',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
          User Directory ({users.length})
        </span>
        <button
          onClick={onCloseAction}
          style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 16px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          style={{
            width: '100%',
            fontSize: 11,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: 'var(--foreground)',
            outline: 'none',
          }}
        />
      </div>

      {/* User List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {filtered.map((u) => {
          const roleColors = USER_ROLE_COLORS[u.role] ?? USER_ROLE_COLORS.Staff;
          const assignedFloor = floors.find((f) => f.id === u.assignedFloorId);
          const assignedRoom = assignedFloor?.rooms.find((r) => r.id === u.assignedRoomId);

          return (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: '0.5px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 500,
                  background: roleColors.bg,
                  color: roleColors.text,
                  flexShrink: 0,
                }}
              >
                {u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{u.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span
                    style={{
                      background: roleColors.bg,
                      color: roleColors.text,
                      padding: '0 4px',
                      borderRadius: 3,
                      fontSize: 8,
                      fontWeight: 500,
                    }}
                  >
                    {u.role}
                  </span>
                  {assignedRoom && (
                    <span>
                      → {assignedFloor?.name} / {assignedRoom.name}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    u.status === 'checked-in' ? '#639922' : u.status === 'assigned' ? '#EF9F27' : 'rgba(255,255,255,0.2)',
                }}
                title={u.status}
              />
              <button
                onClick={() => deleteUser(u.id)}
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add User */}
      <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        {showAdd ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              style={{
                fontSize: 11,
                padding: '5px 8px',
                background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: '5px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email (opt)"
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: '5px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  fontSize: 10,
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                style={{
                  fontSize: 10,
                  padding: '4px 12px',
                  background: '#0C447C',
                  border: '0.5px solid #378ADD',
                  borderRadius: 4,
                  color: '#B5D4F4',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Add User
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%',
              fontSize: 11,
              padding: '6px 0',
              background: 'rgba(55,138,221,0.1)',
              border: '0.5px solid rgba(55,138,221,0.2)',
              borderRadius: 6,
              color: '#378ADD',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + Add User
          </button>
        )}
      </div>
    </div>
  );
}
