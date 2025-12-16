/**
 * Category suggestion with confidence score.
 */
export type CategorySuggestion = {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0..1
  reason?: string; // e.g., "Matched keyword 'coffee'"
};
