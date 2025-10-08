import type { ReadableStream } from 'node:stream/web';

export function streamTee<T>(stream: ReadableStream<T>): [ReadableStream<T>, ReadableStream<T>] {
  if (typeof stream.tee !== 'function') {
    throw new Error('ReadableStream tee() not supported in this environment');
  }

  return stream.tee();
}
