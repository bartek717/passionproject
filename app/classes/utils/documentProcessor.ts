import { Buffer } from 'buffer';
import pdfjsLib from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromDocument(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  if (file.type === 'application/pdf') {
    return extractFromPDF(buffer);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    return extractFromWord(buffer);
  } else {
    throw new Error('Unsupported file type');
  }
}

async function extractFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdfjsLib(Buffer.from(buffer));
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractFromWord(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer
    });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to extract text from Word document');
  }
} 