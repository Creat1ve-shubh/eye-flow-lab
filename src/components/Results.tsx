import { useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { getScoreCategory, getRecommendations, EyeResult, TestResult } from '@/lib/eyeTestData';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, Home, ArrowRight } from 'lucide-react';

function ScoreRing({ acuity, label }: { acuity: string; label: string }) {
  const category = getScoreCategory(acuity);
  const percentage = category === 'excellent' ? 95 : category === 'good' ? 75 : category === 'moderate' ? 50 : 25;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="text-center animate-scale-in">
      <div className="relative w-28 h-28 mx-auto mb-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ animationDelay: '500ms' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-display font-bold text-foreground">{acuity}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Results() {
  const { language, setScreen, eyeResults, resetTest, saveTestResult } = useApp();

  const overallAcuity = useMemo(() => {
    if (eyeResults.length === 0) return '20/200';
    const best = eyeResults.reduce((best, r) => {
      const d = parseInt(r.acuity.split('/')[1]);
      const bd = parseInt(best.split('/')[1]);
      return d < bd ? r.acuity : best;
    }, '20/200');
    return best;
  }, [eyeResults]);

  const category = getScoreCategory(overallAcuity);
  const recommendations = getRecommendations(category);

  useEffect(() => {
    if (eyeResults.length === 0) return;
    const result: TestResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      results: eyeResults,
      overallAcuity,
    };
    saveTestResult(result);
  }, []);

  const categoryLabel = t(`results.${category}`, language);

  const handleRetake = () => {
    resetTest();
    setScreen('selectMode');
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Eye className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-display font-bold text-foreground mb-2">
            {t('results.title', language)}
          </h2>
          <p className="text-lg text-muted-foreground font-display italic">
            {categoryLabel}
          </p>
        </div>

        {/* Score rings */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {eyeResults.map((r, i) => {
            const label = r.eye === 'left' ? t('results.leftEye', language)
              : r.eye === 'right' ? t('results.rightEye', language) : t('results.bothEyes', language);
            return (
              <div key={i} style={{ animationDelay: `${i * 200}ms` }}>
                <ScoreRing acuity={r.acuity} label={label} />
              </div>
            );
          })}
        </div>

        {/* Overall */}
        <div className="bg-card border border-border rounded-xl p-6 text-center mb-8 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <p className="text-sm text-muted-foreground mb-1">{t('results.overall', language)}</p>
          <p className="text-5xl font-display font-bold text-foreground">{overallAcuity}</p>
        </div>

        {/* Recommendations */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <h3 className="text-xl font-display font-semibold text-foreground mb-4">
            {t('results.recommendations', language)}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-card border border-border rounded-lg p-4 animate-fade-in-up"
                style={{ animationDelay: `${600 + i * 100}ms`, animationFillMode: 'both' }}
              >
                <ArrowRight className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
          <Button
            variant="outline"
            onClick={() => setScreen('dashboard')}
            className="rounded-full px-6 h-12"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('results.home', language)}
          </Button>
          <Button
            onClick={handleRetake}
            className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('results.retake', language)}
          </Button>
        </div>
      </main>
    </div>
  );
}
