import type { ReadableStream } from 'node:stream/web';

export function fromResponse(response: Response): ReadableStream<Uint8Array> {
  const body = response.body;
  if (!body) {
    throw new Error('Response has no readable body.');
  }

  return body as ReadableStream<Uint8Array>;
}
