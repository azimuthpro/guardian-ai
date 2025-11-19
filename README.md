# @azimuthpro/guardian-ai

[![npm version](https://img.shields.io/npm/v/@azimuthpro/guardian-ai.svg)](https://www.npmjs.com/package/@azimuthpro/guardian-ai)

Composable tooling for tapping Node.js and Web streams, mirroring traffic to the Guardian ingest service for real-time AI agent monitoring.

## Installation

```bash
npm install @azimuthpro/guardian-ai
```

View on npm: [@azimuthpro/guardian-ai](https://www.npmjs.com/package/@azimuthpro/guardian-ai)

## Quick Start

```ts
import { tapStream } from '@azimuthpro/guardian-ai';
import { fromNodeStream } from '@azimuthpro/guardian-ai/adapters';
import fs from 'node:fs';

const source = fromNodeStream(fs.createReadStream('./agent-trace.log'));

const { client, upload } = tapStream(source, {
  apiKey: process.env.GUARDIAN_API_KEY,
  compression: 'gzip'
});

// Forward the tapped stream to your downstream consumer.
client.pipeTo(new WritableStream({ /* ... */ }));

// Background ingestion to Guardian.
upload.catch((error) => {
  console.error('Guardian upload failed', error);
});
```

## tapStream(stream, options)

| Option | Type | Description |
| --- | --- | --- |
| `apiKey` | `string` | Guardian API key. Falls back to `process.env.GUARDIAN_API_KEY`. |
| `endpoint` | `string` | Custom ingest endpoint. Defaults to `https://guardian.azimuthpro.com/ingest`. |
| `compression` | `'gzip' \| 'deflate' \| 'br' \| 'none'` | Apply HTTP content compression to the upload stream. |
| `headers` | `Record<string, string>` | Additional headers merged into the upload request. |
| `mapChunk` | `(chunk) => Uint8Array \| Promise<Uint8Array>` | Transform or redact each chunk before upload. Return `undefined` to drop a chunk. |
| `onUploadStart` | `() => void` | Invoked just before the background upload begins. |
| `onUploadComplete` | `() => void` | Called after a successful upload. |
| `onUploadError` | `(error) => void` | Called when the upload fails. |
| `logger` | `Logger` | Inject a custom logger implementation. Defaults to a console-backed logger. |
| `fetchImpl` | `typeof fetch` | Provide an alternative fetch implementation (e.g. for testing). |

Returns an object `{ client, upload }` where:

- `client` is a `ReadableStream<Uint8Array>` that continues downstream.
- `upload` is a `Promise<void>` tracking the background ingestion. Await or `catch` it for error handling.

## Adapters

- `fromNodeStream(stream)` – Wrap a Node.js readable stream as a Web `ReadableStream`.
- `fromResponse(response)` – Extract the body stream from a `fetch` `Response`.
- `fromAsyncIterator(iterator)` – Expose any `AsyncIterable<Uint8Array>` as a `ReadableStream`.

```ts
import { adapters } from '@azimuthpro/guardian-ai';

const stream = adapters.fromAsyncIterator(myGenerator());
```

## Logging

Create structured loggers with namespace and level filtering:

```ts
import { createLogger } from '@azimuthpro/guardian-ai';

const logger = createLogger({ namespace: 'guardian-agent', level: 'debug' });
logger.info('Starting monitoring session');
```

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

## License

MIT © Azimuth Pro
