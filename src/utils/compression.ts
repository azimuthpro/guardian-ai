import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib';
import { ReadableStream } from 'node:stream/web';
import { CompressionStrategy } from '../types';

export async function applyCompression(
  stream: ReadableStream<Uint8Array>,
  strategy: CompressionStrategy
): Promise<{ stream: ReadableStream<Uint8Array>; encoding?: string }> {
  if (strategy === 'none') {
    return { stream };
  }

  const buffer = await readStreamIntoBuffer(stream);
  const compressed =
    strategy === 'gzip'
      ? gzipSync(buffer)
      : strategy === 'deflate'
      ? deflateSync(buffer)
      : brotliCompressSync(buffer);

  const encoding =
    strategy === 'gzip' ? 'gzip' : strategy === 'deflate' ? 'deflate' : 'br';

  const compressedStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(compressed));
      controller.close();
    }
  });

  return { stream: compressedStream, encoding };
}

async function readStreamIntoBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
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
