import { useState, useEffect } from 'react';
import { loadSessionProgress, saveSessionProgress, saveImagesToDB } from '@/utils/indexedDB';

export const useSession = (sessionId, isClient) => {
  const [step, setStep] = useState(0);
  const [sessionMetadata, setSessionMetadata] = useState({
    createdAt: Date.now(),
    lastSaved: Date.now(),
    completedSteps: []
  });

  // Load session on mount
  useEffect(() => {
    if (!sessionId || !isClient) return;
    
    const loadSession = async () => {
      try {
        const savedData = await loadSessionProgress(sessionId);
        
        if (savedData.propertyBrief) {
          const isRecent = (Date.now() - savedData.propertyBrief.lastUpdated) < 24 * 60 * 60 * 1000;
          
          if (isRecent && savedData.propertyBrief) {
            return savedData;
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
      return null;
    };
    
    loadSession();
  }, [sessionId, isClient]);

  const saveSession = async (data) => {
    if (!sessionId || !isClient) return;
    
    try {
      await saveSessionProgress({
        sessionId,
        ...data,
        metadata: {
          lastEdited: Date.now(),
          ...data.metadata
        }
      });
      
      setSessionMetadata(prev => ({ ...prev, lastSaved: Date.now() }));
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return {
    step,
    setStep,
    sessionMetadata,
    saveSession
  };
};