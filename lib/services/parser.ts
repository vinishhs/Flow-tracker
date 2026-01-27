// lib/services/parser.ts

export type TransactionType = 'income' | 'expense';

export interface TransactionData {
  amount: number;
  category: string;
  transaction_type: TransactionType;
  date?: string;
  originalDetail?: string;
  originalLine?: string;
  senderName?: string;
  recipientName?: string;
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

      // Extract date (e.g., "17 Jan")
      const dateMatch = line.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))/i);
      const date = dateMatch ? dateMatch[1] : undefined;

      let category = "General";
      let type: TransactionType = 'expense';
      let originalDetail = "";
      let senderName: string | undefined;
      let recipientName: string | undefined;

      const lowerLine = line.toLowerCase();

      // Check for special keywords FIRST
      if (lowerLine.includes("lent")) {
        category = "LENT";
        // Extract name after "lent to"
        const detailMatch = line.match(/lent to\s+([^-₹\d]+)/i);
        recipientName = detailMatch ? detailMatch[1].trim() : "";
        originalDetail = recipientName;
      } else if (lowerLine.includes("others")) {
        category = "OTHERS";
        // Extract detail after "others" or "- O -"
        const detailMatch = line.match(/(?:others|[-—]\s?[o0]\s?[-—])\s*:?\s*([^-]+)/i);
        originalDetail = detailMatch ? detailMatch[1].trim() : "";
      } else if (lowerLine.includes("money in")) {
        category = "Money In";
        type = "income";
        // Extract sender name: "Money In : Sow" or "Money In Sow"
        const senderMatch = line.match(/money in\s*:?\s*([^-₹\d]+)/i);
        senderName = senderMatch ? senderMatch[1].trim() : "";
        originalDetail = senderName;
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
        transaction_type: type,
        date,
        originalDetail: originalDetail || undefined,
        originalLine: line,
        senderName,
        recipientName
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