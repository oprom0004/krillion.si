// Shared rules: observed first-valid-answer frequency per anonymous browser.
export const MIN_SAMPLE = 50;
export function observedTier(count, sampleSize) {
  if (sampleSize < MIN_SAMPLE) throw new Error('Insufficient sample size');
  const proportion = count / sampleSize;
  const [tier, score] = proportion >= .20 ? ['plankton',10]
    : proportion >= .10 ? ['schooler',30]
    : proportion >= .05 ? ['rare',60]
    : proportion >= .02 ? ['deepcut',85] : ['krillion',100];
  return { count, proportion, tier, score };
}
