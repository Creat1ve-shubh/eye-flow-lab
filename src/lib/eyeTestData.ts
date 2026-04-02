export type EyeType = 'left' | 'right' | 'both';
export type TestMode = 'left' | 'right' | 'both' | 'full';

export interface SnellenRow {
  row: number;
  letters: string;
  size: number; // font size in px
  acuity: string; // e.g., "20/200"
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

export interface EyeResult {
  eye: EyeType;
  lastCorrectRow: number;
  acuity: string;
  correctRows: number[];
}

export interface TestResult {
  id: string;
  date: string;
  results: EyeResult[];
  overallAcuity: string;
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

export function getRecommendations(category: string): string[] {
  switch (category) {
    case 'excellent':
      return [
        'Your vision appears to be in great shape!',
        'Continue with regular eye checkups every 1-2 years.',
        'Maintain a healthy diet rich in vitamins A and C.',
        'Follow the 20-20-20 rule when using screens.',
      ];
    case 'good':
      return [
        'Your vision is good but could benefit from monitoring.',
        'Consider scheduling an eye exam within the next 6 months.',
        'Ensure adequate lighting when reading.',
        'Take regular breaks from screen time.',
      ];
    case 'moderate':
      return [
        'We recommend scheduling an eye examination soon.',
        'You may benefit from corrective lenses.',
        'Avoid straining your eyes in low light conditions.',
        'Consider blue-light filtering glasses for screen use.',
      ];
    case 'poor':
      return [
        'Please consult an eye care professional as soon as possible.',
        'Avoid driving at night until your vision is evaluated.',
        'Corrective lenses or treatment may significantly improve your quality of life.',
        'Regular eye exams are essential — at least once every 6 months.',
      ];
    default:
      return [];
  }
}

export function getTestSequence(mode: TestMode): EyeType[] {
  switch (mode) {
    case 'left': return ['left'];
    case 'right': return ['right'];
    case 'both': return ['both'];
    case 'full': return ['left', 'right', 'both'];
  }
}
