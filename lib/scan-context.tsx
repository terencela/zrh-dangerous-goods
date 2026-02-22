import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { ItemCategory, Verdict } from '@/constants/rules';

export interface AiAnalysis {
  identified: boolean;
  itemName?: string;
  categoryId?: string;
  confidence?: 'high' | 'medium' | 'low';
  detectedProperties?: {
    mah?: number | null;
    voltage?: number | null;
    wh?: number | null;
    volume_ml?: number | null;
    blade_length_cm?: number | null;
  };
  verdict?: {
    handBaggage: { status: string; text: string; tip?: string };
    checkedBaggage: { status: string; text: string; tip?: string };
  };
  summary?: string;
}

interface ScanSession {
  photoUri: string | null;
  category: ItemCategory | null;
  answers: Record<string, string>;
  verdict: Verdict | null;
  aiAnalysis: AiAnalysis | null;
}

interface ScanContextValue {
  session: ScanSession;
  setPhotoUri: (uri: string | null) => void;
  setCategory: (cat: ItemCategory | null) => void;
  setAnswer: (questionId: string, value: string) => void;
  setVerdict: (v: Verdict | null) => void;
  setAiAnalysis: (a: AiAnalysis | null) => void;
  resetSession: () => void;
}

const initialSession: ScanSession = {
  photoUri: null,
  category: null,
  answers: {},
  verdict: null,
  aiAnalysis: null,
};

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ScanSession>(initialSession);

  const setPhotoUri = useCallback((uri: string | null) => {
    setSession(prev => ({ ...prev, photoUri: uri }));
  }, []);

  const setCategory = useCallback((cat: ItemCategory | null) => {
    setSession(prev => ({ ...prev, category: cat, answers: {}, verdict: null }));
  }, []);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setSession(prev => ({ ...prev, answers: { ...prev.answers, [questionId]: value } }));
  }, []);

  const setVerdict = useCallback((v: Verdict | null) => {
    setSession(prev => ({ ...prev, verdict: v }));
  }, []);

  const setAiAnalysis = useCallback((a: AiAnalysis | null) => {
    setSession(prev => ({ ...prev, aiAnalysis: a }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(initialSession);
  }, []);

  const value = useMemo(() => ({
    session,
    setPhotoUri,
    setCategory,
    setAnswer,
    setVerdict,
    setAiAnalysis,
    resetSession,
  }), [session, setPhotoUri, setCategory, setAnswer, setVerdict, setAiAnalysis, resetSession]);

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within ScanProvider');
  return ctx;
}
