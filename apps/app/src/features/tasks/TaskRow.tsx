/**
 * One task row. Open tasks: tap the circle to complete (works on every
 * platform), swipe right to complete / swipe left to delete on touch
 * devices, tap the row to edit. Done tasks: dimmed, tap to uncomplete.
 */
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Swipeable, { SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BellIcon } from '@/components/icons';
import { formatDateTime, relativeTime } from '@/lib/dates';
import { notificationsSupported, toDate } from '@/lib/notifications';
import { palette } from '@/theme/colors';
import type { TaskItem } from './types';

function CompleteCircle({ done, onPress }: { done: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={onPress}
      hitSlop={10}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: done ? palette.mint : `${palette.ink}33`,
        backgroundColor: done ? palette.mint : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done && (
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M5 12.5 L10 17.5 L19 7"
            stroke="white"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </Pressable>
  );
}

interface OpenTaskRowProps {
  task: TaskItem;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function OpenTaskRow({ task, onComplete, onDelete, onEdit }: OpenTaskRowProps) {
  const remindAt = task.remindAt ? toDate(task.remindAt) : null;
  const swipeRef = useRef<SwipeableMethods>(null);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()}>
      <Swipeable
        ref={swipeRef}
        friction={1.5}
        leftThreshold={64}
        rightThreshold={64}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={() => (
          <View className="flex-1 flex-row items-center rounded-card bg-mint pl-5">
            <Text className="font-sans-bold text-white">done</Text>
          </View>
        )}
        renderRightActions={() => (
          <View className="flex-1 flex-row items-center justify-end rounded-card bg-coral pr-5">
            <Text className="font-sans-bold text-white">delete</Text>
          </View>
        )}
        onSwipeableOpen={(direction) => {
          swipeRef.current?.close();
          if (direction === SwipeDirection.LEFT) onComplete();
          else onDelete();
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          className="flex-row items-center gap-3 rounded-card bg-white p-4 shadow-sm shadow-ink/10"
        >
          <CompleteCircle done={false} onPress={onComplete} />
          <View className="flex-1 gap-0.5">
            <Text className="font-sans-bold text-base text-ink" numberOfLines={1}>
              {task.title}
            </Text>
            {!!task.notes && (
              <Text className="font-sans text-xs text-ink/50" numberOfLines={1}>
                {task.notes}
              </Text>
            )}
            {remindAt && (
              <View className="mt-0.5 flex-row items-center gap-1">
                <BellIcon size={12} color={remindAt.getTime() < Date.now() ? palette.coral : palette.violet} />
                <Text className="font-sans-bold text-xs text-ink/50">
                  {formatDateTime(remindAt)}
                  {!notificationsSupported ? ' (fires on your phone)' : ''}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

export function DoneTaskRow({ task, onUncomplete }: { task: TaskItem; onUncomplete: () => void }) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()}>
      <Pressable
        accessibilityRole="button"
        onPress={onUncomplete}
        className="flex-row items-center gap-3 rounded-card bg-white/60 p-4"
      >
        <CompleteCircle done onPress={onUncomplete} />
        <Text className="flex-1 font-sans text-base text-ink/40 line-through" numberOfLines={1}>
          {task.title}
        </Text>
        {task.completedAt && (
          <Text className="font-sans text-xs text-ink/40">{relativeTime(toDate(task.completedAt))}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
