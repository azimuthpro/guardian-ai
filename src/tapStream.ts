import { ReadableStream } from 'node:stream/web';
import { createLogger } from './logger';
import { TapOptions, TapResult, Logger } from './types';
import { streamTee } from './utils/streamTee';
import { applyCompression } from './utils/compression';
import { uploadStream } from './utils/upload';

const DEFAULT_ENDPOINT = 'https://guardian.azimuthpro.com/ingest';

export function tapStream(
  stream: ReadableStream<Uint8Array>,
  options: TapOptions = {}
): TapResult {
  if (!stream) {
    throw new Error('tapStream requires a readable stream');
  }

  const logger: Logger =
    options.logger ?? createLogger({ namespace: 'guardian.tapStream' });
  const [client, uploadSource] = streamTee(stream);

  const upload = (async () => {
    let workingStream: ReadableStream<Uint8Array> = uploadSource;
    const {
      compression = 'none',
      headers = {},
      mapChunk,
      endpoint = DEFAULT_ENDPOINT,
      fetchImpl
    } = options;

    if (mapChunk) {
      workingStream = mapReadableStream(workingStream, mapChunk);
    }

    const headerBag: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      ...headers
    };

    if (compression && compression !== 'none') {
      logger.debug('Applying compression', compression);
      const compressed = await applyCompression(workingStream, compression);
      workingStream = compressed.stream;
      if (compressed.encoding) {
        headerBag['Content-Encoding'] = compressed.encoding;
      }
    }

    const apiKey = options.apiKey ?? process.env.GUARDIAN_API_KEY;
    if (apiKey) {
      headerBag.Authorization = `Bearer ${apiKey}`;
    } else {
      logger.warn('No Guardian API key provided; proceeding without Authorization header.');
    }

    options.onUploadStart?.();
    logger.info('Starting Guardian upload', { endpoint, headers: headerBag });

    try {
      await uploadStream({
        endpoint,
        headers: headerBag,
        body: workingStream,
        fetchImpl
      });
      options.onUploadComplete?.();
      logger.info('Guardian upload completed successfully.');
    } catch (error) {
      logger.error('Guardian upload failed', error);
      options.onUploadError?.(error);
      throw error;
    }
  })();

  return { client, upload };
}

function mapReadableStream(
  stream: ReadableStream<Uint8Array>,
  mapper: NonNullable<TapOptions['mapChunk']>
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          reader.releaseLock();
          controller.close();
          return;
        }

        if (value) {
          const mapped = await mapper(value);
          if (mapped && mapped.length > 0) {
            controller.enqueue(mapped);
          }
        }
      } catch (error) {
        controller.error(error);
        reader.releaseLock();
      }
    },
    cancel(reason) {
      const cancellation = reader.cancel(reason);
      reader.releaseLock();
      return cancellation;
    }
  });
}
