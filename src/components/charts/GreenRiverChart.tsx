import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  Text,
  useFont,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';

interface DataPoint {
  value: number;
  label?: string;
}

interface GreenRiverChartProps {
  data1: DataPoint[];
  data2: DataPoint[];
  data3: DataPoint[];
  data4: DataPoint[];
  width: number;
  height: number;
  style?: ViewStyle;
}

export const GreenRiverChart = ({
  data1,
  data2,
  data3,
  data4,
  width,
  height,
  style,
}: GreenRiverChartProps) => {
  // Load font for X-axis labels
  const font = useFont(
    require('../../../assets/fonts/SFProRounded-Regular.ttf'),
    12
  );

  // Font for the date number (slightly larger/bolder if possible, but we'll use the same for now or scale it)
  // If we had a bold font we could load it too.
  const fontBold = useFont(
    require('../../../assets/fonts/SFProRounded-Semibold.ttf'),
    14
  );

  // Layout constants
  const PADDING_BOTTOM = 40; // Space for X-axis labels
  const CHART_HEIGHT = height - PADDING_BOTTOM;

  // Combine all data to find the global max for scaling
  const allValues = [...data1, ...data2, ...data3, ...data4].map(
    (d) => d.value
  );

  const maxVal = Math.max(...allValues) * 1.1; // Add 10% padding
  const minVal = 0;

  const getX = (index: number, total: number) => {
    return (index / (total - 1)) * width;
  };

  const getY = (value: number) => {
    // Invert Y because SVG/Canvas Y grows downwards
    return CHART_HEIGHT - (value / (maxVal - minVal)) * CHART_HEIGHT;
  };

  // Catmull-Rom to Cubic Bezier smoothing
  const generateSmoothPath = (
    data: DataPoint[],
    closePath: boolean = false
  ) => {
    const path = Skia.Path.Make();
    if (data.length === 0) return path;

    const points = data.map((d, i) => ({
      x: getX(i, data.length),
      y: getY(d.value),
    }));

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

    if (closePath) {
      path.lineTo(width, CHART_HEIGHT);
      path.lineTo(0, CHART_HEIGHT);
      path.close();
    }

    return path;
  };

  const paths = useMemo(() => {
    return {
      layer1: generateSmoothPath(data1, true),
      layer2: generateSmoothPath(data2, true),
      layer3: generateSmoothPath(data3, true),
      layer4: generateSmoothPath(data4, true),
      line: generateSmoothPath(data2, false), // White line follows data2
    };
  }, [data1, data2, data3, data4, width, CHART_HEIGHT, maxVal]);

  // Data points for the white line (data2)
  const dataPoints = useMemo(() => {
    return data2.map((d, i) => ({
      x: getX(i, data2.length),
      y: getY(d.value),
      value: d.value,
      label: d.label,
      isLast: i === data2.length - 1,
      index: i, // Add index for label logic
    }));
  }, [data2, width, CHART_HEIGHT, maxVal]);

  return (
    <Canvas style={[{ width, height }, style]}>
      {/* Layer 1: Bottom/Largest - Darkest Green */}
      <Path path={paths.layer1} color='#00A26B' style='fill' />

      {/* Layer 2: Middle - Medium Green */}
      <Path path={paths.layer2} color='#00AF70' style='fill' />

      {/* Layer 3: Top - Lightest Green */}
      <Path path={paths.layer3} color='#00BC74' style='fill' />

      {/* Layer 4: River Bed - Black */}
      <Path path={paths.layer4} color='#000000' style='fill' />

      {/* White Line on top of Layer 2 boundary */}
      <Path
        path={paths.line}
        color='white'
        style='stroke'
        strokeWidth={3}
        strokeCap='round'
        strokeJoin='round'
      />

      {/* Data Points */}
      {dataPoints.map((point, index) => (
        <Group key={index}>
          {point.isLast ? (
            // Last point: Large solid white circle
            <Circle cx={point.x} cy={point.y} r={6} color='white' />
          ) : (
            // Other points: Black circle with white stroke
            <Group>
              <Circle
                cx={point.x}
                cy={point.y}
                r={5}
                color='white'
                style='stroke'
                strokeWidth={2}
              />
              <Circle cx={point.x} cy={point.y} r={5} color='black' />
            </Group>
          )}

          {/* X-Axis Labels */}
          {point.label && font && fontBold && (
            <Group>
              {/* Day Name (e.g., "Tue") */}
              <Text
                x={(() => {
                  const text = point.label.split(' ')[0];
                  const textWidth = font.getTextWidth(text);
                  if (index === 0) return 0; // Left align first
                  if (index === dataPoints.length - 1) return width - textWidth; // Right align last
                  return point.x - textWidth / 2; // Center others
                })()}
                y={CHART_HEIGHT + 15}
                text={point.label.split(' ')[0]}
                font={font}
                color='#8E8E93' // Secondary label color
              />
              {/* Date Number (e.g., "11") */}
              <Text
                x={(() => {
                  const text = point.label.split(' ')[1];
                  const textWidth = fontBold.getTextWidth(text);
                  if (index === 0) return 0; // Left align first
                  if (index === dataPoints.length - 1) return width - textWidth; // Right align last
                  return point.x - textWidth / 2; // Center others
                })()}
                y={CHART_HEIGHT + 32}
                text={point.label.split(' ')[1]}
                font={fontBold}
                color='white'
              />
            </Group>
          )}
        </Group>
      ))}
    </Canvas>
  );
};
