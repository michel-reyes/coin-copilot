import colors from '@/themes/colors';
import { ExpenditureDataPoint } from '@/utils/expenditure';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface ExpenditureTrendChartProps {
  data: ExpenditureDataPoint[];
  width: number;
  height?: number;
}

/**
 * Expenditure Trend Chart - MacroFactor style
 * Shows:
 * - Grey dashed line: Raw daily expenditure (noise)
 * - Orange solid line with area: Smoothed trend (signal)
 */
export function ExpenditureTrendChart({
  data,
  width,
  height = 200,
}: ExpenditureTrendChartProps) {
  // Transform data for gifted-charts format
  const chartData = useMemo(() => {
    if (data.length === 0) return { rawData: [], trendData: [] };

    // Format date labels (show every 3rd date to avoid crowding)
    const formatLabel = (dateStr: string, index: number) => {
      if (index % 3 !== 0) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Raw daily expenditure (grey dashed line)
    const rawData = data.map((point, index) => ({
      value: point.dailyExpenditure,
      label: formatLabel(point.date, index),
      dataPointText: '',
    }));

    // Trend expenditure (orange solid line with area)
    const trendData = data.map((point) => ({
      value: point.trendExpenditure,
    }));

    return { rawData, trendData };
  }, [data]);

  // Calculate Y-axis bounds
  const yAxisConfig = useMemo(() => {
    if (data.length === 0) return { maxValue: 200, noOfSections: 4 };

    const allValues = data.flatMap((d) => [d.dailyExpenditure, d.trendExpenditure]);
    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);

    // Round max to nice number for Y-axis
    const roundedMax = Math.ceil(maxVal / 50) * 50;
    const noOfSections = 4;

    return { maxValue: roundedMax, noOfSections };
  }, [data]);

  if (data.length === 0) {
    return <View style={{ width, height }} />;
  }

  // Spacing calculation for responsive chart
  const spacing = (width - 60) / Math.max(data.length - 1, 1);

  return (
    <View style={{ width }}>
      <LineChart
        // Data
        data={chartData.rawData}
        data2={chartData.trendData}
        // Chart dimensions
        width={width - 40}
        height={height}
        spacing={spacing}
        initialSpacing={10}
        endSpacing={10}
        // Line 1 styling (raw - grey dashed)
        color={colors['system-text-tertiary']}
        thickness={1.5}
        strokeDashArray={[5, 5]}
        hideDataPoints
        // Line 2 styling (trend - orange solid with area)
        color2="#FF6B35"
        thickness2={3}
        hideDataPoints2
        curved
        curvature={0.2}
        // Area chart for trend line only
        areaChart
        areaChart2
        startFillColor="transparent"
        endFillColor="transparent"
        startFillColor2="rgba(255, 107, 53, 0.3)"
        endFillColor2="rgba(255, 107, 53, 0.05)"
        startOpacity2={0.8}
        endOpacity2={0.1}
        // Y-axis
        maxValue={yAxisConfig.maxValue}
        noOfSections={yAxisConfig.noOfSections}
        yAxisColor="transparent"
        yAxisTextStyle={{
          color: colors['system-text-tertiary'],
          fontSize: 10,
        }}
        yAxisLabelPrefix="$"
        // X-axis
        xAxisColor="transparent"
        xAxisLabelTextStyle={{
          color: colors['system-text-tertiary'],
          fontSize: 10,
        }}
        // Rules (horizontal grid lines)
        rulesType="dashed"
        rulesColor="rgba(255, 255, 255, 0.1)"
        dashWidth={4}
        dashGap={4}
        // Pointer config for interactions
        pointerConfig={{
          pointerStripHeight: height,
          pointerStripColor: 'rgba(255, 255, 255, 0.2)',
          pointerStripWidth: 1,
          pointerColor: '#FF6B35',
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 60,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number }[]) => {
            return (
              <View
                style={{
                  backgroundColor: colors['system-surface'],
                  padding: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors['system-border'],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors['system-text-tertiary'] }} />
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ marginRight: 4 }}>
                      <View style={{ height: 1, backgroundColor: colors['system-text-tertiary'], width: 12 }} />
                    </View>
                  </View>
                  <View>
                    <View style={{ color: colors['system-text-secondary'], fontSize: 12 }}>
                      ${items[0]?.value?.toFixed(0) ?? 0}
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' }} />
                  <View>
                    <View style={{ color: '#FF6B35', fontSize: 12, fontWeight: '600' }}>
                      ${items[1]?.value?.toFixed(0) ?? 0}
                    </View>
                  </View>
                </View>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

