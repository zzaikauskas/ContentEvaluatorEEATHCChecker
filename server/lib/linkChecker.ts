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
 * Extracts all URLs from content
 */
export function extractLinks(content: string): string[] {
  // Regular expression to match URLs
  // This regex looks for http/https links with common URL characters
  const urlRegex = /(https?:\/\/[^\s\)\"]+)/g;
  
  // Extract and deduplicate links
  const matches = content.match(urlRegex) || [];
  const uniqueLinks = Array.from(new Set(matches));
  
  return uniqueLinks;
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