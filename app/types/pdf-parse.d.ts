declare module 'pdf-parse' {
  function PDFParse(dataBuffer: Buffer): Promise<{ text: string }>;
  export = PDFParse;
} 