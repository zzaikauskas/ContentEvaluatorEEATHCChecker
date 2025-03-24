import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';
import { JSDOM } from 'jsdom';

export interface DocumentParseResult {
  text: string;
  title: string | null;
  links: string[];
}

/**
 * Extract text between Meta Title and Meta Description without regex /s flag
 */
function extractBetweenTitleAndDescription(text: string): string | null {
  // Find the position of "Meta Title:" (case insensitive)
  const titlePos = text.search(/Meta\s+Title\s*:/i);
  if (titlePos === -1) return null;
  
  // Find the position of "Meta Description:" after the title position
  const descPos = text.substring(titlePos).search(/Meta\s+Description\s*:/i);
  
  // If both positions are found, extract the text between them
  if (descPos !== -1) {
    // Get the position after "Meta Title:"
    const titleEndPos = text.substring(titlePos).search(/:/i) + titlePos + 1;
    
    // Extract text between the end of title tag and start of description tag
    const extractedText = text.substring(
      titleEndPos, 
      titlePos + descPos
    ).trim();
    
    return extractedText;
  }
  
  return null;
}

/**
 * Extract a title from PDF content using more advanced heuristics
 */
function extractPdfTitle(text: string): string | null {
  if (!text || !text.trim()) return null;
  
  // Split into lines and remove empty ones
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return null;
  
  // Strategy 1: Look for a line that contains "title:" (case insensitive)
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const titleMatch = lines[i].match(/title\s*:?\s*(.*)/i);
    if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 3) {
      const extractedTitle = titleMatch[1].trim();
      console.log("Title extracted from PDF title keyword:", extractedTitle);
      return extractedTitle;
    }
  }
  
  // Strategy 2: First line if it's relatively short (likely a title) 
  // and doesn't look like a header/page number/disclaimer
  const firstLine = lines[0].trim();
  if (firstLine.length > 5 && firstLine.length < 100 && 
      !firstLine.match(/^(page|[0-9]+|disclaimer|confidential|draft|copyright)/i)) {
    console.log("Title extracted from PDF first line:", firstLine);
    return firstLine;
  }
  
  // Strategy 3: Look for a line that's significantly shorter than average
  // (typically titles are shorter than body text)
  const avgLineLength = lines.slice(0, 20).reduce((sum, line) => sum + line.length, 0) / Math.min(20, lines.length);
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 10 && line.length < avgLineLength * 0.6 && 
        line.length < 100 && !line.match(/^(page|[0-9]+|disclaimer|confidential|draft|copyright)/i)) {
      console.log("Title extracted from PDF short line:", line);
      return line;
    }
  }
  
  // Strategy 4: Just use the first line if all else fails
  if (firstLine.length > 0) {
    console.log("Title extracted from PDF fallback to first line:", firstLine);
    return firstLine;
  }
  
  return null;
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
      
      // Extract title using better heuristics
      const potentialTitle = extractPdfTitle(text);
      
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
      
      // Extract title using better heuristics
      const potentialTitle = extractPdfTitle(text);
      
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
 * Extract a title from DOCX content using more advanced heuristics
 */
function extractDocxTitle(text: string): string | null {
  if (!text || !text.trim()) return null;
  
  // Split into lines and remove empty ones
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return null;
  
  // Strategy 1: Look for a line that contains "title:" (case insensitive)
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const titleMatch = lines[i].match(/title\s*:?\s*(.*)/i);
    if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 3) {
      const extractedTitle = titleMatch[1].trim();
      console.log("Title extracted from DOCX title keyword:", extractedTitle);
      return extractedTitle;
    }
  }
  
  // Strategy 2: First line if it's reasonably short and doesn't look like a header
  const firstLine = lines[0].trim();
  if (firstLine.length > 5 && firstLine.length < 100 && 
      !firstLine.match(/^(page|[0-9]+|disclaimer|confidential|draft|copyright)/i)) {
    console.log("Title extracted from DOCX first line:", firstLine);
    return firstLine;
  }
  
  // Strategy 3: If the first line is very short and the second line is longer,
  // the first line might be a title, and the second line might be a subtitle or author
  if (lines.length > 1) {
    const firstLine = lines[0].trim();
    const secondLine = lines[1].trim();
    if (firstLine.length > 3 && firstLine.length < 60 && secondLine.length > firstLine.length) {
      console.log("Title extracted from DOCX first short line:", firstLine);
      return firstLine;
    }
  }
  
  // Strategy 4: Just use the first line if all else fails
  if (firstLine.length > 0) {
    console.log("Title extracted from DOCX fallback to first line:", firstLine);
    return firstLine;
  }
  
  return null;
}

/**
 * Parse a DOCX Buffer to extract text content
 */
async function parseDocx(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    
    // Extract title using better heuristics
    const potentialTitle = extractDocxTitle(text);
    
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
 * Specialized HTML link parser for better extraction from HTML documents
 * Supports various HTML attribute formats, embedded links, and different quote styles
 */
function parseHtmlForLinks(html: string): string[] {
  const links: string[] = [];
  const uniqueUrls: Record<string, boolean> = {};
  
  // Pattern 1: Standard anchor tag with href attribute
  // This captures even complex HTML with multiple attributes and nested content
  const anchorTagPattern = /<a\s+[^>]*?href\s*=\s*(["'])(.*?)\1[^>]*?>[\s\S]*?<\/a>/gi;
  let anchorMatch;
  
  while ((anchorMatch = anchorTagPattern.exec(html)) !== null) {
    if (anchorMatch && anchorMatch[2]) {
      const href = anchorMatch[2].trim();
      
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        if (!uniqueUrls[normalizedUrl]) {
          uniqueUrls[normalizedUrl] = true;
          links.push(normalizedUrl);
        }
      }
      else if (href.startsWith('/') && !href.startsWith('//')) {
        if (!uniqueUrls[href]) {
          uniqueUrls[href] = true;
          links.push(href);
        }
      }
    }
  }
  
  // Additional Pattern: Capture links from <link> tags
  const linkTagPattern = /<link\s+[^>]*?href\s*=\s*(["'])(.*?)\1[^>]*?>/gi;
  let linkTagMatch;
  
  while ((linkTagMatch = linkTagPattern.exec(html)) !== null) {
    if (linkTagMatch && linkTagMatch[2]) {
      const href = linkTagMatch[2].trim();
      
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        if (!uniqueUrls[normalizedUrl]) {
          uniqueUrls[normalizedUrl] = true;
          links.push(normalizedUrl);
        }
      }
    }
  }
  
  // Pattern 2: Alternative pattern for unquoted URLs (less common but still valid HTML)
  const unquotedHrefPattern = /<a\s+[^>]*?href\s*=\s*([^\s"'>]+)[^>]*?>/gi;
  let unquotedMatch;
  
  while ((unquotedMatch = unquotedHrefPattern.exec(html)) !== null) {
    if (unquotedMatch && unquotedMatch[1]) {
      const href = unquotedMatch[1].trim();
      
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        if (!uniqueUrls[normalizedUrl]) {
          uniqueUrls[normalizedUrl] = true;
          links.push(normalizedUrl);
        }
      }
      else if (href.startsWith('/') && !href.startsWith('//')) {
        if (!uniqueUrls[href]) {
          uniqueUrls[href] = true;
          links.push(href);
        }
      }
    }
  }
  
  // Pattern 3: Find URLs directly in text outside of anchor tags (as a fallback)
  const urlPattern = /(https?:\/\/[^\s()<>]+(?:\([^\s()<>]+\)|([^\s()<>]+))+)/gi;
  let urlMatch;
  
  while ((urlMatch = urlPattern.exec(html)) !== null) {
    if (urlMatch && urlMatch[0]) {
      const url = urlMatch[0].trim();
      if (!uniqueUrls[url]) {
        uniqueUrls[url] = true;
        links.push(url);
      }
    }
  }
  
  // Meta tag content links
  const metaPattern = /<meta\s+[^>]*?(?:content|property|og:url)\s*=\s*(["'])(https?:\/\/.*?)\1[^>]*?>/gi;
  let metaMatch;
  
  while ((metaMatch = metaPattern.exec(html)) !== null) {
    if (metaMatch && metaMatch[2]) {
      const url = metaMatch[2].trim();
      if (!uniqueUrls[url]) {
        uniqueUrls[url] = true;
        links.push(url);
      }
    }
  }
  
  // Final cleanup: Remove trailing punctuation and brackets
  return links.map(url => url.replace(/[,.!?;:'")\]]+$/, '').trim());
}

/**
 * Extract links from text content
 */
function extractLinksFromText(text: string): string[] {
  const urls: string[] = [];
  
  // APPROACH 1: Extract href attributes from anchor tags with improved pattern
  // This new pattern specifically targets the href attribute within anchor tags,
  // handling various attribute formats and quoted/unquoted values
  // It's specifically designed to capture href values in common HTML patterns
  const anchorPattern = /<a\s+(?:[^>]*?\s+)?href\s*=\s*(["'])(.*?)\1.*?>.*?<\/a>/gi;
  let anchorMatch;
  while ((anchorMatch = anchorPattern.exec(text)) !== null) {
    if (anchorMatch && anchorMatch[2]) {
      const href = anchorMatch[2].trim();
      
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
  
  // APPROACH 2: Extract any href attributes with an alternative pattern that's less strict
  // This will catch cases where href attributes might not strictly follow the pattern above
  // For example, unusual attribute ordering, unquoted URLs, etc.
  const hrefPattern = /<a\s+[^>]*?href\s*=\s*(?:["']([^"']*)["']|([^\s>]*))[^>]*?>/gi;
  let hrefMatch;
  while ((hrefMatch = hrefPattern.exec(text)) !== null) {
    // URL could be in group 1 (quoted) or group 2 (unquoted)
    const href = (hrefMatch[1] || hrefMatch[2] || '').trim();
    
    if (href && href.length > 1) { // Avoid empty or single char hrefs
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        urls.push(normalizedUrl);
      }
      else if (href.startsWith('/') && !href.startsWith('//')) {
        urls.push(href);
      }
    }
  }
  
  // APPROACH 3: Extract any remaining href attributes that might not be in valid anchor tags
  const standaloneHrefPattern = /href\s*=\s*(["'])(.*?)\1/gi;
  let standaloneMatch;
  while ((standaloneMatch = standaloneHrefPattern.exec(text)) !== null) {
    if (standaloneMatch && standaloneMatch[2]) {
      const href = standaloneMatch[2].trim();
      
      if (href.match(/^(https?:\/\/|www\.)/i)) {
        const normalizedUrl = href.startsWith('www.') ? `http://${href}` : href;
        urls.push(normalizedUrl);
      }
      else if (href.startsWith('/') && !href.startsWith('//')) {
        urls.push(href);
      }
    }
  }
  
  // APPROACH 4: Find URLs directly in text
  const urlPattern = /(https?:\/\/[^\s()<>]+(?:\([^\s()<>]+\)|([^\s()<>]+))+)/gi;
  let urlMatch;
  while ((urlMatch = urlPattern.exec(text)) !== null) {
    if (urlMatch && urlMatch[0]) {
      urls.push(urlMatch[0]);
    }
  }
  
  // APPROACH 5: Find www URLs without protocol
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
      
      // Try to extract title from HTML head - using a broader regex to catch more title tag variations
      let htmlTitle = null;
      const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        // Clean up the title - remove excess whitespace, newlines, and decode HTML entities
        htmlTitle = titleMatch[1]
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        
        console.log("Title extracted from HTML tag:", htmlTitle);
      } else {
        console.log("No title tag found in HTML");
      }
      
      // If no title found in head, check for Open Graph title
      if (!htmlTitle) {
        const ogTitleMatch = htmlText.match(/<meta\s+[^>]*?property\s*=\s*["']og:title["']\s+[^>]*?content\s*=\s*["'](.*?)["'][^>]*?>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          htmlTitle = ogTitleMatch[1].trim();
          console.log("Title extracted from Open Graph meta tag:", htmlTitle);
        }
      }
      
      // Check for Meta title pattern in content - this can appear in various forms
      if (!htmlTitle) {
        // Extract the text between Meta Title and Meta Description using our helper function
        const extractedMetaTitle = extractBetweenTitleAndDescription(htmlText);
        
        if (extractedMetaTitle) {
          htmlTitle = extractedMetaTitle
            .replace(/<[^>]*>/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ');
          
          console.log("Title extracted from Meta Title-Description pattern:", htmlTitle);
        }
        
        // If that fails, look for the exact pattern "Meta title:" followed by text
        if (!htmlTitle) {
          const exactMetaTitlePattern = /Meta\s+[tT]itle\s*:([^.!?\r\n<]+)/i;
          const exactMetaTitleMatch = htmlText.match(exactMetaTitlePattern);
          
          if (exactMetaTitleMatch && exactMetaTitleMatch[1]) {
            htmlTitle = exactMetaTitleMatch[1]
              .replace(/<[^>]*>/g, '')
              .trim()
              .replace(/\s+/g, ' ')
              .replace(/&nbsp;/g, ' ');
            
            console.log("Title extracted from exact Meta title: pattern:", htmlTitle);
          }
        }
        
        // If regex-based extraction fails, try with DOM parser with a simpler approach
        if (!htmlTitle) {
          try {
            const dom = new JSDOM(htmlText);
            const body = dom.window.document.body;
            
            // Extract the entire text content
            if (body) {
              const bodyText = body.textContent || '';
              // Now try to find "Meta title:" in the text content
              const metaTitleMatch = bodyText.match(/Meta\s+title\s*:([^.!?\r\n<]+)/i);
              
              if (metaTitleMatch && metaTitleMatch[1]) {
                htmlTitle = metaTitleMatch[1].trim().replace(/\s+/g, ' ');
                console.log("Title extracted from DOM-based Meta title search:", htmlTitle);
              }
            }
          } catch (error) {
            console.error("DOM-based title extraction failed:", error);
          }
        }
        
        // If no match, try stronger, more specific Meta title pattern
        if (!htmlTitle) {
          const metaTitlePattern = /(?:meta|page|post)\s+title\s*:?\s*(.*?)(?:[\r\n]|<\/|(?:meta|page)\s+description|$)/i;
          const metaTitleMatch = htmlText.match(metaTitlePattern);
          
          if (metaTitleMatch && metaTitleMatch[1]) {
            htmlTitle = metaTitleMatch[1]
              .replace(/<[^>]*>/g, '')
              .trim()
              .replace(/\s+/g, ' ');
            
            console.log("Title extracted from Meta title pattern:", htmlTitle);
          }
        }
        
        // If that doesn't work, try looser pattern that's just looking for title: anywhere in text
        if (!htmlTitle) {
          const looseTitlePattern = /(?:^|\n|\r|>)\s*title\s*:?\s*(.*?)(?:[.!?]|$|\n|\r|<)/i;
          const looseTitleMatch = htmlText.match(looseTitlePattern);
          
          if (looseTitleMatch && looseTitleMatch[1]) {
            htmlTitle = looseTitleMatch[1]
              .replace(/<[^>]*>/g, '')
              .trim()
              .replace(/\s+/g, ' ');
            
            console.log("Title extracted from loose title pattern:", htmlTitle);
          }
        }
      }
      
      // If still no title, try DOM-based heading extraction
      if (!htmlTitle) {
        try {
          // If we don't already have a DOM instance
          const dom = new JSDOM(htmlText);
          const document = dom.window.document;
          
          // Try H1 first
          const h1 = document.querySelector('h1');
          if (h1 && h1.textContent) {
            htmlTitle = h1.textContent.trim().replace(/\s+/g, ' ');
            console.log("Title extracted from H1 tag:", htmlTitle);
          } 
          // Then try H2 if no H1
          else {
            const h2 = document.querySelector('h2');
            if (h2 && h2.textContent) {
              htmlTitle = h2.textContent.trim().replace(/\s+/g, ' ');
              console.log("Title extracted from H2 tag:", htmlTitle);
            }
          }
          
          // If that fails, try the first strong/b tag near the top of the page
          if (!htmlTitle) {
            const boldElements = document.querySelectorAll('strong, b');
            if (boldElements.length > 0) {
              // Only use the first bold element if it's in the first 10% of the content
              const firstBold = boldElements[0];
              const documentHeight = document.body.textContent?.length || 0;
              
              // Rough estimate of element position in document
              if (documentHeight > 0 && firstBold.textContent) {
                const boldText = firstBold.textContent.trim();
                // Only use if it's reasonably long but not too long
                if (boldText.length > 5 && boldText.length < 100) {
                  htmlTitle = boldText;
                  console.log("Title extracted from first bold element:", htmlTitle);
                }
              }
            }
          }
        } catch (error) {
          console.error("DOM-based heading extraction failed:", error);
        }
        
        // Fallback to regex-based extraction if DOM approach failed
        if (!htmlTitle) {
          const headingMatch = htmlText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (headingMatch && headingMatch[1]) {
            // Clean up HTML tags from inside the heading
            htmlTitle = headingMatch[1]
              .replace(/<[^>]*>/g, '')
              .trim()
              .replace(/\s+/g, ' ');
            
            console.log("Title extracted from H1 tag (regex):", htmlTitle);
          } else {
            const h2Match = htmlText.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
            if (h2Match && h2Match[1]) {
              htmlTitle = h2Match[1]
                .replace(/<[^>]*>/g, '')
                .trim()
                .replace(/\s+/g, ' ');
              
              console.log("Title extracted from H2 tag (regex):", htmlTitle);
            }
          }
        }
      }
      
      // Extract body content for analysis, not just raw HTML
      let bodyContent = htmlText;
      
      // Try to get just the body content for better analysis
      const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        bodyContent = bodyMatch[1];
      }
      
      // Remove script and style tags to clean up content
      bodyContent = bodyContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      // Enhanced HTML link extraction
      const htmlLinks = parseHtmlForLinks(htmlText);
      
      return {
        text: bodyContent,
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