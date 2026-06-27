import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export type RealtimeStatus = 'connected' | 'reconnecting' | 'disconnected';

export function useRealtimeSync(tableName: string) {
  const patchTable = useStore(state => state.patchTable);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          patchTable(tableName, payload as any);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, patchTable]);

  return { status };
}
