interface ScoringInput {
  hasWebsite: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasSocialMedia: boolean;
  googleRating: number | null;
}

export function calculateLeadScore(input: ScoringInput): number {
  let score = 0;
  if (!input.hasWebsite) score += 40;
  if (input.hasPhone) score += 20;
  if (input.hasEmail) score += 15;
  if (input.hasSocialMedia) score += 15;
  if (input.googleRating !== null && input.googleRating < 4.0) score += 10;
  return Math.min(score, 100);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Hot';
  if (score >= 60) return 'Warm';
  if (score >= 40) return 'Moderate';
  return 'Cold';
}
