import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { TestMode } from '@/lib/eyeTestData';
import { Eye, EyeOff, ArrowLeft, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const modes: { mode: TestMode; key: string; icon: React.ReactNode; desc: string }[] = [
  { mode: 'left', key: 'selectEyes.left', icon: <><Eye className="w-6 h-6" /><EyeOff className="w-6 h-6 opacity-40" /></>, desc: 'Cover your right eye, test left eye only' },
  { mode: 'right', key: 'selectEyes.right', icon: <><EyeOff className="w-6 h-6 opacity-40" /><Eye className="w-6 h-6" /></>, desc: 'Cover your left eye, test right eye only' },
  { mode: 'both', key: 'selectEyes.both', icon: <><Eye className="w-6 h-6" /><Eye className="w-6 h-6" /></>, desc: 'No covering — read with both eyes open' },
  { mode: 'full', key: 'selectEyes.full', icon: <ClipboardCheck className="w-6 h-6" />, desc: 'Tests left, right & both eyes sequentially' },
];

export default function SelectMode() {
  const { language, setScreen, setTestMode, resetTest } = useApp();

  const handleSelect = (mode: TestMode) => {
    setTestMode(mode);
    resetTest();
    setScreen('calibration');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col page-enter">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <button onClick={() => setScreen('dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-2 animate-fade-in-up">
            {t('selectEyes', language)}
          </h2>
          <p className="text-muted-foreground text-center mb-10 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            Choose how you'd like to test your vision
          </p>

          <div className="space-y-4">
            {modes.map((m, i) => (
              <button
                key={m.mode}
                onClick={() => handleSelect(m.mode)}
                className="w-full bg-card border border-border rounded-xl p-5 flex items-center gap-5 hover:border-foreground/30 hover:shadow-md transition-all duration-300 animate-fade-in-up group"
                style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-1 text-foreground">
                  {m.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground group-hover:translate-x-1 transition-transform duration-200">
                    {t(m.key, language)}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
