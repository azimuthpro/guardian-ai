import { gzipSync } from 'node:zlib';
import { ReadableStream } from 'node:stream/web';

/**
 * Compresses a stream using gzip compression for upload to Guardian ingest service.
 * The ingest server always expects gzipped data.
 *
 * @param stream - The stream to compress
 * @returns Compressed stream and encoding header value
 */
export async function compressForUpload(
  stream: ReadableStream<Uint8Array>
): Promise<{ stream: ReadableStream<Uint8Array>; encoding: string }> {
  const buffer = await readStreamIntoBuffer(stream);
  const compressed = gzipSync(buffer);

  const compressedStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(compressed));
      controller.close();
    }
  });

  return { stream: compressedStream, encoding: 'gzip' };
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
