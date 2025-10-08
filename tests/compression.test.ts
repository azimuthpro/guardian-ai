import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { applyCompression } from '../src/utils/compression';

function createReadable(data: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    }
  });
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  reader.releaseLock();
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

describe('compression utilities', () => {
  const sample = Buffer.from('sample-data');

  it('compresses using gzip', async () => {
    const { stream, encoding } = await applyCompression(createReadable(sample), 'gzip');
    expect(encoding).toBe('gzip');
    const compressed = await collectStream(stream);
    expect(gunzipSync(compressed).toString()).toBe(sample.toString());
  });

  it('compresses using deflate', async () => {
    const { stream, encoding } = await applyCompression(createReadable(sample), 'deflate');
    expect(encoding).toBe('deflate');
    const compressed = await collectStream(stream);
    expect(inflateSync(compressed).toString()).toBe(sample.toString());
  });

  it('compresses using brotli', async () => {
    const { stream, encoding } = await applyCompression(createReadable(sample), 'br');
    expect(encoding).toBe('br');
    const compressed = await collectStream(stream);
    expect(brotliDecompressSync(compressed).toString()).toBe(sample.toString());
  });

  it('returns original stream when strategy is none', async () => {
    const source = createReadable(sample);
    const { stream, encoding } = await applyCompression(source, 'none');
    expect(stream).toBe(source);
    expect(encoding).toBeUndefined();
  });
});
