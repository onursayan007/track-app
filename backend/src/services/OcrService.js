class OcrService {
  static async extractInvoiceData(fileBuffer) {
    return {
      extractedAmount: Math.floor(Math.random() * 5000) + 500,
      extractedDate: new Date(),
    };
  }
}

module.exports = { OcrService };
