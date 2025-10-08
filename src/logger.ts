import { Logger, LoggerOptions, LogLevel } from './types';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const DEFAULT_NAMESPACE = 'guardian';

export function createLogger(options: LoggerOptions = {}): Logger {
  const { namespace = DEFAULT_NAMESPACE, level = 'info', transport = console } = options;
  const threshold = LEVEL_ORDER[level];

  const log = (logLevel: LogLevel, ...args: unknown[]) => {
    if (LEVEL_ORDER[logLevel] < threshold) {
      return;
    }

    const prefix = `[${namespace}] ${logLevel.toUpperCase()}:`;
    const writer =
      transport[logLevel] ??
      transport.log ??
      ((...inner: unknown[]) => {
        console.log(...inner);
      });

    writer(prefix, ...args);
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args)
  };
}
