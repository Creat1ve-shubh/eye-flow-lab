import { useApp } from '@/context/AppContext';
import { t, languageNames, Language } from '@/lib/i18n';
import { Eye, ArrowRight, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { key: 'step1', icon: '📏' },
  { key: 'step2', icon: '📷' },
  { key: 'step3', icon: '🔤' },
  { key: 'step4', icon: '📊' },
];

export default function Dashboard() {
  const { language, setLanguage, setScreen, testHistory } = useApp();

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

          {/* Language Selector */}
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
            onClick={() => setScreen('selectMode')}
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
                className={`bg-card border border-border rounded-xl p-6 text-center animate-fade-in-up`}
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
              {testHistory.slice(0, 5).map((result) => (
                <div key={result.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-foreground/20 transition-colors duration-200">
                  <div>
                    <p className="text-sm font-medium text-foreground">{result.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.results.map(r => `${r.eye}: ${r.acuity}`).join(' • ')}
                    </p>
                  </div>
                  <span className="text-lg font-display font-bold text-foreground">{result.overallAcuity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
