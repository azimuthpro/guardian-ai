import { ReadableStream } from 'node:stream/web';

export function fromAsyncIterator(
  iterator: AsyncIterable<Uint8Array>
): ReadableStream<Uint8Array> {
  const asyncIterator = iterator[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const result = await asyncIterator.next();
      if (result.done) {
        controller.close();
        return;
      }

      if (result.value) {
        controller.enqueue(result.value);
      }
    },
    async cancel() {
      if (typeof asyncIterator.return === 'function') {
        await asyncIterator.return(undefined);
      }
    }
  });
}
