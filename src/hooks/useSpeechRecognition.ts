import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  continuous?: boolean;
  lang?: string;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(options.onResult);
  onResultRef.current = options.onResult;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      // Stop any existing instance
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.lang = options.lang || 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        if (results.length > 0) {
          // Try all alternatives to find the best letter match
          let bestTranscript = '';
          for (let i = 0; i < results[0].length; i++) {
            const transcript = results[0][i].transcript.trim().toUpperCase();
            // Clean: extract only letters, handle spoken letter names
            const cleaned = normalizeSpokenLetters(transcript);
            if (cleaned.length > bestTranscript.length || bestTranscript === '') {
              bestTranscript = cleaned;
            }
          }
          if (bestTranscript && onResultRef.current) {
            onResultRef.current(bestTranscript);
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        // Don't treat 'no-speech' or 'aborted' as errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          setIsListening(false);
          return;
        }
        setError(`Speech error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  }, [options.lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  return { isListening, isSupported, error, startListening, stopListening };
}

/**
 * Normalize spoken words to Snellen chart letters.
 * Handles cases like "E as in echo" → "E", "bee" → "B", etc.
 */
function normalizeSpokenLetters(input: string): string {
  // Map of common spoken representations to letters
  const phoneticMap: Record<string, string> = {
    'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D',
    'ECHO': 'E', 'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H',
    'INDIA': 'I', 'JULIET': 'J', 'KILO': 'K', 'LIMA': 'L',
    'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O', 'PAPA': 'P',
    'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
    'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X',
    'YANKEE': 'Y', 'ZULU': 'Z',
    // Common misheard
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
    // Skip unrecognized words
  }

  // If nothing matched from words, try extracting single letters from the raw input
  if (!result) {
    result = input.replace(/[^A-Z]/g, '');
  }

  return result;
}
