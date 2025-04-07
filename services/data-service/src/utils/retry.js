/**
 * Default retry configuration
 */
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;

/**
 * Creates a promise that resolves after a specified delay
 * @param {number} ms - The delay in milliseconds
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-promise-executor-return
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @param {number} options.retries - Maximum number of retries
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {boolean} options.verbose - Whether to log retry attempts
 * @returns {Promise<any>} - Result of the function
 */
export default async function retry(
  fn,
  {
    retries = DEFAULT_MAX_RETRIES,
    initialDelay = DEFAULT_INITIAL_DELAY,
    verbose = false,
  } = {},
) {
  let delay = initialDelay;
  let attempt = 1;

  /* eslint-disable no-await-in-loop */
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      if (verbose) {
        console.log(
          `Attempt ${attempt}/${retries} failed, retrying in ${delay / 1000} seconds...`,
        );
      }

      await sleep(delay); // Intentionally want to wait inside the loop
      delay *= 2;
      attempt += 1;
    }
  }
  /* eslint-enable no-await-in-loop */
  return undefined;
}
