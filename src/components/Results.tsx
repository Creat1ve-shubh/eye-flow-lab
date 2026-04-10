import { useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { getScoreCategory, getRecommendations, TestResult, formatDuration } from '@/lib/eyeTestData';
import { getDeviceInfoString } from '@/lib/iotService';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, Home, ArrowRight, Timer, Activity, Mic, Keyboard, Monitor } from 'lucide-react';

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
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
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
  const { language, setScreen, eyeResults, resetTest, saveTestResult, patientDetails } = useApp();

  const overallAcuity = useMemo(() => {
    if (eyeResults.length === 0) return '20/200';
    return eyeResults.reduce((best, r) => {
      const d = parseInt(r.acuity.split('/')[1]);
      const bd = parseInt(best.split('/')[1]);
      return d < bd ? r.acuity : best;
    }, '20/200');
  }, [eyeResults]);

  const category = getScoreCategory(overallAcuity);
  const recommendations = getRecommendations(category, patientDetails);

  // Aggregate metrics
  const totalDurationMs = useMemo(() => eyeResults.reduce((sum, r) => sum + (r.totalTimeMs || 0), 0), [eyeResults]);
  const overallAvgResponse = useMemo(() => {
    const allMetrics = eyeResults.flatMap(r => r.rowMetrics || []);
    if (allMetrics.length === 0) return 0;
    return Math.round(allMetrics.reduce((s, m) => s + m.responseTimeMs, 0) / allMetrics.length);
  }, [eyeResults]);
  const voiceInputCount = useMemo(() => eyeResults.flatMap(r => r.rowMetrics || []).filter(m => m.inputMethod === 'voice').length, [eyeResults]);
  const keyboardInputCount = useMemo(() => eyeResults.flatMap(r => r.rowMetrics || []).filter(m => m.inputMethod === 'keyboard').length, [eyeResults]);
  const accuracyPercent = useMemo(() => {
    const all = eyeResults.flatMap(r => r.rowMetrics || []);
    if (all.length === 0) return 0;
    return Math.round((all.filter(m => m.correct).length / all.length) * 100);
  }, [eyeResults]);

  useEffect(() => {
    if (eyeResults.length === 0) return;
    const result: TestResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      results: eyeResults,
      overallAcuity,
      patientName: patientDetails.name || undefined,
      patientDetails: patientDetails.name ? patientDetails : undefined,
      totalDurationMs,
      deviceInfo: getDeviceInfoString(),
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
          {patientDetails.name && (
            <p className="text-sm text-muted-foreground mb-2 font-display">
              {patientDetails.name}
              {patientDetails.age ? `, ${patientDetails.age} yrs` : ''}
              {patientDetails.gender ? ` · ${patientDetails.gender}` : ''}
            </p>
          )}
          <h2 className="text-4xl font-display font-bold text-foreground mb-2">{t('results.title', language)}</h2>
          <p className="text-lg text-muted-foreground font-display italic">{categoryLabel}</p>
        </div>

        {/* Score rings */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          {eyeResults.map((r, i) => {
            const label = r.eye === 'left' ? t('results.leftEye', language)
              : r.eye === 'right' ? t('results.rightEye', language) : t('results.bothEyes', language);
            return <div key={i} style={{ animationDelay: `${i * 200}ms` }}><ScoreRing acuity={r.acuity} label={label} /></div>;
          })}
        </div>

        {/* Overall score */}
        <div className="bg-card border border-border rounded-xl p-6 text-center mb-6 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <p className="text-sm text-muted-foreground mb-1">{t('results.overall', language)}</p>
          <p className="text-5xl font-display font-bold text-foreground">{overallAcuity}</p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Timer className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Time</p>
            <p className="text-lg font-display font-bold text-foreground">{formatDuration(totalDurationMs)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Avg Response</p>
            <p className="text-lg font-display font-bold text-foreground">{(overallAvgResponse / 1000).toFixed(1)}s</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-lg font-display font-bold text-foreground">{accuracyPercent}%</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="flex justify-center gap-1 mb-1">
              <Keyboard className="w-3 h-3 text-muted-foreground" />
              <Mic className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Input</p>
            <p className="text-sm font-display font-bold text-foreground">{keyboardInputCount}⌨ / {voiceInputCount}🎙</p>
          </div>
        </div>

        {/* Per-eye detailed breakdown */}
        {eyeResults.map((r, idx) => (
          r.rowMetrics && r.rowMetrics.length > 0 && (
            <div key={idx} className="bg-card border border-border rounded-xl p-4 mb-4 animate-fade-in-up" style={{ animationDelay: `${450 + idx * 100}ms`, animationFillMode: 'both' }}>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                {r.eye === 'left' ? t('results.leftEye', language) : r.eye === 'right' ? t('results.rightEye', language) : t('results.bothEyes', language)}
                <span className="text-muted-foreground font-normal">— {r.acuity}</span>
              </h4>
              <div className="space-y-1.5">
                {r.rowMetrics.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground w-16">{m.acuity}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${m.correct ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
                        style={{ width: `${Math.min(100, Math.max(5, (1 - m.responseTimeMs / 10000) * 100))}%` }}
                      />
                    </div>
                    <span className={`font-mono w-12 text-right ${m.correct ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {(m.responseTimeMs / 1000).toFixed(1)}s
                    </span>
                    <span className="w-4">{m.correct ? '✓' : '✗'}</span>
                    <span className="w-4 text-muted-foreground">{m.inputMethod === 'voice' ? '🎙' : '⌨'}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Device info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          <Monitor className="w-3 h-3" />
          <span className="font-mono truncate">{getDeviceInfoString()}</span>
        </div>

        {/* Recommendations */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '650ms', animationFillMode: 'both' }}>
          <h3 className="text-xl font-display font-semibold text-foreground mb-4">{t('results.recommendations', language)}</h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: `${700 + i * 100}ms`, animationFillMode: 'both' }}>
                <ArrowRight className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '900ms', animationFillMode: 'both' }}>
          <Button variant="outline" onClick={() => setScreen('dashboard')} className="rounded-full px-6 h-12">
            <Home className="w-4 h-4 mr-2" />
            {t('results.home', language)}
          </Button>
          <Button onClick={handleRetake} className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('results.retake', language)}
          </Button>
        </div>
      </main>
    </div>
  );
}
