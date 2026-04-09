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
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  onResultRef.current = options.onResult;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
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

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Check microphone permission proactively
    try {
      if (navigator.permissions) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'denied') {
          setError('Microphone access denied. Please enable it in browser settings.');
          return;
        }
      }
    } catch {
      // Safari doesn't support microphone permission query — continue anyway
    }

    // Request microphone access first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately — we just need the permission grant
      stream.getTracks().forEach(track => track.stop());
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else if (err.name === 'NotReadableError') {
        setError('Microphone is in use by another application.');
      } else {
        setError('Could not access microphone. Please try again.');
      }
      return;
    }

    // Clean up any existing instance
    cleanup();
    retryCountRef.current = 0;
    setError(null);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.lang = options.lang || 'en-US';

      recognition.onresult = (event: any) => {
        const results = event.results;
        if (results.length > 0) {
          let bestTranscript = '';
          for (let i = 0; i < results[0].length; i++) {
            const transcript = results[0][i].transcript.trim().toUpperCase();
            const cleaned = normalizeSpokenLetters(transcript);
            if (cleaned.length > bestTranscript.length || bestTranscript === '') {
              bestTranscript = cleaned;
            }
          }
          if (bestTranscript && onResultRef.current) {
            onResultRef.current(bestTranscript);
          }
        }
        retryCountRef.current = 0;
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error;

        // Silent/expected errors — don't show to user
        if (errorType === 'aborted' || errorType === 'no-speech') {
          setIsListening(false);
          return;
        }

        // Network error — retry silently up to maxRetries
        if (errorType === 'network' && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          // Small delay before retry
          setTimeout(() => {
            try {
              cleanup();
              // Re-create and start fresh — must be done carefully
              const retryRecognition = new SpeechRecognition();
              retryRecognition.continuous = false;
              retryRecognition.interimResults = false;
              retryRecognition.maxAlternatives = 3;
              retryRecognition.lang = options.lang || 'en-US';
              retryRecognition.onresult = recognition.onresult;
              retryRecognition.onerror = recognition.onerror;
              retryRecognition.onend = recognition.onend;
              recognitionRef.current = retryRecognition;
              retryRecognition.start();
            } catch {
              setError('Voice input unavailable. Please type your answer instead.');
              setIsListening(false);
            }
          }, 500);
          return;
        }

        // Map errors to friendly messages
        const errorMessages: Record<string, string> = {
          'network': 'Voice service unavailable. Please check your internet connection or type your answer.',
          'not-allowed': 'Microphone access denied. Please enable it in browser settings.',
          'service-not-allowed': 'Speech service not available. Please type your answer instead.',
          'audio-capture': 'No microphone detected. Please connect one and try again.',
          'language-not-supported': 'Language not supported for voice input. Please type instead.',
        };

        setError(errorMessages[errorType] || 'Voice input failed. Please type your answer instead.');
        setIsListening(false);
      };

      recognition.onend = () => {
        // Only set listening false if we're not in a retry cycle
        if (retryCountRef.current === 0 || retryCountRef.current >= maxRetries) {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow access and try again.');
      } else {
        setError('Could not start voice input. Please type your answer instead.');
      }
      setIsListening(false);
    }
  }, [options.lang, cleanup]);

  const stopListening = useCallback(() => {
    retryCountRef.current = maxRetries; // Prevent retries
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      retryCountRef.current = maxRetries;
      cleanup();
    };
  }, [cleanup]);

  const clearError = useCallback(() => setError(null), []);

  return { isListening, isSupported, error, startListening, stopListening, clearError };
}

/**
 * Normalize spoken words to Snellen chart letters.
 */
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

  if (!result) {
    result = input.replace(/[^A-Z]/g, '');
  }

  return result;
}
