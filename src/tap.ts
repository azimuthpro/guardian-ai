import type { ReadableStream } from 'node:stream/web';
import type { TapOptions, TapResult } from './types';
import { tapStream } from './tapStream';
import { fromNodeStream } from './adapters/fromNodeStream';
import { fromResponse } from './adapters/fromResponse';

// Type for Node.js readable streams
type NodeReadableStream = NodeJS.ReadableStream;

/**
 * Simplified tap function with automatic stream type detection.
 *
 * This convenience function automatically detects the input stream type
 * (Response, Node.js stream, or Web ReadableStream) and converts it to
 * a Web ReadableStream before passing it to tapStream.
 *
 * @param stream - Any of: fetch Response, Node.js Readable, or Web ReadableStream
 * @param apiKeyOrOptions - Either an API key string or full TapOptions object
 * @returns TapResult with client stream and upload promise
 *
 * @example
 * // Simplest form with auto-detection
 * const { client, upload } = tap(response);
 *
 * @example
 * // With API key string
 * const { client, upload } = tap(nodeStream, 'my-api-key');
 *
 * @example
 * // With full options (data is automatically compressed with gzip before upload)
 * const { client, upload } = tap(webStream, {
 *   apiKey: 'my-key',
 *   onUploadError: (err) => console.error(err)
 * });
 */
export function tap(
  stream: ReadableStream<Uint8Array> | NodeReadableStream | Response,
  apiKeyOrOptions?: string | TapOptions
): TapResult {
  // Auto-detect and convert stream type to Web ReadableStream
  let webStream: ReadableStream<Uint8Array>;

  if (stream instanceof Response) {
    webStream = fromResponse(stream);
  } else if (isNodeStream(stream)) {
    webStream = fromNodeStream(stream);
  } else {
    webStream = stream;
  }

  // Handle shorthand apiKey string or full options
  const options: TapOptions = typeof apiKeyOrOptions === 'string'
    ? { apiKey: apiKeyOrOptions }
    : { ...apiKeyOrOptions };

  return tapStream(webStream, options);
}

/**
 * Type guard to check if a stream is a Node.js Readable stream
 */
function isNodeStream(stream: unknown): stream is NodeReadableStream {
  return (
    stream !== null &&
    typeof stream === 'object' &&
    'pipe' in stream &&
    typeof (stream as NodeReadableStream).pipe === 'function'
  );
}
