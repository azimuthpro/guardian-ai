import { createLogger } from '../src/logger';

describe('createLogger', () => {
  it('logs using provided transport respecting level threshold', () => {
    const transport = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    const logger = createLogger({
      namespace: 'test',
      level: 'warn',
      transport
    });

    logger.debug('ignore');
    logger.info('ignore');
    logger.warn('warn');
    logger.error('error');

    expect(transport.debug).not.toHaveBeenCalled();
    expect(transport.info).not.toHaveBeenCalled();
    expect(transport.warn).toHaveBeenCalledTimes(1);
    expect(transport.error).toHaveBeenCalledTimes(1);
    expect(transport.warn.mock.calls[0][0]).toContain('[test] WARN:');
  });
});
