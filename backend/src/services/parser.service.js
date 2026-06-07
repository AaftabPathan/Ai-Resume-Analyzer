const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * File Parser Service
 */
const ParserService = {
  /**
   * Parse a local document file and extract its raw text content
   */
  async parseFile(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    try {
      if (mimeType === 'application/pdf') {
        return await this.parsePDF(filePath);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filePath.endsWith('.docx')
      ) {
        return await this.parseDOCX(filePath);
      } else if (mimeType === 'text/plain' || filePath.endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf-8');
      } else {
        throw new Error(`Unsupported file type: ${mimeType || 'unknown'}`);
      }
    } catch (err) {
      console.error('Error during document parsing:', err);
      throw new Error(`Failed to parse resume file: ${err.message}`);
    }
  },

  /**
   * Extract text from PDF files using pdf-parse
   */
  async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  },

  /**
   * Extract text from Word DOCX files using mammoth
   */
  async parseDOCX(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  }
};

module.exports = ParserService;
