import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';

export interface DocumentParseResult {
  text: string;
  title: string | null;
  links: string[];
}

/**
 * Parse a PDF Buffer to extract text content
 */
async function processPdf(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    // Save buffer to a temporary file to avoid pdf-parse test file issue
    const tempFilePath = await saveTempFile(buffer, '.pdf');
    
    try {
      // Use pdf-parse with the file path instead of buffer
      // This avoids the test file loading issue
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      
      const dataBuffer = fs.readFileSync(tempFilePath);
      const data = await pdfParse(dataBuffer);
      
      // Extract text
      const text = data.text || '';
      
      // Try to extract a title from the first few lines
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
      const potentialTitle = lines.length > 0 ? lines[0].trim() : null;
      
      // Extract links (PDF parsing doesn't always get hyperlinks, but we try)
      const links = extractLinksFromText(text);
      
      return {
        text,
        title: potentialTitle,
        links
      };
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Error removing temp PDF file:', err);
      }
    }
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse a DOCX Buffer to extract text content
 */
async function parseDocx(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    
    // Try to extract a title from the first few lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const potentialTitle = lines.length > 0 ? lines[0].trim() : null;
    
    // Extract links
    const links = extractLinksFromText(text);
    
    return {
      text,
      title: potentialTitle,
      links
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

/**
 * Extract links from text content
 */
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

/**
 * Save a Buffer to a temporary file
 */
async function saveTempFile(buffer: Buffer, extension: string): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = `${uuidv4()}${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    });
  });
}

/**
 * Parse a document buffer based on file type
 */
export async function parseDocument(buffer: Buffer, filename: string): Promise<DocumentParseResult> {
  const extension = path.extname(filename).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return processPdf(buffer);
    case '.docx':
    case '.doc':
      return parseDocx(buffer);
    default:
      // For plain text or HTML, just convert the buffer to string
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const potentialTitle = lines.length > 0 ? lines[0].trim() : null;
      const links = extractLinksFromText(text);
      
      return {
        text,
        title: potentialTitle,
        links
      };
  }
}