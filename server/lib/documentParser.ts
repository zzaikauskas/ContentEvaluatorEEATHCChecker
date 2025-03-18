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
  const urls: string[] = [];
  
  // APPROACH 1: Extract href attributes from anchor tags
  // This pattern prioritizes finding href attributes within anchor tags (<a>) but with flexible matching
  // Supports unquoted attributes and malformed HTML
  const anchorPattern = /<a[\s\S]*?href\s*=\s*(["']?)([^"'>\s]+)\1[\s\S]*?>[\s\S]*?<\/a>|<a[\s\S]*?href\s*=\s*(["'])(.*?)\3[\s\S]*?>[\s\S]*?<\/a>/gi;
  let anchorMatch;
  while ((anchorMatch = anchorPattern.exec(text)) !== null) {
    // Match could be in group 2 (unquoted or single-quoted) or group 4 (quoted)
    const href = (anchorMatch[2] || anchorMatch[4] || '').trim();
    
    if (href) {
      // Only add fully qualified URLs
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        urls.push(normalizedUrl);
      }
      // Add domain-relative URLs
      else if (href.startsWith('/') && !href.startsWith('//')) {
        urls.push(href);
      }
    }
  }
  
  // APPROACH 2: Extract any remaining href attributes that might not be in valid anchor tags
  const hrefPattern = /href\s*=\s*(["'])(.*?)\1/gi;
  let hrefMatch;
  while ((hrefMatch = hrefPattern.exec(text)) !== null) {
    if (hrefMatch && hrefMatch[2]) {
      const href = hrefMatch[2].trim();
      
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        urls.push(normalizedUrl);
      }
      else if (href.startsWith('/') && !href.startsWith('//')) {
        urls.push(href);
      }
    }
  }
  
  // APPROACH 3: Find URLs directly in text
  const urlPattern = /(https?:\/\/[^\s()<>]+(?:\([^\s()<>]+\)|([^\s()<>]+))+)/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(text)) !== null) {
    if (urlMatch && urlMatch[0]) {
      urls.push(urlMatch[0]);
    }
  }
  
  // APPROACH 4: Find www URLs without protocol
  const wwwPattern = /(www\.[^\s()<>]+(?:\([^\s()<>]+\)|([^\s()<>]+))+)/gi;
  let wwwMatch;
  while ((wwwMatch = wwwPattern.exec(text)) !== null) {
    if (wwwMatch && wwwMatch[0]) {
      urls.push(`http://${wwwMatch[0]}`);
    }
  }
  
  // Clean up URLs - remove trailing punctuation and closing brackets
  const cleanedUrls = urls.map(url => 
    url.replace(/[,.!?;:'")\]]+$/, '').trim()
  );
  
  // Remove duplicates and empty URLs
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
      
      // For HTML content, we'll add an additional special case search 
      // specifically for <a href="..."> tags
      const directAnchorTagMatches: string[] = [];
      const anchorTagRegex = /<a\s+[^>]*href\s*=\s*(['"])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi;
      let directMatch;
      
      while ((directMatch = anchorTagRegex.exec(htmlText)) !== null) {
        if (directMatch && directMatch[2]) {
          const href = directMatch[2].trim();
          
          if (href.match(/^(https?:\/\/|www\.)/i)) {
            const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
            directAnchorTagMatches.push(normalizedUrl);
          }
          else if (href.startsWith('/') && !href.startsWith('//')) {
            directAnchorTagMatches.push(href);
          }
        }
      }
      
      // Also extract with our general function
      const generalLinks = extractLinksFromText(htmlText);
      
      // Combine both approaches, removing duplicates
      const uniqueLinksMap: Record<string, boolean> = {};
      const combinedLinks: string[] = [];
      
      [...directAnchorTagMatches, ...generalLinks].forEach(url => {
        if (!uniqueLinksMap[url]) {
          uniqueLinksMap[url] = true;
          combinedLinks.push(url);
        }
      });
      
      return {
        text: htmlText,
        title: htmlTitle,
        links: combinedLinks
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