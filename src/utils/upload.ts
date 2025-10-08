import type { ReadableStream } from 'node:stream/web';
import { UploadOptions } from '../types';

export class GuardianUploadError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'GuardianUploadError';
  }
}

export async function uploadStream(options: UploadOptions): Promise<void> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new GuardianUploadError('No fetch implementation available');
  }

  const response = await fetchImpl(options.endpoint, {
    method: 'POST',
    headers: options.headers,
    body: options.body as unknown as BodyInit,
    // Needed for streaming bodies in Node.js fetch implementation.
    duplex: 'half'
  } as RequestInit & { duplex: 'half' });

  if (!response.ok) {
    throw new GuardianUploadError('Guardian ingest rejected upload', response.status);
  }

  // Drain the response body if present to avoid resource leaks.
  const body = response.body as ReadableStream<Uint8Array> | null | undefined;
  if (body) {
    const reader = body.getReader();
    try {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
