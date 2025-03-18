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
  // More comprehensive URL regex patterns
  const patterns = [
    // Standard http/https URLs
    /(https?:\/\/[^\s()<>]+(?:\([^\s()<>]+\)|([^'\s()<>]+)+)?)/gi,
    
    // HTML href links - captures URLs within href attributes with various formats
    /href\s*=\s*["']([^"']+)["']/gi,
    
    // URL in text with www but no protocol
    /(www\.[^\s()<>]+(?:\([^\s()<>]+\)|([^'\s()<>]+)+)?)/gi,
    
    // Additional pattern for markdown links [text](url)
    /\[([^\]]+)\]\(([^)]+)\)/gi
  ];
  
  // For HTML content specifically, try to extract links from anchor tags
  // Handle both double and single quotes in href attributes
  const anchorTagPatterns = [
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*)?>(.*?)<\/a>/gi,  // Double quotes
    /<a\s+(?:[^>]*?\s+)?href='([^']*)'(?:\s+[^>]*)?>(.*?)<\/a>/gi   // Single quotes
  ];
  
  const urls: string[] = [];
  
  // Process each standard URL pattern
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Different patterns have the URL in different capture groups
      // For href and markdown, it's in capture group 1, standard URLs it's in group 0
      const url = match[1] || match[2] || match[0];
      
      // Add if it looks like a URL (has protocol or www)
      if (url.match(/^(https?:\/\/|www\.)/i)) {
        // Normalize URLs starting with www to have http:// prefix
        const normalizedUrl = url.startsWith('www.') ? `http://${url}` : url;
        urls.push(normalizedUrl);
      }
    }
  });
  
  // Process HTML anchor tags specifically (handles complex HTML with attributes)
  // Loop through each pattern for different quote styles
  anchorTagPatterns.forEach(pattern => {
    let anchorMatch;
    while ((anchorMatch = pattern.exec(text)) !== null) {
      if (anchorMatch && anchorMatch[1]) {
        const href = anchorMatch[1].trim();
        
        // Add URLs that begin with http/https or www
        if (href.match(/^(https?:\/\/|www\.)/i)) {
          // Normalize URLs starting with www to have http:// prefix
          const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
          urls.push(normalizedUrl);
        }
        // Also add absolute paths from the same domain
        else if (href.startsWith('/') && !href.startsWith('//')) {
          // For domain-relative URLs starting with a single slash, we'll include them too
          urls.push(href);
        }
      }
    }
  });
  
  // Clean up URLs - remove trailing punctuation and closing brackets
  const cleanedUrls = urls.map(url => 
    url.replace(/[,.!?;:'")\]]+$/, '').trim()
  );
  
  // Remove duplicates and empty URLs using an object as a map
  const uniqueUrls: Record<string, boolean> = {};
  const result: string[] = [];
  
  for (const url of cleanedUrls) {
    if (url.length > 0 && !uniqueUrls[url]) {
      uniqueUrls[url] = true;
      result.push(url);
    }
  }
  
  return result;
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
    case '.html':
    case '.htm':
      // Special handling for HTML files to better extract links and title
      const htmlText = buffer.toString('utf-8');
      
      // Try to extract title from HTML head
      let htmlTitle = null;
      const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        htmlTitle = titleMatch[1].trim();
      }
      
      // If no title found in head, fall back to first heading
      if (!htmlTitle) {
        const headingMatch = htmlText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (headingMatch && headingMatch[1]) {
          htmlTitle = headingMatch[1].trim();
        }
      }
      
      // Extract links with our enhanced function
      const htmlLinks = extractLinksFromText(htmlText);
      
      return {
        text: htmlText,
        title: htmlTitle,
        links: htmlLinks
      };
    default:
      // For plain text or other file types, just convert the buffer to string
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