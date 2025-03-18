declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: any;
    };
    metadata: any;
    version: string;
  }
  
  function pdfParse(buffer: Buffer, options?: {
    pagerender?: (pageData: any) => string;
    max?: number;
  }): Promise<PDFData>;
  
  export = pdfParse;
}