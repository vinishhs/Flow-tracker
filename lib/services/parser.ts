// lib/services/parser.ts

export type TransactionType = 'income' | 'expense';

export interface TransactionData {
  amount: number;
  category: string;
  transaction_type: TransactionType;
}

export interface ProcessResult {
  recognized: TransactionData[];
  unrecognized: string[];
}

export function parseAppleNote(text: string): ProcessResult {
  const normalized = text.replace(/[—–]/g, '-');
  const lines = normalized.split('\n').map(s => s.trim());

  const recognized: TransactionData[] = [];
  const unrecognized: string[] = [];

  lines.forEach((line) => {
    if (!line.includes('₹') || line.includes('-------')) return;

    try {
      const amountMatch = line.match(/₹\s?(\d+)/);
      const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

      let category = "General";
      let type: TransactionType = 'expense';

      const lowerLine = line.toLowerCase();

      // Check for special keywords FIRST
      if (lowerLine.includes("lent")) {
        category = "LEND TO";
      } else if (lowerLine.includes("others")) {
        category = "OTHERS";
        // For OTHERS, ignore everything after colon if it exists
        // This is already handled by just setting the category name
      } else if (lowerLine.includes("money in")) {
        category = "Money In";
        type = "income";
      } else if (lowerLine.includes("food")) {
        category = "Food";
      } else if (lowerLine.includes("travel")) {
        category = "Travel";
      } else if (lowerLine.includes("cloths")) {
        category = "Cloths";
      } else if (lowerLine.includes("grooming")) {
        category = "Grooming";
      } else if (lowerLine.includes("health")) {
        category = "Health";
      } else if (lowerLine.includes("social")) {
        category = "Social";
      } else if (lowerLine.includes("eft")) {
        category = "Eft";
      }

      recognized.push({
        amount,
        category,
        transaction_type: type
      });
    } catch (e) {
      unrecognized.push(line);
    }
  });

  return {
    recognized,
    unrecognized
  };
}