import { readFile } from 'fs/promises';
import path from 'path';

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8001';

export class OcrServiceUnavailableError extends Error {
  constructor(cause) {
    super('OCR service is offline — try again, or enter this receipt manually.');
    this.cause = cause;
  }
}

/** Sends the saved receipt image to the Python OCR microservice (docs/03). */
export async function requestOcrParse(imagePath) {
  const bytes = await readFile(imagePath);
  const form = new FormData();
  form.append('image', new Blob([bytes]), path.basename(imagePath));

  let response;
  try {
    response = await fetch(`${OCR_SERVICE_URL}/parse`, { method: 'POST', body: form });
  } catch (err) {
    throw new OcrServiceUnavailableError(err);
  }

  if (!response.ok) {
    throw new OcrServiceUnavailableError(new Error(`OCR service returned ${response.status}`));
  }

  return response.json(); // { raw_text, items, note? }
}
