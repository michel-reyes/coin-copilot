import { calculateBurnRateWithFlux, DataPoint } from '@/utils/burn-rate';
import {
  Canvas,
  DashPathEffect,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';

interface BurnRateChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  style?: ViewStyle;
}

export const BurnRateChart = ({
  data,
  width,
  height,
  style,
}: BurnRateChartProps) => {
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const { history, fluxRange } = useMemo(
    () => calculateBurnRateWithFlux(data),
    [data]
  );

  const { paths, minVal, maxVal } = useMemo(() => {
    if (history.length === 0) {
      return {
        paths: {
          history: Skia.Path.Make(),
          flux: Skia.Path.Make(),
          grid: Skia.Path.Make(),
        },
        minVal: 0,
        maxVal: 100,
      };
    }

    // Determine Y-axis domain
    // Include both history and flux range in min/max calculation
    const historyValues = history.map((h) => h.burnRate);
    const fluxMinValues = fluxRange.map((f) => f.min);
    const fluxMaxValues = fluxRange.map((f) => f.max);

    const allValues = [...historyValues, ...fluxMinValues, ...fluxMaxValues];

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);

    // Add some padding to the domain
    const domainPadding = (dataMax - dataMin) * 0.1 || 10;
    const minVal = Math.floor(dataMin - domainPadding);
    const maxVal = Math.ceil(dataMax + domainPadding);
    const range = maxVal - minVal || 1;

    // Helper to map values to coordinates
    // We align data points based on their index in the *history* array
    // Flux range corresponds to the same dates as history (mostly)
    // But flux range might start later (after 14 days).
    // We need to map dates to X coordinates.

    const dates = history.map((d) => d.date);
    const startDate = new Date(dates[0]).getTime();
    const endDate = new Date(dates[dates.length - 1]).getTime();
    const timeRange = endDate - startDate || 1;

    const getX = (dateStr: string) => {
      const date = new Date(dateStr).getTime();
      return padding + ((date - startDate) / timeRange) * graphWidth;
    };

    const getY = (value: number) => {
      return padding + graphHeight - ((value - minVal) / range) * graphHeight;
    };

    // Helper to generate smooth path using Catmull-Rom splines
    const generateSmoothPath = (points: { x: number; y: number }[]) => {
      const path = Skia.Path.Make();
      if (points.length === 0) return path;

      path.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      return path;
    };

    // Helper to smooth data array (moving average)
    const smoothData = (data: number[], windowSize: number = 3) => {
      return data.map((val, idx, arr) => {
        const start = Math.max(0, idx - Math.floor(windowSize / 2));
        const end = Math.min(arr.length, idx + Math.ceil(windowSize / 2));
        const subset = arr.slice(start, end);
        const sum = subset.reduce((a, b) => a + b, 0);
        return sum / subset.length;
      });
    };

    // 1. Build History Line Path
    const historyPoints = history.map((h) => ({
      x: getX(h.date),
      y: getY(h.burnRate),
    }));
    const historyPath = generateSmoothPath(historyPoints);

    // 2. Build Flux Range Area Path
    const fluxPath = Skia.Path.Make();
    if (fluxRange.length > 0) {
      // Extract and smooth min/max arrays independently
      const rawMax = fluxRange.map((f) => f.max);
      const rawMin = fluxRange.map((f) => f.min);

      // Apply stronger smoothing to bounds to create "envelope" effect
      const smoothedMax = smoothData(rawMax, 5);
      const smoothedMin = smoothData(rawMin, 5);

      const topPoints = fluxRange.map((f, i) => ({
        x: getX(f.date),
        y: getY(smoothedMax[i]),
      }));
      const bottomPoints = fluxRange
        .map((f, i) => ({ x: getX(f.date), y: getY(smoothedMin[i]) }))
        .reverse();

      // We need to combine top and bottom into a single closed path
      // Draw top smooth
      if (topPoints.length > 0) {
        fluxPath.moveTo(topPoints[0].x, topPoints[0].y);
        for (let i = 0; i < topPoints.length - 1; i++) {
          const p0 = topPoints[Math.max(i - 1, 0)];
          const p1 = topPoints[i];
          const p2 = topPoints[i + 1];
          const p3 = topPoints[Math.min(i + 2, topPoints.length - 1)];

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;

          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          fluxPath.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      }

      // Draw bottom smooth (continuing from end of top)
      if (bottomPoints.length > 0) {
        fluxPath.lineTo(bottomPoints[0].x, bottomPoints[0].y);
        for (let i = 0; i < bottomPoints.length - 1; i++) {
          const p0 = bottomPoints[Math.max(i - 1, 0)];
          const p1 = bottomPoints[i];
          const p2 = bottomPoints[i + 1];
          const p3 = bottomPoints[Math.min(i + 2, bottomPoints.length - 1)];

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;

          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          fluxPath.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
      }

      fluxPath.close();
    }

    // 3. Build Grid Lines
    const gridPath = Skia.Path.Make();
    // Draw 3 horizontal grid lines
    const gridSteps = 3;
    for (let i = 1; i <= gridSteps; i++) {
      const y = padding + graphHeight - (i / (gridSteps + 1)) * graphHeight;
      gridPath.moveTo(padding, y);
      gridPath.lineTo(width - padding, y);
    }

    return {
      paths: { history: historyPath, flux: fluxPath, grid: gridPath },
      minVal,
      maxVal,
    };
  }, [history, fluxRange, width, height, graphWidth, graphHeight]);

  return (
    <Canvas style={[{ width, height }, style]}>
      {/* Grid Lines */}
      <Path
        path={paths.grid}
        color='rgba(255, 255, 255, 0.1)'
        style='stroke'
        strokeWidth={1}
      >
        <DashPathEffect intervals={[4, 4]} />
      </Path>

      {/* Flux Range (Shaded Band) */}
      <Path path={paths.flux} style='fill'>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={['rgba(255, 107, 53, 0.4)', 'rgba(255, 107, 53, 0.1)']}
        />
      </Path>

      {/* Burn Rate History (Line) */}
      <Path
        path={paths.history}
        color='#FF6B35'
        style='stroke'
        strokeWidth={3}
        strokeCap='round'
        strokeJoin='round'
      />
    </Canvas>
  );
};
