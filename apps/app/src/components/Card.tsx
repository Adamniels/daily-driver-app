/** Soft card: white, big radius, gentle shadow. */
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

export function Card({ children, className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      {...rest}
      className={`rounded-card bg-white p-4 shadow-sm shadow-ink/10 ${className}`}
    >
      {children}
    </View>
  );
}
