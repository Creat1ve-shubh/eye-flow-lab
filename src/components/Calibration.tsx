import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Calibration() {
  const { language, setScreen } = useApp();
  const [status, setStatus] = useState<'checking' | 'ready'>('checking');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setStatus('ready');
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col page-enter">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <button onClick={() => setScreen('selectMode')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-secondary flex items-center justify-center">
              {status === 'checking' ? (
                <Camera className="w-10 h-10 text-foreground animate-pulse-gentle" />
              ) : (
                <CheckCircle className="w-10 h-10 text-foreground" />
              )}
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-foreground mb-3 animate-fade-in-up">
            {t('calibration.title', language)}
          </h2>

          <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            {t('calibration.instruction', language)}
          </p>

          {/* Distance visualization */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="w-12 h-16 border-2 border-foreground rounded-lg flex items-center justify-center text-xs font-mono text-foreground">
                📱
              </div>
              <div className="flex-1 max-w-[150px] h-0.5 bg-border relative">
                <div
                  className="absolute top-0 left-0 h-full bg-foreground transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono">
                  ~50cm
                </span>
              </div>
              <div className="text-2xl">👤</div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {status === 'checking' ? t('calibration.checking', language) : t('calibration.ready', language)}
            </p>
          </div>

          <div className="flex gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Button
              variant="outline"
              onClick={() => setScreen('eyeCover')}
              className="rounded-full px-6"
            >
              {t('calibration.skip', language)}
            </Button>
            <Button
              onClick={() => setScreen('eyeCover')}
              disabled={status !== 'ready'}
              className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-40"
            >
              {t('calibration.continue', language)}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
