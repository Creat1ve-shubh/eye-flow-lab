import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { generateSnellenChart, getTestSequence, getAcuityFromRow, EyeType } from '@/lib/eyeTestData';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function EyeTest() {
  const { language, setScreen, testMode, currentEyeIndex, setCurrentEyeIndex, addEyeResult } = useApp();
  const sequence = getTestSequence(testMode);
  const currentEye: EyeType = sequence[currentEyeIndex];

  const chart = useMemo(() => generateSnellenChart(), [currentEyeIndex]);
  const [currentRow, setCurrentRow] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctRows, setCorrectRows] = useState<number[]>([]);
  const [lastCorrectRow, setLastCorrectRow] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentRow]);

  const row = chart[currentRow];
  const totalRows = chart.length;
  const progress = ((currentRow) / totalRows) * 100;

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    const isCorrect = userInput.toUpperCase().replace(/\s/g, '') === row.letters;

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectRows(prev => [...prev, row.row]);
      setLastCorrectRow(row.row);
    }

    setTimeout(() => {
      setFeedback(null);
      setUserInput('');
      advance();
    }, 800);
  };

  const advance = () => {
    if (currentRow + 1 < totalRows) {
      setCurrentRow(currentRow + 1);
    } else {
      finishEyeTest();
    }
  };

  const finishEyeTest = () => {
    const finalLastCorrect = correctRows.length > 0 ? Math.max(...correctRows, lastCorrectRow) : lastCorrectRow;
    addEyeResult({
      eye: currentEye,
      lastCorrectRow: finalLastCorrect,
      acuity: getAcuityFromRow(finalLastCorrect),
      correctRows: [...correctRows],
    });

    if (currentEyeIndex + 1 < sequence.length) {
      setCurrentEyeIndex(currentEyeIndex + 1);
      setScreen('eyeCover');
    } else {
      setScreen('results');
    }
  };

  const handleSkip = () => {
    setUserInput('');
    setFeedback(null);
    advance();
  };

  const eyeLabel = currentEye === 'left' ? t('results.leftEye', language)
    : currentEye === 'right' ? t('results.rightEye', language) : t('results.bothEyes', language);

  return (
    <div className="min-h-screen bg-background flex flex-col page-enter">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{eyeLabel}</span>
          <span className="text-sm text-muted-foreground">
            {t('test.row', language)} {currentRow + 1} {t('test.of', language)} {totalRows}
          </span>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-full bg-foreground transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Chart area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Acuity label */}
        <p className="text-xs text-muted-foreground mb-4 font-mono animate-fade-in">
          {row.acuity}
        </p>

        {/* Letters */}
        <div className="mb-8 relative">
          <div
            className="snellen-letter text-foreground text-center animate-letter-reveal"
            key={`${currentEyeIndex}-${currentRow}`}
            style={{ fontSize: `${row.size}px`, lineHeight: 1.2 }}
          >
            {row.letters.split('').map((letter, i) => (
              <span
                key={i}
                className="inline-block animate-letter-reveal"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Feedback overlay */}
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
              {feedback === 'correct' ? (
                <CheckCircle className="w-16 h-16 text-foreground opacity-30" />
              ) : (
                <XCircle className="w-16 h-16 text-foreground opacity-30" />
              )}
            </div>
          )}
        </div>

        {/* Feedback text */}
        {feedback && (
          <p className={`text-sm mb-4 animate-fade-in ${feedback === 'correct' ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {feedback === 'correct' ? t('test.correct', language) : t('test.incorrect', language)}
          </p>
        )}

        {/* Input */}
        <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <p className="text-sm text-muted-foreground text-center mb-3">
            {t('test.instruction', language)}
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="flex-1 h-12 px-4 rounded-full border border-border bg-background text-foreground text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="..."
              disabled={feedback !== null}
              autoComplete="off"
            />
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim() || feedback !== null}
              className="h-12 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('test.submit', language)}
            </Button>
          </div>
          <button
            onClick={handleSkip}
            disabled={feedback !== null}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto block"
          >
            {t('test.skip', language)}
          </button>
        </div>
      </main>
    </div>
  );
}
