import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

export function fromNodeStream(stream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream as Readable) as ReadableStream<Uint8Array>;
}
