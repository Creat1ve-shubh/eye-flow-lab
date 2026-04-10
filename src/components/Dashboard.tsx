import { useApp } from '@/context/AppContext';
import { t, languageNames, Language } from '@/lib/i18n';
import { getScoreCategory, formatDuration } from '@/lib/eyeTestData';
import { Eye, ArrowRight, Clock, Globe, User, Activity, Bluetooth } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDeviceCapabilities } from '@/lib/iotService';
import { useMemo } from 'react';

const steps = [
  { key: 'step1', icon: '📏' },
  { key: 'step2', icon: '📷' },
  { key: 'step3', icon: '🔤' },
  { key: 'step4', icon: '📊' },
];

function getCategoryBadge(acuity: string) {
  const cat = getScoreCategory(acuity);
  const labels: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', moderate: 'Moderate', poor: 'Needs Attention',
  };
  return labels[cat] || cat;
}

export default function Dashboard() {
  const { language, setLanguage, setScreen, testHistory } = useApp();
  const iotCapabilities = useMemo(() => getDeviceCapabilities(), []);
  const hasIoT = iotCapabilities.bluetooth || iotCapabilities.serial;

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold tracking-tight text-foreground">
                {t('app.title', language)}
              </h1>
              <p className="text-xs text-muted-foreground font-sans">
                {t('app.subtitle', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasIoT && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                <Bluetooth className="w-3 h-3" />
                <span>IoT Ready</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-sm bg-secondary text-secondary-foreground border-none rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            {t('dashboard.welcome', language)}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans">
            {t('dashboard.description', language)}
          </p>
          <Button
            onClick={() => setScreen('patientDetails')}
            className="mt-8 h-14 px-10 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            {t('dashboard.start', language)}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h3 className="text-2xl font-display font-semibold text-foreground text-center mb-8">
            {t('dashboard.howItWorks', language)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.key}
                className="bg-card border border-border rounded-xl p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="text-3xl mb-3">{step.icon}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">
                  {t(`dashboard.${step.key}.title`, language)}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`dashboard.${step.key}.desc`, language)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Test History */}
        <div className="animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <h3 className="text-2xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('dashboard.history', language)}
          </h3>
          {testHistory.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">{t('dashboard.noHistory', language)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testHistory.slice(0, 8).map((result, idx) => (
                <div
                  key={result.id}
                  className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${550 + idx * 60}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {result.patientName || 'Anonymous Patient'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {result.date}
                          {result.patientDetails?.age && (
                            <span>· {result.patientDetails.age} yrs</span>
                          )}
                          {result.patientDetails?.gender && (
                            <span>· {result.patientDetails.gender}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-display font-bold text-foreground">{result.overallAcuity}</p>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        {getCategoryBadge(result.overallAcuity)}
                      </span>
                    </div>
                  </div>

                  {/* Eye results row */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {result.results.map((r, ri) => (
                      <span
                        key={ri}
                        className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-mono"
                      >
                        {r.eye === 'left' ? 'L' : r.eye === 'right' ? 'R' : 'B'}: {r.acuity}
                        {r.avgResponseTimeMs ? ` · ${(r.avgResponseTimeMs / 1000).toFixed(1)}s avg` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Medical flags */}
                  {result.patientDetails && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.patientDetails.hasGlasses && (
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">👓 Glasses</span>
                      )}
                      {result.patientDetails.hasDiabetes && (
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">🩺 Diabetes</span>
                      )}
                      {result.patientDetails.hasHypertension && (
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">❤️ Hypertension</span>
                      )}
                      {result.patientDetails.familyHistoryEyeDisease && (
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">👨‍👩‍👧 Family History</span>
                      )}
                      {result.totalDurationMs && (
                        <span className="text-[10px] bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">
                          ⏱ {formatDuration(result.totalDurationMs)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
