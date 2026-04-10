import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  lang?: string;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(options.onResult);
  const isStoppedRef = useRef(false);

  onResultRef.current = options.onResult;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Synchronous start — must be called directly from a user gesture (click)
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }

    cleanup();
    isStoppedRef.current = false;
    setError(null);

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = options.lang || 'en-US';

    recognition.onresult = (event: any) => {
      const results = event.results;
      if (!results.length) return;

      const lastResult = results[results.length - 1];
      if (lastResult.isFinal) {
        let best = '';
        for (let i = 0; i < lastResult.length; i++) {
          const cleaned = normalizeSpokenLetters(lastResult[i].transcript.trim().toUpperCase());
          if (cleaned.length > best.length || !best) best = cleaned;
        }
        if (best && onResultRef.current) {
          onResultRef.current(best);
        }
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === 'aborted') return;
      if (err === 'no-speech') {
        setIsListening(false);
        return;
      }

      const msgs: Record<string, string> = {
        'network': 'Voice service unavailable. Check your connection or type instead.',
        'not-allowed': 'Microphone denied. Enable it in browser settings.',
        'service-not-allowed': 'Speech service unavailable. Type your answer instead.',
        'audio-capture': 'No microphone detected.',
      };
      setError(msgs[err] || 'Voice input failed. Type your answer instead.');
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!isStoppedRef.current && recognitionRef.current) {
        // Don't auto-restart — just mark done
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Microphone permission denied.');
      } else {
        setError('Could not start voice input. Type instead.');
      }
      setIsListening(false);
    }
  }, [options.lang, cleanup]);

  const stopListening = useCallback(() => {
    isStoppedRef.current = true;
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  const clearError = useCallback(() => setError(null), []);

  return { isListening, isSupported, error, startListening, stopListening, clearError };
}

function normalizeSpokenLetters(input: string): string {
  const phoneticMap: Record<string, string> = {
    'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D',
    'ECHO': 'E', 'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H',
    'INDIA': 'I', 'JULIET': 'J', 'KILO': 'K', 'LIMA': 'L',
    'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O', 'PAPA': 'P',
    'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
    'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X',
    'YANKEE': 'Y', 'ZULU': 'Z',
    'AYE': 'A', 'BEE': 'B', 'SEE': 'C', 'DEE': 'D', 'EEE': 'E',
    'EFF': 'F', 'GEE': 'G', 'AITCH': 'H', 'EYE': 'I', 'JAY': 'J',
    'KAY': 'K', 'ELL': 'L', 'EM': 'M', 'EN': 'N', 'OH': 'O',
    'PEE': 'P', 'CUE': 'Q', 'ARE': 'R', 'ESS': 'S', 'TEE': 'T',
    'YOU': 'U', 'VEE': 'V', 'DOUBLE': 'W', 'EX': 'X', 'WHY': 'Y',
    'ZEE': 'Z', 'ZED': 'Z',
  };

  const words = input.replace(/[^A-Z\s]/g, '').split(/\s+/).filter(Boolean);
  let result = '';

  for (const word of words) {
    if (word.length === 1 && /[A-Z]/.test(word)) {
      result += word;
    } else if (phoneticMap[word]) {
      result += phoneticMap[word];
    }
  }

  if (!result) result = input.replace(/[^A-Z]/g, '');
  return result;
}
