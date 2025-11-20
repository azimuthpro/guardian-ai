import { TextEncoder, TextDecoder } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { tapStream } from '../src/tapStream';
import { createLogger } from '../src/logger';
import type { TapOptions } from '../src/types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function createStreamFromStrings(chunks: string[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    }
  });
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> {
  const reader = stream.getReader();
  const values: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      values.push(value);
    }
  }
  reader.releaseLock();
  return values;
}

describe('tapStream', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('tees the stream and uploads with automatic gzip compression', async () => {
    const source = createStreamFromStrings(['hello', 'world']);

    const fetchMock = jest.fn(async (_url, init?: any) => {
      const body = init?.body as ReadableStream<Uint8Array>;
      const chunks = await readStream(body);
      const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
      // Verify data was compressed
      const decompressed = gunzipSync(buffer);
      expect(decompressed.toString()).toBe('helloworld');
      return { ok: true, status: 200, body: null } as unknown as Response;
    });

    const { client, upload } = tapStream(source, {
      apiKey: 'test-key',
      fetchImpl: fetchMock
    });

    const clientChunks = await readStream(client);
    expect(clientChunks.map((chunk) => decoder.decode(chunk))).toEqual(['hello', 'world']);

    await expect(upload).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [_url, init] = fetchMock.mock.calls[0];
    expect(init?.duplex).toBe('half');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'gzip'
    });
  });

  it('maps chunks before compression and upload when mapChunk is provided', async () => {
    const source = createStreamFromStrings(['foo', 'bar']);
    const fetchMock = jest.fn(async (_url, init?: any) => {
      const body = init?.body as ReadableStream<Uint8Array>;
      const chunks = await readStream(body);
      const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
      // Verify data was mapped and then compressed
      const decompressed = gunzipSync(buffer);
      expect(decompressed.toString()).toBe('FOOBAR');
      return { ok: true, status: 200, body: null } as unknown as Response;
    });

    const { upload } = tapStream(source, {
      apiKey: 'key',
      fetchImpl: fetchMock,
      mapChunk: async (chunk) => encoder.encode(decoder.decode(chunk).toUpperCase())
    });

    await expect(upload).resolves.toBeUndefined();
  });

  it('invokes callbacks on success and error', async () => {
    const source = createStreamFromStrings(['data']);
    const onUploadStart = jest.fn();
    const onUploadComplete = jest.fn();
    const onUploadError = jest.fn();

    const failingFetch = jest.fn(async () => {
      return { ok: false, status: 500, body: null } as unknown as Response;
    });

    const { upload } = tapStream(source, {
      apiKey: 'key',
      fetchImpl: failingFetch,
      onUploadStart,
      onUploadComplete,
      onUploadError,
      logger: createLogger({
        namespace: 'test',
        level: 'debug',
        transport: {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn()
        }
      })
    } as TapOptions);

    await expect(upload).rejects.toThrow();
    expect(onUploadStart).toHaveBeenCalledTimes(1);
    expect(onUploadError).toHaveBeenCalledTimes(1);
    expect(onUploadComplete).not.toHaveBeenCalled();
  });
});
