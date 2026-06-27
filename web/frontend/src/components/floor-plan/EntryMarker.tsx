'use client';

import { motion } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import type { FloorEntryPoint } from '@/lib/floorPlanStore';

interface EntryMarkerProps {
  point: FloorEntryPoint;
}

export default function EntryMarker({ point }: EntryMarkerProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{
        position: 'absolute',
        left: point.x - 7,
        top: point.y - 7,
        width: 14,
        height: 14,
        background: '#27500A',
        border: '1.5px solid #639922',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15,
        cursor: 'pointer',
      }}
      title={point.label ?? 'Entry Point'}
    >
      <DoorOpen size={8} color="#9FE1CB" />
    </motion.div>
  );
}
