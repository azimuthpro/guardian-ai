import { Readable } from 'node:stream';
import { TextDecoder, TextEncoder } from 'node:util';
import { fromNodeStream } from '../src/adapters/fromNodeStream';
import { fromResponse } from '../src/adapters/fromResponse';
import { fromAsyncIterator } from '../src/adapters/fromAsyncIterator';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const reader = stream.getReader();
  const values: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      values.push(decoder.decode(value));
    }
  }
  reader.releaseLock();
  return values;
}

describe('adapters', () => {
  it('converts a Node.js stream to a ReadableStream', async () => {
    const nodeStream = Readable.from([Buffer.from('node'), Buffer.from('stream')]);
    const readable = fromNodeStream(nodeStream);
    await expect(readStream(readable)).resolves.toEqual(['node', 'stream']);
  });

  it('extracts stream from fetch Response', async () => {
    const response = new Response('payload');
    const readable = fromResponse(response);
    await expect(readStream(readable)).resolves.toEqual(['payload']);
  });

  it('wraps an async iterator as a ReadableStream', async () => {
    async function* generator() {
      yield encoder.encode('chunk-1');
      yield encoder.encode('chunk-2');
    }

    const readable = fromAsyncIterator(generator());
    await expect(readStream(readable)).resolves.toEqual(['chunk-1', 'chunk-2']);
  });
});
