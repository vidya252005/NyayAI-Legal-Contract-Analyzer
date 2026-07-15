import { extractPdfText } from './pdf-parser';
import { extractDocxText } from './docx-parser';

export async function parseContractFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await extractPdfText(file);
  } else if (fileName.endsWith('.docx')) {
    return await extractDocxText(file);
  } else if (fileName.endsWith('.txt')) {
    return await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload a .pdf, .docx, or .txt file.');
  }
}
