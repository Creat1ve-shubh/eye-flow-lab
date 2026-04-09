import { useState } from 'react';
import { useApp, PatientDetails as PatientDetailsType, defaultPatientDetails } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';

export default function PatientDetails() {
  const { language, setScreen, patientDetails, setPatientDetails } = useApp();
  const [form, setForm] = useState<PatientDetailsType>(patientDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = t('patient.nameRequired', language);
    if (form.name.trim().length > 100) newErrors.name = t('patient.nameTooLong', language);
    if (form.age === null || form.age < 1 || form.age > 150) newErrors.age = t('patient.ageRequired', language);
    if (!form.gender) newErrors.gender = t('patient.genderRequired', language);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    setPatientDetails(form);
    setScreen('selectMode');
  };

  const handleSkip = () => {
    setScreen('selectMode');
  };

  const fieldClass = "w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all";
  const labelClass = "text-sm font-medium text-foreground mb-1.5 block";
  const errorClass = "text-xs text-destructive mt-1";

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
        <div className="max-w-md w-full">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {t('patient.title', language)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('patient.subtitle', language)}
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            {/* Name */}
            <div>
              <label className={labelClass}>{t('patient.name', language)}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.slice(0, 100) })}
                className={fieldClass}
                placeholder={t('patient.namePlaceholder', language)}
                maxLength={100}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            {/* Age & Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('patient.age', language)}</label>
                <input
                  type="number"
                  value={form.age ?? ''}
                  onChange={e => {
                    const v = e.target.value ? parseInt(e.target.value) : null;
                    setForm({ ...form, age: v !== null && v > 150 ? 150 : v });
                  }}
                  className={fieldClass}
                  min={1}
                  max={150}
                  placeholder="25"
                />
                {errors.age && <p className={errorClass}>{errors.age}</p>}
              </div>
              <div>
                <label className={labelClass}>{t('patient.gender', language)}</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value as any })}
                  className={fieldClass}
                >
                  <option value="">{t('patient.selectGender', language)}</option>
                  <option value="male">{t('patient.male', language)}</option>
                  <option value="female">{t('patient.female', language)}</option>
                  <option value="other">{t('patient.other', language)}</option>
                </select>
                {errors.gender && <p className={errorClass}>{errors.gender}</p>}
              </div>
            </div>

            {/* Last eye exam */}
            <div>
              <label className={labelClass}>{t('patient.lastExam', language)}</label>
              <select
                value={form.lastEyeExam}
                onChange={e => setForm({ ...form, lastEyeExam: e.target.value as any })}
                className={fieldClass}
              >
                <option value="">{t('patient.selectOption', language)}</option>
                <option value="less_than_1_year">{t('patient.lessThan1Year', language)}</option>
                <option value="1_to_2_years">{t('patient.1to2Years', language)}</option>
                <option value="more_than_2_years">{t('patient.moreThan2Years', language)}</option>
                <option value="never">{t('patient.never', language)}</option>
              </select>
            </div>

            {/* Screen time */}
            <div>
              <label className={labelClass}>{t('patient.screenTime', language)}</label>
              <input
                type="number"
                value={form.screenTimeHours ?? ''}
                onChange={e => {
                  const v = e.target.value ? parseInt(e.target.value) : null;
                  setForm({ ...form, screenTimeHours: v !== null && v > 24 ? 24 : v });
                }}
                className={fieldClass}
                min={0}
                max={24}
                placeholder="6"
              />
            </div>

            {/* Medical history toggles */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-foreground">{t('patient.medicalHistory', language)}</p>
              {[
                { key: 'hasGlasses', label: t('patient.wearsGlasses', language) },
                { key: 'hasDiabetes', label: t('patient.diabetes', language) },
                { key: 'hasHypertension', label: t('patient.hypertension', language) },
                { key: 'familyHistoryEyeDisease', label: t('patient.familyHistory', language) },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      (form as any)[item.key]
                        ? 'bg-foreground border-foreground'
                        : 'border-border group-hover:border-foreground/50'
                    }`}
                    onClick={() => setForm({ ...form, [item.key]: !(form as any)[item.key] })}
                  >
                    {(form as any)[item.key] && (
                      <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center mt-8 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="rounded-full px-6 h-12"
            >
              {t('patient.skip', language)}
            </Button>
            <Button
              onClick={handleContinue}
              className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              {t('patient.continue', language)}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
