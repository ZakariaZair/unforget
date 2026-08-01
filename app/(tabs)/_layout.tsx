import { Tabs } from 'expo-router';
import { ComponentProps, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../../constants/theme';

type BookTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

type BookPageProps = {
  accessibilityLabel?: string;
  isFocused: boolean;
  isLeftPage: boolean;
  label: string;
  onLongPress: () => void;
  onPress: () => void;
  reduceMotion: boolean;
};

function useReduceMotionEnabled() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) {
        setReduceMotion(isEnabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function BookPage({
  accessibilityLabel,
  isFocused,
  isLeftPage,
  label,
  onLongPress,
  onPress,
  reduceMotion,
}: BookPageProps) {
  const selectionProgress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    selectionProgress.stopAnimation();

    if (reduceMotion) {
      selectionProgress.setValue(isFocused ? 1 : 0);
      return;
    }

    Animated.spring(selectionProgress, {
      toValue: isFocused ? 1 : 0,
      damping: 16,
      stiffness: 190,
      mass: 0.82,
      useNativeDriver: true,
    }).start();
  }, [isFocused, reduceMotion, selectionProgress]);

  const rotateZ = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: isLeftPage ? ['0deg', '2.4deg'] : ['0deg', '-2.4deg'],
  });
  const translateY = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const labelOpacity = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.62, 1],
  });
  return (
    <View
      style={[
        styles.pageSlot,
        { zIndex: isFocused ? 4 : 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.pageLeaf,
          {
            transformOrigin: isLeftPage ? 'right bottom' : 'left bottom',
            transform: [{ translateY }, { rotateZ }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={accessibilityLabel}
          onLongPress={onLongPress}
          onPress={onPress}
          style={({ pressed }) => [
            styles.pagePressTarget,
            pressed && styles.pagePressed,
          ]}
        >
          <View style={styles.pageBack} />
          <View
            style={[
              styles.pageFace,
              isLeftPage ? styles.leftPageFace : styles.rightPageFace,
              isFocused ? styles.pageFaceSelected : styles.pageFaceIdle,
            ]}
          />
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.pageLabelContainer,
          {
            opacity: labelOpacity,
            transformOrigin: isLeftPage ? 'right bottom' : 'left bottom',
            transform: [{ translateY }, { rotateZ }],
          },
        ]}
      >
        <Text
          style={[
            styles.pageLabel,
            isFocused ? styles.pageLabelSelected : styles.pageLabelIdle,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

function BookTabBar({ state, descriptors, navigation }: BookTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotionEnabled();

  return (
    <View
      style={[
        styles.tabBarArea,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View pointerEvents="none" style={styles.tabBarBackground} />
      <View style={styles.bookStage}>
        <View style={styles.book}>
          <View pointerEvents="none" style={styles.bookCover} />
          <View pointerEvents="none" style={styles.paperBlock} />

          <View style={styles.pageRow}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const { options } = descriptors[route.key];
              const label = typeof options.title === 'string' ? options.title : route.name;
              const isLeftPage = index === 0;

              function handlePress() {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }

              function handleLongPress() {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }

              return (
                <BookPage
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  isFocused={isFocused}
                  isLeftPage={isLeftPage}
                  key={route.key}
                  label={label}
                  onLongPress={handleLongPress}
                  onPress={handlePress}
                  reduceMotion={reduceMotion}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BookTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Remember' }} />
      <Tabs.Screen name="archive" options={{ title: 'Archive' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  tabBarBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
    backgroundColor: colors.canvas,
  },
  bookStage: {
    position: 'relative',
    width: '100%',
    maxWidth: 460,
    height: 84,
    zIndex: 1,
    overflow: 'visible',
  },
  book: {
    position: 'relative',
    width: '100%',
    height: 84,
    zIndex: 1,
    paddingHorizontal: 10,
    overflow: 'visible',
    transformOrigin: 'center bottom',
    transform: [
      { perspective: 900 },
      { rotateX: '28deg' },
    ],
  },
  bookCover: {
    position: 'absolute',
    right: 12,
    bottom: 2,
    left: 12,
    height: 43,
    zIndex: 0,
    borderRadius: 7,
    backgroundColor: colors.bookCover,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  paperBlock: {
    position: 'absolute',
    right: 15,
    bottom: 4,
    left: 15,
    height: 42,
    zIndex: 1,
    borderRadius: 6,
    backgroundColor: colors.bookPaper,
  },
  pageRow: {
    position: 'absolute',
    right: 10,
    bottom: 6,
    left: 10,
    height: 47,
    zIndex: 3,
    flexDirection: 'row',
  },
  pageSlot: {
    position: 'relative',
    width: '50%',
    height: 47,
    overflow: 'visible',
  },
  pageLeaf: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'visible',
  },
  pagePressTarget: {
    flex: 1,
  },
  pagePressed: {
    opacity: 0.78,
  },
  pageBack: {
    position: 'absolute',
    top: 2,
    right: 1,
    bottom: 0,
    left: 1,
    zIndex: 0,
    borderRadius: 5,
    backgroundColor: colors.bookPaper,
  },
  pageFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 2,
    left: 0,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageFaceSelected: {
    backgroundColor: colors.surface,
  },
  pageFaceIdle: {
    backgroundColor: colors.bookPage,
  },
  leftPageFace: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  rightPageFace: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 5,
  },
  pageLabelContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  pageLabel: {
    fontSize: 12,
    letterSpacing: -0.15,
  },
  pageLabelSelected: {
    color: colors.ink,
    fontFamily: fonts.bodySemibold,
  },
  pageLabelIdle: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
  },
});
