import { PatientDetails } from '@/context/AppContext';

export type EyeType = 'left' | 'right' | 'both';
export type TestMode = 'left' | 'right' | 'both' | 'full';

export interface SnellenRow {
  row: number;
  letters: string;
  size: number;
  acuity: string;
}

const LETTER_POOL = 'EFPTOZLPDCBDSN';

function generateRandomLetters(count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  }
  return result;
}

export function generateSnellenChart(): SnellenRow[] {
  return [
    { row: 1, letters: generateRandomLetters(1), size: 96, acuity: '20/200' },
    { row: 2, letters: generateRandomLetters(2), size: 72, acuity: '20/100' },
    { row: 3, letters: generateRandomLetters(3), size: 60, acuity: '20/70' },
    { row: 4, letters: generateRandomLetters(3), size: 48, acuity: '20/50' },
    { row: 5, letters: generateRandomLetters(4), size: 36, acuity: '20/40' },
    { row: 6, letters: generateRandomLetters(5), size: 30, acuity: '20/30' },
    { row: 7, letters: generateRandomLetters(6), size: 24, acuity: '20/25' },
    { row: 8, letters: generateRandomLetters(7), size: 20, acuity: '20/20' },
    { row: 9, letters: generateRandomLetters(6), size: 16, acuity: '20/15' },
    { row: 10, letters: generateRandomLetters(7), size: 13, acuity: '20/13' },
    { row: 11, letters: generateRandomLetters(8), size: 10, acuity: '20/10' },
  ];
}

export interface RowMetric {
  row: number;
  acuity: string;
  responseTimeMs: number;
  correct: boolean;
  inputMethod: 'keyboard' | 'voice';
}

export interface EyeResult {
  eye: EyeType;
  lastCorrectRow: number;
  acuity: string;
  correctRows: number[];
  rowMetrics?: RowMetric[];
  totalTimeMs?: number;
  avgResponseTimeMs?: number;
}

export interface TestResult {
  id: string;
  date: string;
  results: EyeResult[];
  overallAcuity: string;
  patientName?: string;
  patientDetails?: PatientDetails;
  totalDurationMs?: number;
  deviceInfo?: string;
}

export function getAcuityFromRow(row: number): string {
  const map: Record<number, string> = {
    1: '20/200', 2: '20/100', 3: '20/70', 4: '20/50',
    5: '20/40', 6: '20/30', 7: '20/25', 8: '20/20',
    9: '20/15', 10: '20/13', 11: '20/10',
  };
  return map[row] || '20/200';
}

export function getScoreCategory(acuity: string): 'excellent' | 'good' | 'moderate' | 'poor' {
  const denominator = parseInt(acuity.split('/')[1]);
  if (denominator <= 20) return 'excellent';
  if (denominator <= 30) return 'good';
  if (denominator <= 50) return 'moderate';
  return 'poor';
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

export function getRecommendations(category: string, patient?: PatientDetails | null): string[] {
  const recs: string[] = [];

  switch (category) {
    case 'excellent':
      recs.push('Your vision appears to be in great shape!', 'Continue with regular eye checkups every 1-2 years.');
      break;
    case 'good':
      recs.push('Your vision is good but could benefit from monitoring.', 'Consider scheduling an eye exam within the next 6 months.');
      break;
    case 'moderate':
      recs.push('We recommend scheduling an eye examination soon.', 'You may benefit from corrective lenses.');
      break;
    case 'poor':
      recs.push('Please consult an eye care professional as soon as possible.', 'Corrective lenses or treatment may significantly improve your quality of life.');
      break;
  }

  if (!patient || !patient.age) {
    recs.push('Follow the 20-20-20 rule when using screens.', 'Maintain a healthy diet rich in vitamins A and C.');
    return recs;
  }

  if (patient.age < 18) {
    recs.push('Children and teens should have annual eye exams to monitor developing vision.');
    if (category !== 'excellent') recs.push('Early intervention can prevent worsening vision — consult a pediatric ophthalmologist.');
  } else if (patient.age >= 40 && patient.age < 60) {
    recs.push('After 40, presbyopia (difficulty focusing on close objects) is common — consider reading glasses.');
    recs.push('Screen for glaucoma and macular degeneration during your next eye exam.');
  } else if (patient.age >= 60) {
    recs.push('Annual comprehensive eye exams are essential after age 60.');
    recs.push('Watch for symptoms of cataracts: blurry vision, halos around lights, faded colors.');
    if (category === 'moderate' || category === 'poor') recs.push('Ask your doctor about cataract evaluation and age-related macular degeneration screening.');
  }

  if (patient.hasDiabetes) {
    recs.push('Diabetic retinopathy is a leading cause of blindness — get a dilated eye exam at least once a year.');
    recs.push('Maintain stable blood sugar levels to protect your eye health.');
  }
  if (patient.hasHypertension) recs.push('High blood pressure can damage retinal blood vessels — monitor your blood pressure regularly.');
  if (patient.familyHistoryEyeDisease) recs.push('With a family history of eye disease, regular screenings for glaucoma and macular degeneration are important.');

  if (patient.screenTimeHours && patient.screenTimeHours >= 6) {
    recs.push(`With ${patient.screenTimeHours}+ hours of daily screen time, follow the 20-20-20 rule strictly.`);
    recs.push('Consider blue-light filtering glasses and ensure adequate screen brightness.');
  } else {
    recs.push('Follow the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.');
  }

  if (patient.hasGlasses) {
    if (category === 'moderate' || category === 'poor') recs.push('Your current prescription may need updating — schedule an appointment to check.');
    else recs.push('Keep your prescription up to date with regular checkups.');
  }

  if (patient.lastEyeExam === 'more_than_2_years' || patient.lastEyeExam === 'never') {
    recs.push('It has been a while since your last eye exam — we strongly recommend scheduling one soon.');
  }

  return recs;
}

export function getTestSequence(mode: TestMode): EyeType[] {
  switch (mode) {
    case 'left': return ['left'];
    case 'right': return ['right'];
    case 'both': return ['both'];
    case 'full': return ['left', 'right', 'both'];
  }
}
