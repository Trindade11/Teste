import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

export interface DiscoveredPage {
  url: string;
  title: string;
  level: number;
}

export interface DiscoveredPdf {
  url: string;
  filename: string;
  sizeKb?: number;
}

export interface SitePreview {
  rootUrl: string;
  rootTitle: string;
  domain: string;
  pages: DiscoveredPage[];
  pdfs: DiscoveredPdf[];
  stats: {
    totalPages: number;
    totalPdfs: number;
    estimatedKb: number;
  };
}

export interface ScrapedPage {
  url: string;
  title: string;
  text: string;
  level: number;
  sizeKb: number;
}

export class WebScraperService {
  private readonly MAX_PAGES_PREVIEW = 80;
  private readonly TIMEOUT_MS = 20000;
  private readonly USER_AGENT =
    'EKS-Bot/1.0 (Enterprise Knowledge System; contact: admin@eks.internal)';

  private isPdfLink(url: string): boolean {
    if (!url) return false;

    try {
      const parsed = new URL(url);
      if (parsed.pathname.toLowerCase().endsWith('.pdf')) {
        return true;
      }
    } catch {
      // ignore parse failures and fallback to regex below
    }

    return /\.pdf(?:[?#]|$)/i.test(url);
  }

  getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  normalizeUrl(base: string, href: string): string | null {
    try {
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return null;
      }
      const normalized = new URL(href, base);
      normalized.hash = '';
      return normalized.href;
    } catch {
      return null;
    }
  }

  private async fetchHtml(url: string): Promise<{ html: string; sizeKb: number } | null> {
    try {
      const response = await axios.get<string>(url, {
        timeout: this.TIMEOUT_MS,
        headers: { 'User-Agent': this.USER_AGENT, Accept: 'text/html,*/*' },
        maxRedirects: 5,
        responseType: 'text',
        maxContentLength: 5 * 1024 * 1024, // 5MB cap per page
      });
      if (typeof response.data !== 'string') return null;
      const sizeKb = Math.round(Buffer.byteLength(response.data, 'utf8') / 1024);
      return { html: response.data, sizeKb };
    } catch (err: any) {
      logger.warn(`WebScraper: failed to fetch ${url}: ${err?.message || err}`);
      return null;
    }
  }

  async fetchPdfBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get<Buffer>(url, {
        timeout: this.TIMEOUT_MS,
        headers: { 'User-Agent': this.USER_AGENT },
        maxRedirects: 5,
        responseType: 'arraybuffer',
        maxContentLength: 20 * 1024 * 1024, // 20MB cap per PDF
      });
      return Buffer.from(response.data);
    } catch (err: any) {
      logger.warn(`WebScraper: failed to fetch PDF ${url}: ${err?.message || err}`);
      return null;
    }
  }

  extractTextFromHtml(html: string): string {
    const $ = cheerio.load(html);
    // Remove noise elements
    $('script, style, nav, footer, header, noscript, iframe, svg, canvas').remove();
    $('[role="navigation"], [role="banner"], [role="complementary"]').remove();
    $('.nav, .menu, .sidebar, .advertisement, .cookie-banner, .popup').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text;
  }

  extractTitle(html: string): string {
    const $ = cheerio.load(html);
    return (
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      ''
    );
  }

  extractLinks(
    html: string,
    baseUrl: string,
    domain: string
  ): { pages: string[]; pdfs: string[] } {
    const $ = cheerio.load(html);
    const pages = new Set<string>();
    const pdfs = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const normalized = this.normalizeUrl(baseUrl, href);
      if (!normalized) return;

      const linkType = (($(el).attr('type') || '') as string).toLowerCase();
      const linkTitle = (($(el).attr('title') || '') as string).toLowerCase();
      const linkText = ($(el).text() || '').toLowerCase();
      const anchorIndicatesPdf =
        linkType.includes('pdf') ||
        /\bpdf\b/.test(linkTitle) ||
        /\bpdf\b/.test(linkText);

      if (this.isPdfLink(normalized) || anchorIndicatesPdf) {
        pdfs.add(normalized);
        return;
      }

      const linkDomain = this.getDomain(normalized);
      if (linkDomain === domain) {
        pages.add(normalized);
      }
    });

    return { pages: Array.from(pages), pdfs: Array.from(pdfs) };
  }

  private async getPdfSizeKb(url: string): Promise<number | undefined> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: { 'User-Agent': this.USER_AGENT },
        maxRedirects: 3,
      });
      const contentLength = response.headers['content-length'];
      if (contentLength) {
        return Math.round(parseInt(contentLength, 10) / 1024);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  async previewSite(rootUrl: string, depth: number = 1): Promise<SitePreview> {
    const clampedDepth = Math.min(Math.max(depth, 0), 3);
    const domain = this.getDomain(rootUrl);
    const visited = new Set<string>();
    const pages: DiscoveredPage[] = [];
    const pdfsMap = new Map<string, DiscoveredPdf>();
    let totalEstimatedKb = 0;

    const queue: Array<{ url: string; level: number }> = [{ url: rootUrl, level: 0 }];

    let rootTitle = rootUrl;

    while (queue.length > 0 && pages.length < this.MAX_PAGES_PREVIEW) {
      const { url, level } = queue.shift()!;

      if (visited.has(url)) continue;
      visited.add(url);

      const result = await this.fetchHtml(url);
      if (!result) continue;

      const title = this.extractTitle(result.html) || url;
      if (level === 0) rootTitle = title;

      // Estimate page size based on extracted text instead of raw HTML for a more accurate representation of content size
      const text = this.extractTextFromHtml(result.html);
      const textKb = Math.round(Buffer.byteLength(text, 'utf8') / 1024);
      // Ensure minimum 1kb for visibility
      const pageKb = Math.max(1, textKb);

      pages.push({ url, title, level, sizeKb: pageKb } as DiscoveredPage & { sizeKb: number });
      totalEstimatedKb += pageKb;

      const { pages: childPages, pdfs } = this.extractLinks(result.html, url, domain);

      // Fetch PDF sizes concurrently (discover PDFs at every visited level)
      const newPdfs = pdfs.filter(pdf => !pdfsMap.has(pdf));
      if (newPdfs.length > 0) {
        await Promise.all(newPdfs.map(async (pdf) => {
          const sizeKb = await this.getPdfSizeKb(pdf);
          pdfsMap.set(pdf, {
            url: pdf,
            filename: decodeURIComponent(pdf.split('/').pop() || pdf),
            sizeKb
          });
          if (sizeKb) totalEstimatedKb += sizeKb;
        }));
      }

      if (level < clampedDepth) {
        for (const childUrl of childPages) {
          if (!visited.has(childUrl)) {
            queue.push({ url: childUrl, level: level + 1 });
          }
        }
      }
    }

    return {
      rootUrl,
      rootTitle,
      domain,
      pages,
      pdfs: Array.from(pdfsMap.values()),
      stats: {
        totalPages: pages.length,
        totalPdfs: pdfsMap.size,
        estimatedKb: totalEstimatedKb,
      },
    };
  }

  async scrapePage(url: string, level: number = 0): Promise<ScrapedPage | null> {
    const result = await this.fetchHtml(url);
    if (!result) return null;

    const title = this.extractTitle(result.html) || url;
    const text = this.extractTextFromHtml(result.html);
    const textKb = Math.max(1, Math.round(Buffer.byteLength(text, 'utf8') / 1024));

    return { url, title, text, level, sizeKb: textKb };
  }
}

export const webScraperService = new WebScraperService();
