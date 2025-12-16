import type { CategorySuggestion } from '@/types/suggestions';

/**
 * Keyword-based category suggestions for local development.
 * Simple heuristics based on transaction note and amount.
 */
const CATEGORY_KEYWORDS: Record<
  string,
  { id: string; name: string; keywords: string[]; amountRange?: [number, number] }
> = {
  food: {
    id: 'cat_food',
    name: 'Food',
    keywords: [
      'coffee',
      'restaurant',
      'cafe',
      'lunch',
      'dinner',
      'breakfast',
      'food',
      'pizza',
      'burger',
      'starbucks',
      'mcdonald',
    ],
    amountRange: [10000, 500000],
  },
  transport: {
    id: 'cat_transport',
    name: 'Transport',
    keywords: [
      'grab',
      'uber',
      'taxi',
      'bus',
      'metro',
      'petrol',
      'gas',
      'parking',
      'toll',
      'fuel',
    ],
    amountRange: [10000, 300000],
  },
  shopping: {
    id: 'cat_shopping',
    name: 'Shopping',
    keywords: [
      'amazon',
      'shop',
      'store',
      'mall',
      'clothing',
      'clothes',
      'fashion',
      'purchase',
    ],
    amountRange: [50000, 5000000],
  },
  bills: {
    id: 'cat_bills',
    name: 'Bills',
    keywords: [
      'electric',
      'water',
      'internet',
      'phone',
      'bill',
      'utility',
      'rent',
      'subscription',
      'netflix',
      'spotify',
    ],
    amountRange: [50000, 2000000],
  },
  salary: {
    id: 'cat_salary',
    name: 'Salary',
    keywords: ['salary', 'wage', 'income', 'payment', 'paycheck'],
    amountRange: [5000000, 100000000],
  },
};

/**
 * Get category suggestions based on transaction text data.
 * Uses simple keyword matching and amount range heuristics.
 * 
 * @param params - Transaction text parameters
 * @returns Array of category suggestions with confidence scores
 */
export function getLocalSuggestions(params: {
  note?: string;
  amount?: number;
  merchant?: string;
}): CategorySuggestion[] {
  const { note = '', amount, merchant = '' } = params;
  const searchText = `${note} ${merchant}`.toLowerCase();

  const suggestions: CategorySuggestion[] = [];

  for (const [key, category] of Object.entries(CATEGORY_KEYWORDS)) {
    let confidence = 0;
    const reasons: string[] = [];

    // Check keyword matches
    const matchedKeywords = category.keywords.filter((keyword) =>
      searchText.includes(keyword)
    );

    if (matchedKeywords.length > 0) {
      confidence += 0.6 * (matchedKeywords.length / category.keywords.length);
      reasons.push(`Matched keyword '${matchedKeywords[0]}'`);
    }

    // Check amount range
    if (amount && category.amountRange) {
      const [min, max] = category.amountRange;
      const absAmount = Math.abs(amount);
      if (absAmount >= min && absAmount <= max) {
        confidence += 0.3;
        reasons.push('Amount fits typical range');
      }
    }

    if (confidence > 0.2) {
      suggestions.push({
        categoryId: category.id,
        categoryName: category.name,
        confidence: Math.min(confidence, 1),
        reason: reasons.join(', '),
      });
    }
  }

  // Sort by confidence descending
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
