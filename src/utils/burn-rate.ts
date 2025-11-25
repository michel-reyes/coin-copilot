export interface DataPoint {
  date: string;
  income: number;
  netWorth: number;
}

export interface FluxRangePoint {
  date: string;
  min: number;
  max: number;
}

export interface BurnRateHistoryPoint {
  date: string;
  burnRate: number;
}

export interface BurnRateResult {
  burnRate: number | null;
  fluxRangeStatus: 'Holding' | 'Updating';
  history: BurnRateHistoryPoint[];
  fluxRange: FluxRangePoint[];
}

/**
 * MacroFactor-style Burn Rate + Flux Range (confidence band)
 * Returns everything needed to draw the exact chart you showed.
 */
export function calculateBurnRateWithFlux(
  dataPoints: DataPoint[]
): BurnRateResult {
  // Sort by date
  const sorted = [...dataPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // We need at least 14 days for meaningful flux range
  if (sorted.length < 14) {
    return {
      burnRate: null,
      fluxRangeStatus: 'Holding',
      history: [],
      fluxRange: [],
    };
  }

  const history: BurnRateHistoryPoint[] = [];
  const fluxRange: FluxRangePoint[] = []; // This is the light-orange band: { date, min, max }

  let fluxStatus: 'Holding' | 'Updating' = 'Holding';

  // Rolling 7-day windows
  for (let i = 6; i < sorted.length; i++) {
    const window = sorted.slice(i - 6, i + 1); // 7 days

    // Count valid income days
    const incomeDays = window.filter((d) => (d.income || 0) > 0).length;
    const hasNetWorth = window.some((d) => d.netWorth != null);

    const isUpdating = incomeDays >= 6 && hasNetWorth;
    if (isUpdating) fluxStatus = 'Updating';

    // Find oldest & newest net worth in this window
    const validNW = window.filter((d) => d.netWorth != null);
    if (validNW.length < 2) continue;

    const oldest = validNW[0];
    const newest = validNW[validNW.length - 1];

    const totalIncome = window.reduce((s, d) => s + (d.income || 0), 0);
    const moneySaved = newest.netWorth - oldest.netWorth;
    const moneySpent = totalIncome - moneySaved;

    const daysInWindow =
      (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) /
        (86400 * 1000) +
      1;
    const dailyBurn = moneySpent / daysInWindow;

    const currentDate = newest.date;

    history.push({
      date: currentDate,
      burnRate: Math.round(dailyBurn),
    });

    // === FLUX RANGE (the light-orange band) ===
    // We simulate confidence using rolling standard deviation
    // (MacroFactor does something similar internally)
    const pastBurnRates = history.slice(-14).map((p) => p.burnRate); // last 14 days
    if (pastBurnRates.length >= 7) {
      const avg =
        pastBurnRates.reduce((a, b) => a + b, 0) / pastBurnRates.length;
      const stdDev = Math.sqrt(
        pastBurnRates.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
          pastBurnRates.length
      );

      // Flux band = ±2 standard deviation (adjusted for visual match)
      const min = Math.max(0, Math.round(avg - stdDev * 2));
      const max = Math.round(avg + stdDev * 2);

      fluxRange.push({ date: currentDate, min, max });
    }
  }

  const latest = history[history.length - 1];

  return {
    burnRate: latest ? latest.burnRate : null,
    fluxRangeStatus: fluxStatus, // "Updating" or "Holding"
    history, // main orange line
    fluxRange, // shaded confidence band
  };
}
