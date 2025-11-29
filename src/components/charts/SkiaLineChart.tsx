import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  Skia,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';

interface DataPoint {
  value: number;
}

interface SkiaLineChartProps {
  data: DataPoint[];
  width: number;
  height: number;

  // Colors
  lineColor?: string;
  dashedLineColor?: string;
  dataPointBackgroundColor?: string;
  dataPointBorderColor?: string;
  backgroundColor?: string;

  // Dimensions
  strokeWidth?: number;
  dataPointRadius?: number;

  // Scaling & Bounds
  yAxisMin?: number;
  yAxisMax?: number;
  backgroundRectMin?: number;
  backgroundRectMax?: number;

  style?: ViewStyle;
}

export const SkiaLineChart = ({
  data,
  width,
  height,
  // Default colors
  lineColor = '#666',
  dashedLineColor, // Defaults to lineColor if not provided
  dataPointBackgroundColor = '#2a2a2a',
  dataPointBorderColor, // Defaults to lineColor if not provided
  backgroundColor = 'rgba(255, 255, 255, 0.05)',

  strokeWidth = 2,
  dataPointRadius = 6,

  yAxisMin,
  yAxisMax,
  backgroundRectMin,
  backgroundRectMax,

  style,
}: SkiaLineChartProps) => {
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Resolve optional colors
  const effectiveDashedLineColor = dashedLineColor ?? lineColor;
  const effectiveDataPointBorderColor = dataPointBorderColor ?? lineColor;

  const { points, lastPoint, minVal, maxVal, range } = useMemo(() => {
    if (data.length === 0)
      return { points: [], lastPoint: null, minVal: 0, maxVal: 0, range: 1 };

    const dataMin = Math.min(...data.map((d) => d.value));
    const dataMax = Math.max(...data.map((d) => d.value));

    // Calculate domain including data, min/max props, and rectMin/rectMax props
    const minVal = Math.min(
      dataMin,
      yAxisMin ?? dataMin,
      backgroundRectMin ?? dataMin
    );
    const maxVal = Math.max(
      dataMax,
      yAxisMax ?? dataMax,
      backgroundRectMax ?? dataMax
    );

    const range = maxVal - minVal || 1;

    const getX = (index: number) =>
      padding + (index / (data.length - 1)) * graphWidth;
    const getY = (value: number) =>
      padding + graphHeight - ((value - minVal) / range) * graphHeight;

    const pts: { x: number; y: number; value: number }[] = [];

    data.forEach((d, index) => {
      const x = getX(index);
      const y = getY(d.value);
      pts.push({ x, y, value: d.value });
    });

    return {
      points: pts,
      lastPoint: pts[pts.length - 1],
      minVal,
      maxVal,
      range,
    };
  }, [
    data,
    width,
    height,
    graphWidth,
    graphHeight,
    yAxisMin,
    yAxisMax,
    backgroundRectMin,
    backgroundRectMax,
  ]);

  // Helper to get Y coordinate for a value
  const getY = (value: number) =>
    padding + graphHeight - ((value - minVal) / range) * graphHeight;

  // Calculate background rect bounds
  const rectTop = backgroundRectMax !== undefined ? getY(backgroundRectMax) : 0;
  const rectBottom =
    backgroundRectMin !== undefined ? getY(backgroundRectMin) : height;
  const rectHeight = Math.max(0, rectBottom - rectTop);

  const { mainPath, dashedPath } = useMemo(() => {
    if (points.length < 2)
      return { mainPath: Skia.Path.Make(), dashedPath: Skia.Path.Make() };

    const main = Skia.Path.Make();
    const dashed = Skia.Path.Make();

    // Draw all but the last segment
    if (points.length > 0) {
      main.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        main.lineTo(points[i].x, points[i].y);
      }
    }

    // Draw the last segment
    if (points.length >= 2) {
      const secondToLast = points[points.length - 2];
      const last = points[points.length - 1];
      dashed.moveTo(secondToLast.x, secondToLast.y);
      dashed.lineTo(last.x, last.y);
    }

    return { mainPath: main, dashedPath: dashed };
  }, [points]);

  return (
    <Canvas style={[{ width, height }, style]}>
      {/* Background Rectangle */}
      <RoundedRect
        x={0}
        y={rectTop}
        width={width}
        height={rectHeight}
        r={12}
        color={backgroundColor}
      />

      {/* Main Line */}
      <Path
        path={mainPath}
        style='stroke'
        strokeWidth={strokeWidth}
        color={lineColor}
        strokeCap='round'
        strokeJoin='round'
      />

      {/* Dashed Line for last segment */}
      <Path
        path={dashedPath}
        style='stroke'
        strokeWidth={strokeWidth}
        color={effectiveDashedLineColor}
        strokeCap='round'
        strokeJoin='round'
      >
        <DashPathEffect intervals={[2, 5]} />
      </Path>

      {/* Data Points */}
      {points.map((p, i) => (
        <Group key={i}>
          <Circle
            cx={p.x}
            cy={p.y}
            r={dataPointRadius}
            color={dataPointBackgroundColor}
            style='fill'
          />
          <Circle
            cx={p.x}
            cy={p.y}
            r={dataPointRadius}
            color={effectiveDataPointBorderColor}
            style='stroke'
            strokeWidth={strokeWidth}
          />
        </Group>
      ))}

      {/* Last Point Special Effect */}
      {lastPoint && (
        <Group>
          {/* Halo */}
          {/* <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={dataPointRadius * 2.5}
            color={lineColor}
            opacity={0.2}
          /> */}
          {/* Inner solid circle */}
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={dataPointRadius}
            color={dataPointBackgroundColor}
            style='fill'
          />
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={dataPointRadius}
            color='#fff'
            style='stroke'
            strokeWidth={strokeWidth}
          />
        </Group>
      )}
    </Canvas>
  );
};
