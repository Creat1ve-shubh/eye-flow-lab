import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { getTestSequence, EyeType } from '@/lib/eyeTestData';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EyeCover() {
  const { language, setScreen, testMode, currentEyeIndex } = useApp();
  const sequence = getTestSequence(testMode);
  const currentEye: EyeType = sequence[currentEyeIndex];
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentEyeIndex]);

  const eyeTitleKey = currentEye === 'left' ? 'eyecover.leftEye'
    : currentEye === 'right' ? 'eyecover.rightEye' : 'eyecover.bothEyes';

  const instructionKey = currentEye === 'left' ? 'eyecover.coverRight'
    : currentEye === 'right' ? 'eyecover.coverLeft' : 'eyecover.keepBoth';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 page-enter">
      <div className="max-w-md w-full text-center">
        {/* Eye illustration */}
        <div className="flex items-center justify-center gap-8 mb-10 animate-scale-in">
          <div className="relative">
            {currentEye === 'right' ? (
              <EyeOff className="w-16 h-16 text-muted-foreground" />
            ) : (
              <Eye className="w-16 h-16 text-foreground" />
            )}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">L</span>
          </div>
          <div className="relative">
            {currentEye === 'left' ? (
              <EyeOff className="w-16 h-16 text-muted-foreground" />
            ) : (
              <Eye className="w-16 h-16 text-foreground" />
            )}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">R</span>
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-foreground mb-2 animate-fade-in-up">
          {t(eyeTitleKey, language)}
        </h2>

        <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          {t(instructionKey, language)}
        </p>

        {/* Countdown */}
        <div className="mb-8 animate-scale-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-foreground flex items-center justify-center">
            <span className="text-3xl font-display font-bold text-foreground">{countdown}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          Test {currentEyeIndex + 1} of {sequence.length}
        </p>

        <Button
          onClick={() => setScreen('test')}
          className="rounded-full px-10 h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105"
        >
          {t('eyecover.ready', language)}
        </Button>
      </div>
    </div>
  );
}
