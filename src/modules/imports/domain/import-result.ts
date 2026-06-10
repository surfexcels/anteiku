export interface ImportLineItem {
  description: string;
  quantity?: number;
  unitPriceMinor?: number;
  matchedProductId?: string;
  matchedProductName?: string;
  confidence?: number;
}

export interface ImportProcessingResult {
  lineCount: number;
  message: string;
  matchedCount?: number;
  ocrUsed?: boolean;
  ocrMethod?: string;
  aiUsed?: boolean;
  lineItems?: ImportLineItem[];
}
