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
import { tap } from '@azimuthpro/guardian-ai';

// Auto-detects stream type, uses env GUARDIAN_API_KEY
const { client, upload } = tap(response);

// Forward the tapped stream to your downstream consumer
client.pipeTo(new WritableStream({ /* ... */ }));

// Monitor background upload
upload.catch((error) => {
  console.error('Guardian upload failed', error);
});
```

### Classic API (tapStream)

For more control, use the full `tapStream` API:

```ts
import { tapStream, adapters } from '@azimuthpro/guardian-ai';
import fs from 'node:fs';

const source = adapters.fromNodeStream(fs.createReadStream('./agent-trace.log'));

const { client, upload } = tapStream(source, {
  apiKey: process.env.GUARDIAN_API_KEY,
  compression: 'gzip'
});

client.pipeTo(new WritableStream({ /* ... */ }));
upload.catch((error) => console.error('Guardian upload failed', error));
```

## Implementation Examples

### Next.js API Route (App Router)

Monitor AI agent streaming responses in a Next.js application:

```ts
// app/api/chat/route.ts
import { tap } from '@azimuthpro/guardian-ai';

export async function POST(request: Request) {
  // Call your AI provider
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
      stream: true,
    }),
  });

  // Tap the stream - auto-detects Response type
  const { client, upload } = tap(upstream, {
    compression: 'gzip', // Optional: compress upload data
    headers: {
      'X-Session-Id': crypto.randomUUID(),
      'X-User-Id': 'user-123',
      'X-Model': 'gpt-4',
    },
    onUploadError: (error) => {
      console.error('Guardian monitoring failed', error);
    },
  });

  // Monitor background upload
  upload.catch((err) => console.error('Upload error:', err));

  // Return the tapped stream to the client
  return new Response(client, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Vercel AI SDK Integration

Integrate Guardian monitoring with the Vercel AI SDK:

```ts
// app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { tap, createLogger } from '@azimuthpro/guardian-ai';

const logger = createLogger({ namespace: 'guardian:chat', level: 'info' });

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Generate streaming response with Vercel AI SDK
  const result = streamText({
    model: google('gemini-2.0-flash'),
    messages: convertToModelMessages(messages),
    temperature: 0.7,
  });

  const response = result.toUIMessageStreamResponse();

  // Monitor with Guardian AI
  const sessionId = crypto.randomUUID();
  const { client, upload } = tap(response, {
    compression: 'gzip', // Optional: compress upload data
    headers: {
      'X-Session-Id': sessionId,
      'X-Model-Name': 'gemini-2.0-flash',
      'X-Timestamp': new Date().toISOString(),
    },
    onUploadError: (error) => {
      logger.error('Guardian upload failed', { sessionId, error });
    },
  });

  // Handle background monitoring
  upload.catch((error) => {
    logger.error('Guardian background error', { sessionId, error });
  });

  // Return monitored stream
  return new Response(client, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
```

### Express Middleware

Add Guardian monitoring to traditional Express.js applications:

```ts
import express from 'express';
import { tap } from '@azimuthpro/guardian-ai';

const app = express();

app.post('/api/stream', async (req, res) => {
  // Call upstream AI service
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: req.body.messages,
      stream: true,
      max_tokens: 1024,
    }),
  });

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: 'AI provider error' });
  }

  // Tap the upstream response
  const { client, upload } = tap(upstream, {
    apiKey: process.env.GUARDIAN_API_KEY,
    headers: {
      'X-User-Id': req.headers['x-user-id'] as string,
      'X-Session-Id': crypto.randomUUID(),
    },
  });

  // Set response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Pipe the monitored stream to the response
  const reader = client.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.end();
  }

  // Monitor upload status
  upload.catch((err) => console.error('Guardian upload failed:', err));
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## tap(stream, apiKeyOrOptions)

Simplified API with automatic stream type detection.

| Parameter | Type | Description |
| --- | --- | --- |
| `stream` | `ReadableStream \| Readable \| Response` | Any stream type - automatically detected and converted |
| `apiKeyOrOptions` | `string \| TapOptions` | API key string or full options object |

**Returns:** `{ client: ReadableStream<Uint8Array>, upload: Promise<void> }`

### Examples

```ts
// Simplest - auto-detects Response, uses env GUARDIAN_API_KEY
const { client, upload } = tap(response);

// With explicit API key
const { client, upload } = tap(nodeStream, 'gdn_abc123...');

// With compression (recommended for production)
const { client, upload } = tap(response, {
  compression: 'gzip',
  headers: { 'X-Session-Id': sessionId },
});

// With full options
const { client, upload } = tap(webStream, {
  apiKey: process.env.GUARDIAN_API_KEY,
  compression: 'gzip',
  headers: { 'X-Session-Id': sessionId },
  onUploadError: console.error,
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
