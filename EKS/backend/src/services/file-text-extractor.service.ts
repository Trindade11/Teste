import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

const DOCX_PYTHON_SCRIPT = `
import zipfile
import re
import sys
import chardet

file_path = sys.argv[1]

with zipfile.ZipFile(file_path, 'r') as z:
    xml_bytes = z.read('word/document.xml')
    
    # Detect encoding
    detected = chardet.detect(xml_bytes)
    encoding = detected['encoding'] or 'utf-8'
    confidence = detected['confidence'] or 0
    
    # Try detected encoding first, fallback to utf-8
    try:
        xml = xml_bytes.decode(encoding)
    except (UnicodeDecodeError, LookupError):
        try:
            xml = xml_bytes.decode('utf-8')
        except UnicodeDecodeError:
            xml = xml_bytes.decode('utf-8', errors='replace')

xml = re.sub(r'</w:p>', '\\n', xml)
xml = re.sub(r'<[^>]+>', ' ', xml)
text = re.sub(r'\\s+', ' ', xml).strip()

print(text, end='')
`;

export class FileTextExtractorService {
  async extract(file: Express.Multer.File): Promise<string> {
    const extension = path.extname(file.originalname || '').toLowerCase();

    try {
      if (extension === '.docx') {
        // Try mammoth.js first (Node.js native - better encoding support)
        const docxText = await this.extractDocxWithMammoth(file.buffer);
        if (docxText && docxText.length > 30) {
          logger.info('Extracted text with mammoth.js', { 
            fileName: file.originalname,
            length: docxText.length,
            hasEncodingIssues: /[]/.test(docxText)
          });
          return docxText;
        }

        // Fallback to Python with chardet
        const pythonText = await this.extractDocxText(file.buffer);
        if (pythonText && pythonText.length > 30) {
          logger.info('Extracted text with Python fallback', { 
            fileName: file.originalname,
            length: pythonText.length,
            hasEncodingIssues: /[]/.test(pythonText)
          });
          return pythonText;
        }
      }

      // For non-DOCX files, try multiple encodings
      const text = this.extractTextWithMultipleEncodings(file.buffer);
      logger.info('Extracted text with encoding detection', { 
        fileName: file.originalname,
        length: text.length,
        hasEncodingIssues: /[]/.test(text)
      });
      return text;
    } catch (error) {
      logger.warn('Failed to extract text with specialized parser, using utf-8 fallback', {
        fileName: file.originalname,
        extension,
        error: error instanceof Error ? error.message : String(error),
      });
      return file.buffer.toString('utf-8');
    }
  }

  private extractTextWithMultipleEncodings(buffer: Buffer): string {
    // Try UTF-8 first
    try {
      const text = buffer.toString('utf-8');
      if (!/[]/.test(text)) {
        return text;
      }
    } catch {}

    // Try Latin-1 (ISO-8859-1)
    try {
      const text = buffer.toString('latin1');
      if (!/[]/.test(text)) {
        return text;
      }
    } catch {}

    // Try binary then convert to UTF-8
    try {
      const binary = buffer.toString('binary');
      const text = Buffer.from(binary, 'binary').toString('utf-8');
      if (!/[]/.test(text)) {
        return text;
      }
    } catch {}

    // Last resort: UTF-8 with replacement
    return buffer.toString('utf-8', { fatal: false } as any);
  }

  private async extractDocxWithMammoth(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import of mammoth
      const mammoth = await import('mammoth');
      
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.warn('Mammoth.js not available, falling back to Python', {
        error: error instanceof Error ? error.message : String(error),
      });
      return '';
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eks-docx-'));
    const filePath = path.join(tempDir, 'document.docx');

    try {
      await fs.writeFile(filePath, buffer);

      const pythonCandidates = ['python', 'python3'];
      for (const pyCmd of pythonCandidates) {
        try {
          const { stdout } = await execFileAsync(pyCmd, ['-c', DOCX_PYTHON_SCRIPT, filePath], {
            maxBuffer: 20 * 1024 * 1024,
          });

          const text = stdout?.trim();
          if (text) {
            return text;
          }
        } catch {
          // try next python command
        }
      }

      throw new Error('No working python command found to parse .docx');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
