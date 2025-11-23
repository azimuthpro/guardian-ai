import type { ReadableStream } from 'node:stream/web';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface LoggerOptions {
  namespace?: string;
  level?: LogLevel;
  transport?: Partial<Record<LogLevel, (...args: unknown[]) => void>> & {
    log?: (...args: unknown[]) => void;
  };
}

export interface TapCallbacks {
  onUploadStart?: () => void;
  onUploadError?: (error: unknown) => void;
  onUploadComplete?: () => void;
}

export interface TapOptions extends TapCallbacks {
  apiKey?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  mapChunk?: (chunk: Uint8Array) => Uint8Array | undefined | Promise<Uint8Array | undefined>;
  logger?: Logger;
  fetchImpl?: typeof fetch;
  author?: 'human' | 'ai';
}

export interface TapResult {
  client: ReadableStream<Uint8Array>;
  upload: Promise<void>;
}

export interface UploadOptions {
  endpoint: string;
  headers: Record<string, string>;
  body: ReadableStream<Uint8Array>;
  fetchImpl?: typeof fetch;
}

export interface UploadResponse {
  status: number;
  ok: boolean;
  body?: ReadableStream<Uint8Array> | null;
}
