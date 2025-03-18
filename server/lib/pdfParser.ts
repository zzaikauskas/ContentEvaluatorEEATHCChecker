import { createReadStream } from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentParseResult {
  text: string;
  title: string | null;
  links: string[];
}

// Extract links from text content
function extractLinksFromText(text: string): string[] {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Find all matches
  const matches = text.match(urlRegex) || [];
  
  // Remove any trailing punctuation or closing parentheses
  return matches
    .map(url => url.replace(/[,.!?;:'")\]]+$/, ''))
    .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
}

// Create a temporary file for the PDF to avoid in-memory issues
export async function parsePdf(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    // Save buffer to temporary file
    const tempFilePath = await saveTempPdf(buffer);
    
    // Use pdf-parse with the file path instead of buffer
    // This bypasses the test file loading issue
    const pdfParse = require('pdf-parse');
    
    const dataBuffer = fs.readFileSync(tempFilePath);
    const data = await pdfParse(dataBuffer);
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error removing temp PDF file:', err);
    }
    
    const text = data.text || '';
    
    // Try to extract a title from the first few lines
    const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
    const potentialTitle = lines.length > 0 ? lines[0].trim() : null;
    
    // Extract links
    const links = extractLinksFromText(text);
    
    return {
      text,
      title: potentialTitle,
      links
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper to save buffer to temporary file
async function saveTempPdf(buffer: Buffer): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${uuidv4()}.pdf`;
  const filePath = path.join(tempDir, fileName);
  
  return new Promise<string>((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}