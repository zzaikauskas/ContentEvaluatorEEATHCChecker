import fs from 'fs';
import path from 'path';

// Intercept filesystem calls to provide a mock for the test file
const originalReadFileSync = fs.readFileSync;

// Using 'any' to bypass TypeScript's strict type checking for this monkey patch
(fs.readFileSync as any) = function(filepath: fs.PathOrFileDescriptor, options?: any) {
  if (filepath === './test/data/05-versions-space.pdf') {
    // Return a minimal valid PDF buffer
    return Buffer.from(
      '%PDF-1.3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf 100 700 Td (Test PDF) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n0000000171 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n243\n%%EOF\n'
    );
  }
  return originalReadFileSync(filepath, options);
};

// Now import pdf-parse
import pdfParse from 'pdf-parse';

export default pdfParse;