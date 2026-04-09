import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language } from '@/lib/i18n';
import { TestMode, TestResult, EyeResult } from '@/lib/eyeTestData';

export type AppScreen = 'dashboard' | 'patientDetails' | 'selectMode' | 'calibration' | 'eyeCover' | 'test' | 'results';

export interface PatientDetails {
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | '';
  hasGlasses: boolean;
  hasDiabetes: boolean;
  hasHypertension: boolean;
  familyHistoryEyeDisease: boolean;
  screenTimeHours: number | null;
  lastEyeExam: 'less_than_1_year' | '1_to_2_years' | 'more_than_2_years' | 'never' | '';
}

export const defaultPatientDetails: PatientDetails = {
  name: '',
  age: null,
  gender: '',
  hasGlasses: false,
  hasDiabetes: false,
  hasHypertension: false,
  familyHistoryEyeDisease: false,
  screenTimeHours: null,
  lastEyeExam: '',
};

interface AppState {
  screen: AppScreen;
  language: Language;
  testMode: TestMode;
  currentEyeIndex: number;
  eyeResults: EyeResult[];
  testHistory: TestResult[];
  isTransitioning: boolean;
  patientDetails: PatientDetails;
}

interface AppContextType extends AppState {
  setScreen: (screen: AppScreen) => void;
  setLanguage: (lang: Language) => void;
  setTestMode: (mode: TestMode) => void;
  setCurrentEyeIndex: (i: number) => void;
  addEyeResult: (result: EyeResult) => void;
  resetTest: () => void;
  saveTestResult: (result: TestResult) => void;
  setPatientDetails: (details: PatientDetails) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('visioncheck-history');
    const savedPatient = localStorage.getItem('visioncheck-patient');
    return {
      screen: 'dashboard',
      language: 'en',
      testMode: 'full',
      currentEyeIndex: 0,
      eyeResults: [],
      testHistory: saved ? JSON.parse(saved) : [],
      isTransitioning: false,
      patientDetails: savedPatient ? JSON.parse(savedPatient) : defaultPatientDetails,
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

  const setPatientDetails = useCallback((details: PatientDetails) => {
    localStorage.setItem('visioncheck-patient', JSON.stringify(details));
    setState(s => ({ ...s, patientDetails: details }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state, setScreen, setLanguage, setTestMode,
      setCurrentEyeIndex, addEyeResult, resetTest, saveTestResult,
      setPatientDetails,
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
