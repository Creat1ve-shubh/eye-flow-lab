import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, CreditCard, CheckCircle, Ruler, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const STANDARD_CARD_WIDTH_CM = 8.56; // ISO/IEC 7810 ID-1 credit card width

export default function Calibration() {
  const { language, setScreen } = useApp();
  const [step, setStep] = useState<'card' | 'distance' | 'ready'>('card');
  const [cardWidthPx, setCardWidthPx] = useState(320);
  const [distanceCm, setDistanceCm] = useState<number | null>(null);
  const [pxPerCm, setPxPerCm] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Step 1: User matches on-screen rectangle to their physical credit card
  const handleCardCalibrated = useCallback(() => {
    const calculatedPxPerCm = cardWidthPx / STANDARD_CARD_WIDTH_CM;
    setPxPerCm(calculatedPxPerCm);
    setStep('distance');
  }, [cardWidthPx]);

  // Step 2: Show recommended distance check
  useEffect(() => {
    if (step === 'distance' && pxPerCm) {
      // For a proper Snellen test, recommended distance is ~50cm
      // We just instruct the user and confirm
      setDistanceCm(50);
      const timer = setTimeout(() => setStep('ready'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, pxPerCm]);

  const getStatusIcon = () => {
    switch (step) {
      case 'card': return <CreditCard className="w-10 h-10 text-foreground" />;
      case 'distance': return <Ruler className="w-10 h-10 text-foreground animate-pulse-gentle" />;
      case 'ready': return <CheckCircle className="w-10 h-10 text-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (step) {
      case 'card': return t('calibration.cardStep', language);
      case 'distance': return t('calibration.distanceStep', language);
      case 'ready': return t('calibration.ready', language);
    }
  };

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
              {getStatusIcon()}
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-foreground mb-3 animate-fade-in-up">
            {t('calibration.title', language)}
          </h2>

          <p className="text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            {getStatusText()}
          </p>

          {/* Step 1: Credit card calibration */}
          {step === 'card' && (
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              {/* Visual card outline */}
              <div className="flex justify-center mb-6">
                <div
                  ref={cardRef}
                  className="border-2 border-dashed border-foreground/60 rounded-lg relative transition-all duration-150"
                  style={{
                    width: `${cardWidthPx}px`,
                    height: `${cardWidthPx * 0.6294}px`, // Standard card aspect ratio
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {(cardWidthPx / (pxPerCm || (cardWidthPx / STANDARD_CARD_WIDTH_CM))).toFixed(1)} cm
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 text-left bg-secondary/50 rounded-lg p-3 mb-4 mx-auto max-w-xs">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('calibration.cardHint', language)}
                </p>
              </div>

              {/* Slider to adjust card size */}
              <div className="px-4 mb-8">
                <Slider
                  value={[cardWidthPx]}
                  onValueChange={([v]) => setCardWidthPx(v)}
                  min={200}
                  max={500}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleCardCalibrated}
                className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('calibration.cardDone', language)}
              </Button>
            </div>
          )}

          {/* Step 2: Distance confirmation */}
          {step === 'distance' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="w-12 h-16 border-2 border-foreground rounded-lg flex items-center justify-center text-xs font-mono text-foreground">
                  📱
                </div>
                <div className="flex-1 max-w-[150px] h-0.5 bg-border relative">
                  <div className="absolute top-0 left-0 h-full bg-foreground animate-pulse-gentle w-full" />
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono">
                    ~{distanceCm}cm
                  </span>
                </div>
                <div className="text-2xl">👤</div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('calibration.distanceCheck', language)}
              </p>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 'ready' && (
            <div className="animate-fade-in-up">
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 mx-auto max-w-xs">
                <p className="text-sm font-mono text-foreground">
                  {t('calibration.screenRes', language)}: {pxPerCm?.toFixed(1)} px/cm
                </p>
                <p className="text-sm font-mono text-foreground">
                  {t('calibration.testDistance', language)}: {distanceCm}cm
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 justify-center mt-6 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Button
              variant="outline"
              onClick={() => setScreen('eyeCover')}
              className="rounded-full px-6"
            >
              {t('calibration.skip', language)}
            </Button>
            {step === 'ready' && (
              <Button
                onClick={() => setScreen('eyeCover')}
                className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
              >
                {t('calibration.continue', language)}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
