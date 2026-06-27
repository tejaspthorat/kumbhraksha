'use client';

import { useEffect } from 'react';
import { useGroqOrchestrator } from '@/lib/hooks/useGroqOrchestrator';

export default function OrchestratorClient() {
  useGroqOrchestrator();
  return null;
}
