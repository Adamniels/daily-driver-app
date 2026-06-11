/**
 * XP per day, last 30 days: smoothed area (catmull-rom → bezier) plus a
 * 7 day rolling average line. Pure SVG, no chart library.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { RouterOutputs } from '@/lib/trpc';
import { palette } from '@/theme/colors';

type XpHistory = RouterOutputs['stats']['xpHistory'];

const HEIGHT = 150;
const PAD_TOP = 12;

interface Point {
  x: number;
  y: number;
}

/**
 * Catmull-Rom spline through the points, emitted as cubic beziers.
 * Control point y is clamped to the chart band so sharp drops to zero
 * don't overshoot below the baseline.
 */
function smoothPath(points: Point[], yMin = 0, yMax = HEIGHT): string {
  if (points.length === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (points.length < 3) {
    return `M${first.x},${first.y} ${points.map((p) => `L${p.x},${p.y}`).join(' ')}`;
  }
  const clamp = (y: number) => Math.min(yMax, Math.max(yMin, y));
  let d = `M${first.x},${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function rollingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/** Short label like "12 May". */
function shortDate(date: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(date.slice(8, 10))} ${months[Number(date.slice(5, 7)) - 1] ?? ''}`;
}

export function XpChart({ history }: { history: XpHistory }) {
  const [width, setWidth] = useState(0);

  const max = Math.max(...history.map((d) => d.xp), 10);
  const toPoint = (xp: number, i: number): Point => ({
    x: history.length > 1 ? (i / (history.length - 1)) * width : 0,
    y: PAD_TOP + (1 - xp / max) * (HEIGHT - PAD_TOP),
  });

  const xpPoints = history.map((d, i) => toPoint(d.xp, i));
  const avgPoints = rollingAverage(
    history.map((d) => d.xp),
    7,
  ).map((v, i) => toPoint(v, i));

  const line = smoothPath(xpPoints);
  const area = line ? `${line} L${width},${HEIGHT} L0,${HEIGHT} Z` : '';
  const avgLine = smoothPath(avgPoints);

  const mid = history[Math.floor(history.length / 2)];
  const firstDay = history[0];
  const lastDay = history[history.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && history.length > 1 && (
        <>
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.violet} stopOpacity={0.35} />
                <Stop offset="1" stopColor={palette.violet} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            <Path d={area} fill="url(#xpFill)" />
            <Path d={line} stroke={palette.violet} strokeWidth={2.5} fill="none" />
            <Path
              d={avgLine}
              stroke={palette.mint}
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
            />
          </Svg>
          <View className="mt-1 flex-row justify-between">
            <Text className="font-sans text-xs text-ink/40">{firstDay ? shortDate(firstDay.date) : ''}</Text>
            <Text className="font-sans text-xs text-ink/40">{mid ? shortDate(mid.date) : ''}</Text>
            <Text className="font-sans text-xs text-ink/40">{lastDay ? shortDate(lastDay.date) : ''}</Text>
          </View>
          <View className="mt-1 flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <View className="h-1 w-5 rounded-full bg-violet" />
              <Text className="font-sans text-xs text-ink/50">daily XP</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-1 w-5 rounded-full bg-mint" />
              <Text className="font-sans text-xs text-ink/50">7 day average</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
