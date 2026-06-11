/**
 * Number that counts up to its value ("everything that changes value
 * animates"). requestAnimationFrame + ease-out keeps it identical on
 * native and web; re-animates from the current display value on change.
 */
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

interface CountUpProps {
  value: number;
  className?: string;
  durationMs?: number;
  format?: (value: number) => string;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export function CountUp({
  value,
  className,
  durationMs = 900,
  format = (v) => String(v),
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === value) return;
    const start = Date.now();
    let frame: number;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const v = Math.round(from + (value - from) * easeOutCubic(t));
      current.current = v;
      setDisplay(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <Text className={className}>{format(display)}</Text>;
}
