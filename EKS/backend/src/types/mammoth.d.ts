declare module 'mammoth' {
  interface MammothOptions {
    buffer?: Buffer;
    path?: string;
  }

  interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
  export function convertToHtml(options: MammothOptions): Promise<MammothResult>;
}
