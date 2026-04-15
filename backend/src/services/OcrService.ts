export interface ExtractedInvoiceData {
  extractedAmount: number;
  extractedDate: Date;
}

export class OcrService {
  static async extractInvoiceData(_fileBuffer: Buffer): Promise<ExtractedInvoiceData> {
    return {
      extractedAmount: Math.floor(Math.random() * 5000) + 500,
      extractedDate: new Date(),
    };
  }
}
