import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language } from '@/lib/i18n';
import { TestMode, TestResult, EyeResult } from '@/lib/eyeTestData';

export type AppScreen = 'dashboard' | 'selectMode' | 'calibration' | 'eyeCover' | 'test' | 'results';

interface AppState {
  screen: AppScreen;
  language: Language;
  testMode: TestMode;
  currentEyeIndex: number;
  eyeResults: EyeResult[];
  testHistory: TestResult[];
  isTransitioning: boolean;
}

interface AppContextType extends AppState {
  setScreen: (screen: AppScreen) => void;
  setLanguage: (lang: Language) => void;
  setTestMode: (mode: TestMode) => void;
  setCurrentEyeIndex: (i: number) => void;
  addEyeResult: (result: EyeResult) => void;
  resetTest: () => void;
  saveTestResult: (result: TestResult) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('visioncheck-history');
    return {
      screen: 'dashboard',
      language: 'en',
      testMode: 'full',
      currentEyeIndex: 0,
      eyeResults: [],
      testHistory: saved ? JSON.parse(saved) : [],
      isTransitioning: false,
    };
  });

  const setScreen = useCallback((screen: AppScreen) => {
    setState(s => ({ ...s, isTransitioning: true }));
    setTimeout(() => {
      setState(s => ({ ...s, screen, isTransitioning: false }));
    }, 300);
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setState(s => ({ ...s, language }));
  }, []);

  const setTestMode = useCallback((testMode: TestMode) => {
    setState(s => ({ ...s, testMode }));
  }, []);

  const setCurrentEyeIndex = useCallback((currentEyeIndex: number) => {
    setState(s => ({ ...s, currentEyeIndex }));
  }, []);

  const addEyeResult = useCallback((result: EyeResult) => {
    setState(s => ({ ...s, eyeResults: [...s.eyeResults, result] }));
  }, []);

  const resetTest = useCallback(() => {
    setState(s => ({ ...s, currentEyeIndex: 0, eyeResults: [] }));
  }, []);

  const saveTestResult = useCallback((result: TestResult) => {
    setState(s => {
      const newHistory = [result, ...s.testHistory].slice(0, 20);
      localStorage.setItem('visioncheck-history', JSON.stringify(newHistory));
      return { ...s, testHistory: newHistory };
    });
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, setScreen, setLanguage, setTestMode,
      setCurrentEyeIndex, addEyeResult, resetTest, saveTestResult,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
