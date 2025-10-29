/****************************************************************
 *
 * Statistical helper functions for anomaly detection
 *
 ****************************************************************/

/**
 * Calculates a robust scale estimate using Huber's method
 * This is more resistant to outliers than standard deviation
 *
 * @param data Array of numeric values
 * @param delta Tuning parameter controlling influence of outliers
 * @param tol Convergence tolerance
 * @param maxIter Maximum iterations
 * @returns Robust scale estimate (similar to standard deviation)
 */
function huberScale(
    data: number[],
    delta: number,
    tol: number = 1e-5,
    maxIter: number = 100,
): number {
    // First, get a robust location estimate using Huber estimator
    let mu: number = data.reduce((a: number, b: number) => a + b, 0) / data.length;
    for (let iter: number = 0; iter < maxIter; iter++) {
        let numerator: number = 0;
        let denominator: number = 0;
        for (let x of data) {
            const r: number = x - mu;
            const weight: number = Math.abs(r) <= delta ? 1 : delta / Math.abs(r);
            numerator += weight * x;
            denominator += weight;
        }
        const muNew: number = numerator / denominator;
        if (Math.abs(mu - muNew) < tol) break;
        mu = muNew;
    }

    // Now estimate scale (variance) robustly using Huber weights
    let scaleNumerator: number = 0;
    let scaleDenom: number = 0;
    for (let x of data) {
        const r: number = x - mu;
        const weight: number = Math.abs(r) <= delta ? 1 : delta / Math.abs(r);
        scaleNumerator += weight * Math.pow(r, 2);
        scaleDenom += weight;
    }

    // Robust standard deviation estimate:
    return Math.sqrt(scaleNumerator / scaleDenom);
}

// ------------------------------------------------------------------

/**
 * Detects anomalies using Huber's robust statistics
 * This is effective for detecting values that are unusually large
 * compared to a historical dataset, while being resistant to outliers
 *
 * @param newValue The value being checked for anomaly
 * @param historicalData Array of historical values for comparison
 * @param delta Tuning parameter for Huber estimator (default: 5)
 * @param k Threshold multiplier for anomaly detection (default: 2)
 * @returns Object with anomaly flag and robust average
 */
export function flagAnomalyHuber(newValue: number, historicalData: number[], delta = 5, k = 2) {
    if (historicalData.length === 0) {
        return { isAnomaly: false, average: 0 };
    }

    // Get robust central value (Huber estimator)
    let mu = historicalData.reduce((a: number, b: number) => a + b, 0) / historicalData.length;
    for (let iter = 0; iter < 100; iter++) {
        let num = 0;
        let den = 0;
        for (let x of historicalData) {
            const r = x - mu;
            const w = Math.abs(r) <= delta ? 1 : delta / Math.abs(r);
            num += w * x;
            den += w;
        }
        const newMu = num / den;
        if (Math.abs(mu - newMu) < 1e-5) break;
        mu = newMu;
    }

    // Get robust scale (Huber-based scale estimate)
    const robustScale = huberScale(historicalData, delta);

    // Flag if newValue is more than mu + k * robustScale
    // This is similar to z-score threshold's but with robust statistics
    const isAnomaly = newValue > mu + k * robustScale;

    // Return both the anomaly flag and the robust average for context
    return {
        isAnomaly,
        average: mu,
    };
}

// ------------------------------------------------------------------

/**
 * Calculates the median of an array of numbers
 * The median is less sensitive to outliers than the mean
 *
 * @param arr Array of numeric values
 * @returns Median value or 0 for empty arrays
 */
export function median(arr: number[]): number {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ------------------------------------------------------------------

/**
 * Detects anomalies based on a simple threshold comparison to a moving average
 * This is effective for detecting recent deviations from established patterns
 *
 * @param currentValue Value to check
 * @param movingAvg Reference average to compare against
 * @param thresholdPercentage How much above the average triggers an anomaly (default: 20%)
 * @returns Boolean indicating if current value is anomalously high
 */
export function flagAnomalyMovingAverage(
    currentValue: number,
    movingAvg: number,
    thresholdPercentage: number = 0.2,
): boolean {
    return currentValue > movingAvg * (1 + thresholdPercentage);
}
