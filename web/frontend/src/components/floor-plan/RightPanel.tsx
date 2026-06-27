'use client';

import { useState } from 'react';
import {
  useFloorPlanStore,
  useSelectedRoom,
  useTotalMetrics,
  ROOM_TYPES,
  ROOM_TYPE_CONFIG,
  type RoomType,
} from '@/lib/floorPlanStore';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/Badge';
import { NumberInput } from '@/components/ui/number-input';
import { cn } from '@/lib/utils';
import { Minus, Plus, Trash2, UserPlus, AlertTriangle, Circle } from 'lucide-react';

export default function RightPanel() {
  const {
    updateRoom,
    deleteRoom,
    floors,
    assignUser,
    unassignUser,
    checkInUser,
    checkOutUser,
    setActiveFloor,
    selectElement,
    note,
    setNote,
    totalCapacity: globalCapacity,
    totalCheckedIn: globalCheckedIn,
    totalAlerts: globalAlerts,
    setGlobalMetrics,
  } = useFloorPlanStore();

  const { staff: globalStaff } = useStore();
  const selectedRoom = useSelectedRoom();
  const metrics = useTotalMetrics();
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // ─── Global Metrics (nothing selected) ─────────────────────────
  if (!selectedRoom) {
    const alertRooms = floors.flatMap(f => f.rooms.filter(r => {
      const config = ROOM_TYPE_CONFIG[r.type] ?? ROOM_TYPE_CONFIG['General Area'];
      const areaM2 = (r.width * r.height) / 10000;
      const roomCapacity = r.capacity || Math.floor(areaM2 * config.capacityMultiplier * 100);
      const occPct = roomCapacity > 0 ? (r.currentOccupancy / roomCapacity) * 100 : 0;
      return occPct >= r.alertThreshold;
    })).map(r => {
      const config = ROOM_TYPE_CONFIG[r.type] ?? ROOM_TYPE_CONFIG['General Area'];
      const areaM2 = (r.width * r.height) / 10000;
      const roomCapacity = r.capacity || Math.floor(areaM2 * config.capacityMultiplier * 100);
      return { 
        room: r, 
        pct: (r.currentOccupancy / roomCapacity) * 100, 
        floorName: floors.find(f => f.id === r.floorId)?.name 
      };
    });

    return (
      <div className="w-[200px] border-l border-white/10 bg-white/5 p-3 text-[11px] overflow-y-auto shrink-0 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Global Metrics</Label>
          
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/50">Total Area</span>
            <span className="font-medium text-foreground">{metrics.totalArea.toFixed(0)} m²</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/50">Total Capacity</span>
            <span className="font-medium text-foreground">{globalCapacity || metrics.totalCapacity}</span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/50">Total Checked In</span>
            <span className={`font-medium ${globalCheckedIn > 0 ? "text-[#639922]" : "text-foreground"}`}>
              {globalCheckedIn || metrics.totalCheckedIn}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/50">Active Alerts</span>
            <span className={`font-medium ${globalAlerts > 0 ? "text-[#E24B4A]" : "text-foreground"}`}>
              {globalAlerts || metrics.totalAlerts}
            </span>
          </div>

          {alertRooms.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {alertRooms.map((a, i) => (
                <div 
                  key={i} 
                  className="bg-red-500/10 border border-red-500/30 rounded-md p-2 cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => {
                    setActiveFloor(a.room.floorId);
                    selectElement(a.room.id, 'room');
                  }}
                >
                  <div className="text-[10px] font-semibold text-[#E24B4A] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {a.room.name}
                  </div>
                  <div className="text-[9px] text-white/60 mt-0.5">{a.floorName} · {Math.round(a.pct)}% full</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Floors</Label>
          {floors.map((f) => (
            <div key={f.id} className="flex justify-between items-center">
              <span className="text-white/50">{f.name}</span>
              <span className="font-medium text-foreground">{f.rooms.length} rooms</span>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col gap-2">
          <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Floor Plan Notes</Label>
          <Textarea
            value={note || ''}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add general notes..."
            className="text-[10px] bg-white/5 border-white/10 min-h-[80px] resize-none focus-visible:ring-accent/50"
          />
        </div>
      </div>
    );
  }

  // ─── Room Editor ───────────────────────────────────────────────
  const config = ROOM_TYPE_CONFIG[selectedRoom.type] ?? ROOM_TYPE_CONFIG['General Area'];
  const areaM2 = (selectedRoom.width * selectedRoom.height) / 10000;
  const roomCapacity = selectedRoom.capacity || Math.floor(areaM2 * config.capacityMultiplier * 100);
  const occPct = roomCapacity > 0 ? (selectedRoom.currentOccupancy / roomCapacity) * 100 : 0;
  const occColor = occPct > 85 ? '#E24B4A' : occPct > 60 ? '#EF9F27' : '#639922';

  const assignedStaff = globalStaff.filter((s) => 
    selectedRoom.assignedUserIds.includes(s.id.toString()) || 
    selectedRoom.assignedUserIds.includes(String(s.id))
  );
  
  const availableStaff = globalStaff.filter(
    (s) => !selectedRoom.assignedUserIds.includes(s.id.toString())
  );
  
  const filteredAvailable = availableStaff.filter((s) =>
    s.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="w-[200px] border-l border-white/10 bg-white/5 p-3 text-[11px] overflow-y-auto shrink-0 flex flex-col gap-4">
      {/* Room Header */}
      <div className="flex flex-col gap-3">
        <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Selected Room</Label>
        <div className="flex items-center gap-2 group">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: selectedRoom.color }} />
          <Input
            value={selectedRoom.name}
            onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
            className="h-7 bg-transparent border-none p-0 focus-visible:ring-0 text-xs font-semibold"
          />
          {occPct >= selectedRoom.alertThreshold && (
            <Badge variant="danger" className="px-1.5 py-0 text-[8px] font-bold h-4 shrink-0">
              ⚠ {Math.round(occPct)}%
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/50">Type</span>
          <select
            value={selectedRoom.type}
            onChange={(e) => {
              const newType = e.target.value as RoomType;
              const newConfig = ROOM_TYPE_CONFIG[newType];
              updateRoom(selectedRoom.id, {
                type: newType,
                color: newConfig.defaultColor,
              });
            }}
            className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 outline-none focus:border-accent/50"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#050d14]">
                {ROOM_TYPE_CONFIG[t].icon} {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/50">Area</span>
          <span className="font-medium text-foreground">{(areaM2 * 100).toFixed(0)} m²</span>
        </div>

        <NumberInput 
          label="Capacity"
          value={selectedRoom.capacity}
          onChange={(val) => updateRoom(selectedRoom.id, { capacity: val })}
        />

        <NumberInput 
          label="Checked in"
          value={selectedRoom.currentOccupancy}
          onChange={(val) => updateRoom(selectedRoom.id, { currentOccupancy: val })}
          className={occPct > 85 ? "text-red-500" : occPct > 60 ? "text-orange-400" : "text-green-500"}
        />

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-white/50">Alert at</span>
            <span className="font-medium">{selectedRoom.alertThreshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            value={selectedRoom.alertThreshold}
            onChange={(e) => updateRoom(selectedRoom.id, { alertThreshold: Number(e.target.value) })}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Occupancy bar */}
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.min(100, occPct)}%`,
              background: occColor,
            }}
          />
        </div>

        <div className="flex justify-between items-center mt-1">
          <span className="text-white/50">Color</span>
          <Input
            type="color"
            value={selectedRoom.color}
            onChange={(e) => updateRoom(selectedRoom.id, { color: e.target.value })}
            className="w-8 h-5 p-0 border-none bg-transparent cursor-pointer"
          />
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Assigned Staff */}
      <div className="flex flex-col gap-2">
        <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Assigned Staff</Label>
        <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
          {assignedStaff.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0 group"
            >
              <div className="relative shrink-0">
                <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[8px] font-bold">
                  {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#050d14]",
                  s.status === 'active' ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" : 
                  s.status === 'break' ? "bg-yellow-500" : "bg-white/20"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-foreground truncate">{s.name}</div>
                <div className="text-[8px] text-white/40">{s.role}</div>
              </div>
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => unassignUser(String(s.id))}
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 text-white/20 hover:text-red-400 hover:bg-red-400/10 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Assign user picker */}
        {showUserPicker ? (
          <div className="mt-2 flex flex-col gap-2 bg-white/5 p-2 rounded-md border border-white/10">
            <Input
              autoFocus
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search..."
              className="h-6 text-[10px] bg-black/20"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowUserPicker(false);
                  setUserSearch('');
                }
              }}
            />
            <div className="max-h-[80px] overflow-y-auto flex flex-col gap-1 scrollbar-thin">
              {filteredAvailable.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    assignUser(String(s.id), selectedRoom.id, selectedRoom.floorId);
                    setShowUserPicker(false);
                    setUserSearch('');
                  }}
                  className="text-[10px] p-1.5 hover:bg-white/10 cursor-pointer rounded transition-colors text-white/60 hover:text-white flex items-center gap-2"
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    s.status === 'active' ? "bg-green-500" : 
                    s.status === 'break' ? "bg-yellow-500" : "bg-white/20"
                  )} />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-[8px] opacity-60">{s.role}</span>
                </div>
              ))}
              {filteredAvailable.length === 0 && (
                <div className="text-[9px] text-white/30 p-1 text-center italic">No results</div>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowUserPicker(true)}
            variant="outline"
            className="mt-1 h-7 border-dashed border-white/10 bg-transparent text-accent hover:bg-accent/10 text-[10px]"
          >
            <UserPlus className="mr-2 h-3 w-3" /> Assign Staff
          </Button>
        )}
      </div>

      <Separator className="bg-white/10" />

      {/* Notes */}
      <div className="flex flex-col gap-2 text-[11px]">
        <Label className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Room Notes</Label>
        <Textarea
          value={selectedRoom.notes ?? ''}
          onChange={(e) => updateRoom(selectedRoom.id, { notes: e.target.value })}
          placeholder="Add room notes..."
          className="text-[10px] bg-white/5 border-white/10 min-h-[60px] resize-none focus-visible:ring-accent/50"
        />
      </div>

      <Separator className="bg-white/10" />

      {/* Delete Room */}
      <Button
        onClick={() => deleteRoom(selectedRoom.id)}
        variant="destructive"
        className="w-full h-8 text-[11px] font-semibold bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
      >
        <Trash2 className="h-3.5 w-3.5 group-hover:animate-pulse" /> Delete Room
      </Button>
    </div>
  );
}
