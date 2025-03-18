import fetch from 'node-fetch';

interface LinkStatus {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

interface LinkCheckResult {
  links: LinkStatus[];
  totalLinks: number;
  brokenLinks: number;
  workingLinks: number;
}

/**
 * Extracts all URLs from content, including those in HTML anchor tags
 */
export function extractLinks(content: string): string[] {
  const allLinks: string[] = [];
  const uniqueUrls: Record<string, boolean> = {};
  
  // APPROACH 1: Extract links from href attributes in anchor tags
  const hrefRegex = /<a\s+[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  let hrefMatch;
  
  while ((hrefMatch = hrefRegex.exec(content)) !== null) {
    if (hrefMatch && hrefMatch[2]) {
      const href = hrefMatch[2].trim();
      
      if (href.match(/^https?:\/\//i)) {
        const cleanUrl = href.replace(/[.,;:!?)]$/, '');
        allLinks.push(cleanUrl);
      }
    }
  }
  
  // APPROACH 2: Extract standalone URLs using a general pattern
  const urlRegex = /(https?:\/\/[^\s\)\"<>]+)/g;
  let urlMatch;
  
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1].trim();
      const cleanUrl = url.replace(/[.,;:!?)]$/, '');
      allLinks.push(cleanUrl);
    }
  }
  
  // Remove duplicates
  return allLinks.filter(url => {
    if (!uniqueUrls[url]) {
      uniqueUrls[url] = true;
      return true;
    }
    return false;
  });
}

/**
 * Checks the status of a single URL
 */
async function checkLinkStatus(url: string): Promise<LinkStatus> {
  try {
    // Handle URLs with trailing punctuation or parentheses
    const cleanUrl = url.replace(/[.,;:!?)]$/, '');
    
    // Set up AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(cleanUrl, {
      method: 'HEAD', // Using HEAD request to avoid downloading entire content
      redirect: 'follow', // Follow redirects
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 Content-Evaluation-Tool'
      }
    });
    
    clearTimeout(timeoutId);

    return {
      url: cleanUrl,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    // Handle network errors and timeouts
    return {
      url,
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks all links in the content and returns their status
 */
export async function checkLinks(content: string): Promise<LinkCheckResult> {
  // Extract links from content
  const links = extractLinks(content);
  
  // Check each link (with concurrency limit to avoid overwhelming servers)
  const MAX_CONCURRENT = 5;
  const results: LinkStatus[] = [];
  
  // Check links in batches to control concurrency
  for (let i = 0; i < links.length; i += MAX_CONCURRENT) {
    const batch = links.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(link => checkLinkStatus(link))
    );
    results.push(...batchResults);
  }

  // Calculate summary stats
  const brokenLinks = results.filter(link => !link.ok).length;
  const workingLinks = results.length - brokenLinks;
  
  return {
    links: results,
    totalLinks: results.length,
    brokenLinks,
    workingLinks
  };
}