/**
 * GitHub style year heatmap: 53 week columns × 7 day rows, custom SVG.
 * Intensity = daily completion rate in 5 violet steps, empty = soft gray.
 * Horizontal scroll, current week anchored right. Tap a cell → popover
 * with date, completion count and rate.
 */
import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { addDays } from '@habit/core';
import type { DateString } from '@habit/core';
import type { RouterOutputs } from '@/lib/trpc';
import { palette } from '@/theme/colors';

type HeatmapCells = RouterOutputs['stats']['heatmap'];

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LABEL_H = 18;
const EMPTY = '#3D3A4B14';

/** 5 intensity steps of the violet token. */
function fillFor(rate: number, count: number): string {
  if (count === 0 && rate === 0) return EMPTY;
  const step = rate <= 0.2 ? '26' : rate <= 0.4 ? '4D' : rate <= 0.6 ? '80' : rate <= 0.8 ? 'B3' : 'FF';
  return `${palette.violet}${step}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Selected {
  date: DateString;
  count: number;
  rate: number;
  x: number;
  y: number;
}

interface YearHeatmapProps {
  cells: HeatmapCells;
  /** Monday of the grid's first column. */
  gridStart: DateString;
  today: DateString;
  /** XP earned per day where known (joined from xpHistory). */
  xpByDate: ReadonlyMap<string, number>;
}

export function YearHeatmap({ cells, gridStart, today, xpByDate }: YearHeatmapProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState<Selected | null>(null);

  const byDate = useMemo(() => new Map(cells.map((c) => [c.date, c])), [cells]);

  const weeks = useMemo(() => {
    const result: { x: number; monthLabel: string | null; days: { date: DateString; y: number }[] }[] = [];
    let prevMonth = -1;
    for (let w = 0; ; w++) {
      const monday = addDays(gridStart, w * 7);
      if (monday > today && w > 0) break;
      const month = Number(monday.slice(5, 7)) - 1;
      const monthLabel = month !== prevMonth ? (MONTHS[month] ?? null) : null;
      prevMonth = month;
      const days: { date: DateString; y: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(monday, d);
        if (date > today) break;
        days.push({ date, y: LABEL_H + d * STEP });
      }
      result.push({ x: w * STEP, monthLabel, days });
      if (result.length >= 54) break;
    }
    return result;
  }, [gridStart, today]);

  const width = weeks.length * STEP + GAP;
  const height = LABEL_H + 7 * STEP;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View style={{ width, height: height + 4 }}>
          {/* month labels as RN Text (font consistency beats SVG text) */}
          {weeks.map(
            (week) =>
              week.monthLabel && (
                <Text
                  key={`m-${week.x}`}
                  className="absolute font-sans-bold text-xs text-ink/40"
                  style={{ left: week.x, top: 0 }}
                >
                  {week.monthLabel}
                </Text>
              ),
          )}
          <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
            {weeks.flatMap((week) =>
              week.days.map(({ date, y }) => {
                const cell = byDate.get(date);
                const count = cell?.count ?? 0;
                const rate = cell?.rate ?? 0;
                return (
                  <Rect
                    key={date}
                    x={week.x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={3.5}
                    fill={fillFor(rate, count)}
                    stroke={selected?.date === date ? palette.ink : 'none'}
                    strokeWidth={selected?.date === date ? 1.5 : 0}
                    onPress={() =>
                      setSelected((cur) =>
                        cur?.date === date ? null : { date, count, rate, x: week.x, y },
                      )
                    }
                  />
                );
              }),
            )}
          </Svg>

          {selected && (
            <View
              className="absolute items-start rounded-xl bg-ink px-3 py-2 shadow-lg"
              style={{
                left: Math.min(Math.max(selected.x - 60, 0), width - 150),
                top: selected.y > height / 2 ? selected.y - 74 : selected.y + CELL + 6,
                width: 150,
              }}
              pointerEvents="none"
            >
              <Text className="font-sans-bold text-xs text-white">{selected.date}</Text>
              <Text className="font-sans text-xs text-white/80">
                {selected.count} {selected.count === 1 ? 'completion' : 'completions'}
                {selected.count > 0 ? ` · ${Math.round(selected.rate * 100)}%` : ''}
              </Text>
              {(xpByDate.get(selected.date) ?? 0) > 0 && (
                <Text className="font-sans text-xs text-white/80">
                  +{xpByDate.get(selected.date)} XP
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <View className="mt-2 flex-row items-center justify-end gap-1.5">
        <Text className="font-sans text-xs text-ink/40">less</Text>
        {[EMPTY, `${palette.violet}26`, `${palette.violet}4D`, `${palette.violet}80`, `${palette.violet}B3`, palette.violet].map(
          (color) => (
            <View key={color} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
          ),
        )}
        <Text className="font-sans text-xs text-ink/40">more</Text>
      </View>
    </View>
  );
}
