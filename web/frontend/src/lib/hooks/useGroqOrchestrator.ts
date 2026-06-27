import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { fetchDensityData } from '@/lib/api';

const CACHE_KEY = 'groq_ai_cache';
const RATE_LIMIT_MS = 120000; // 2 minute between actual Groq API calls

export function useGroqOrchestrator() {
  const setGroqLoading = useStore(s => s.setGroqLoading);
  const setGroqError = useStore(s => s.setGroqError);
  const setPredictions = useStore(s => s.setPredictions);
  const setSuggestions = useStore(s => s.setSuggestions);
  const setDecisions = useStore(s => s.setDecisions);
  const setDensityData = useStore(s => s.setDensityData);
  
  const isFetchingRef = useRef(false);

  const runPipeline = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current) return;
    
    // 1. Check Rate Limit & Local Cache First
    const lastRunStr = localStorage.getItem(`${CACHE_KEY}_time`);
    const lastRunTime = lastRunStr ? parseInt(lastRunStr, 10) : 0;
    const timeSinceLastRun = Date.now() - lastRunTime;

    // Rate limiting constraint: block Groq API hits if under 1 minute to stay inside free tier
    if (forceRefresh && timeSinceLastRun < RATE_LIMIT_MS) {
      console.log('Rate limit active, waiting before next Groq call.');
      setGroqError('Rate limit: Please wait a minute before refreshing again.');
      setTimeout(() => setGroqError(null), 3000);
      return;
    }

    // If not forced (i.e., just page reload), reliably restore from cache
    if (!forceRefresh) {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        try {
          const cachedData = JSON.parse(cachedStr);
          if (cachedData && cachedData.decisions && cachedData.decisions.length > 0) {
            // Restore from cache directly to avoiding useless Groq API hits
            setDensityData(cachedData.densityData || []);
            setPredictions(cachedData.predictions || []);
            setSuggestions(cachedData.suggestions || []);
            setDecisions(cachedData.decisions || []);
            useStore.setState({ lastGroqRun: new Date(lastRunTime) });
            return; // Exit early, no API call needed!
          }
        } catch (e) {
          console.warn('Failed to parse Groq local cache', e);
        }
      }
    }

    // Process actual API call
    isFetchingRef.current = true;
    setGroqLoading(true);
    setGroqError(null);

    try {
      const densityData = await fetchDensityData();
      
      if (!densityData || densityData.length === 0) {
        throw new Error('No density data available to feed Groq.');
      }

      // 2. Generate Predictions
      const predRes = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'predictions', payload: densityData })
      });
      if (!predRes.ok) throw new Error(await predRes.text() || 'Predictions failed');
      const { predictions } = await predRes.json();
      setPredictions(predictions);

      // 3. Generate Suggestions
      const suggRes = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'suggestions', 
          payload: { densityData, predictions }
        })
      });
      if (!suggRes.ok) throw new Error(await suggRes.text() || 'Suggestions failed');
      const { suggestions } = await suggRes.json();
      setSuggestions(suggestions);

      // 4. Generate Decisions
      const decRes = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'decisions', 
          payload: { suggestions, densityData }
        })
      });
      if (!decRes.ok) throw new Error(await decRes.text() || 'Decisions failed');
      const { decisions } = await decRes.json();
      setDecisions(decisions);

      // Record last run & update LocalStorage cache
      const now = Date.now();
      useStore.setState({ lastGroqRun: new Date(now) });
      localStorage.setItem(`${CACHE_KEY}_time`, now.toString());
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        densityData,
        predictions,
        suggestions,
        decisions
      }));

    } catch (err: any) {
      console.error('Groq Orchestrator Pipeline Error:', err);
      // Determine if error is groq timeout or rate limit related
      const errMsg = err.message || 'Error occurred during AI processing';
      setGroqError(errMsg.includes('429') ? 'Groq Rate Limit exceeded! Please wait.' : errMsg);
    } finally {
      setGroqLoading(false);
      isFetchingRef.current = false;
    }
  }, [setGroqLoading, setGroqError, setPredictions, setSuggestions, setDecisions, setDensityData]);

  useEffect(() => {
    // Bind the refresh action into the store for manual "Refresh Insights" button
    useStore.setState({ refreshGroqInsights: () => runPipeline(true) });

    // Initial run on mount automatically fetches cache or API if no cache exists
    runPipeline(false);

    // Removed the setInterval polling per user request to limit GROQ API usage 
    // and rely strictly on manual "Refresh Insights" trigger with rate limiting.

    return () => {
      useStore.setState({ refreshGroqInsights: () => {} });
    };
  }, [runPipeline]);

  return { runPipeline };
}
