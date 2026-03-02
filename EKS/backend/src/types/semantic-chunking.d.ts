declare module 'semantic-chunking' {
  export function chunkit(documents: any[], options?: any): Promise<any[]>;
  export function cramit(documents: any[], options?: any): Promise<any[]>;
  export function sentenceit(documents: any[], options?: any): Promise<any[]>;
}
