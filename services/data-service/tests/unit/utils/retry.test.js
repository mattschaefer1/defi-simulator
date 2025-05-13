import retry from '../../../src/utils/retry.js';

describe('retry function', () => {
  it('should succeed on the first try', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn, {
      retries: 3,
      initialDelay: 1,
      verbose: false,
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should fail on first try, succeed on second try', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const result = await retry(fn, {
      retries: 3,
      initialDelay: 1,
      verbose: false,
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail on all retries', async () => {
    const error = new Error('fail');
    const fn = jest.fn().mockRejectedValue(error);
    const retryPromise = retry(fn, {
      retries: 3,
      initialDelay: 1,
      verbose: false,
    });
    await expect(retryPromise).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should have verbose logging', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await retry(fn, {
      retries: 3,
      initialDelay: 1,
      verbose: true,
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Attempt 1/3 failed, retrying in 0.001 seconds...',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Attempt 2/3 failed, retrying in 0.002 seconds...',
    );
    consoleSpy.mockRestore();
  });

  it('should succeed when retries=1', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await retry(fn, {
      retries: 1,
      initialDelay: 1,
      verbose: false,
    });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should fail when retries=1', async () => {
    const error = new Error('fail');
    const fn = jest.fn().mockRejectedValue(error);
    await expect(
      retry(fn, { retries: 1, initialDelay: 1, verbose: false }),
    ).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not be called when retries=0', async () => {
    const fn = jest.fn();
    const result = await retry(fn, {
      retries: 0,
      initialDelay: 1,
      verbose: false,
    });
    expect(result).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it('should use default options when none are provided', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
