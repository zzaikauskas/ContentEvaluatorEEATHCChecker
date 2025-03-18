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
  let tempFilePath: string | null = null;
  
  try {
    // First try to parse directly with pdf-parse
    try {
      // Use dynamic import for pdf-parse
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      
      const data = await pdfParse(buffer);
      
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
    } catch (directParseError) {
      console.log('Direct PDF parsing failed, trying with temp file:', directParseError);
      
      // If direct parsing fails, try with temp file approach
      tempFilePath = await saveTempFile(buffer, '.pdf');
      
      // Use dynamic import for pdf-parse
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      
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
    }
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // If all parsing methods fail, try to extract text using a basic binary-to-text fallback
    // This is a last resort when pdf-parse fails completely
    try {
      console.log('Attempting basic text extraction as fallback');
      const text = buffer.toString('utf8').replace(/[\x00-\x1F\x7F-\xFF]/g, '') || 'Unable to extract text content';
      
      return {
        text: `Note: PDF parsing failed, limited text extracted. ${text.substring(0, 1000)}...`,
        title: 'PDF Parsing Failed',
        links: []
      };
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
    }
  } finally {
    // Clean up temp file if it was created
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Error removing temp PDF file:', err);
      }
    }
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
    
    // If mammoth fails, try to extract some text directly
    try {
      console.log('Attempting basic text extraction as fallback for DOCX');
      const text = buffer.toString('utf8').replace(/[\x00-\x1F\x7F-\xFF]/g, '') || 'Unable to extract text content';
      
      return {
        text: `Note: DOCX parsing failed, limited text extracted. ${text.substring(0, 1000)}...`,
        title: 'DOCX Parsing Failed',
        links: []
      };
    } catch (fallbackError) {
      console.error('Fallback extraction also failed for DOCX:', fallbackError);
      throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : String(error)}`);
    }
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