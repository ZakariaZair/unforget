import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '../constants/theme';

const TREE_HEIGHT = 220;

type Branch = {
  angle: number;
  delay: number;
  length: number;
  thickness: number;
  x: number;
  y: number;
};

type Leaf = {
  angle: number;
  delay: number;
  x: number;
  y: number;
};

type Tree = {
  branches: Branch[];
  leaves: Leaf[];
};

let hasPlayedTreeAnimation = false;

function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum);
}

function clampAngle(angle: number) {
  return Math.max(5, Math.min(175, angle));
}

function createTree(width: number): Tree {
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];
  const centerX = width / 2;
  const junctionY = 84;

  branches.push({
    angle: 90,
    delay: 260,
    length: 32,
    thickness: 3,
    x: centerX,
    y: 52,
  });

  function growBranch(
    x: number,
    y: number,
    length: number,
    angle: number,
    generationsRemaining: number,
    delay: number,
  ) {
    const constrainedAngle = clampAngle(angle);
    const radians = (constrainedAngle * Math.PI) / 180;
    const endX = x + Math.cos(radians) * length;
    const endY = y + Math.sin(radians) * length;

    branches.push({
      angle: constrainedAngle,
      delay,
      length,
      thickness: 1.45 + generationsRemaining * 0.45,
      x,
      y,
    });

    if (generationsRemaining === 0) {
      leaves.push({
        angle: constrainedAngle + randomBetween(-24, 24),
        delay: delay + 560,
        x: endX,
        y: endY,
      });
      return;
    }

    const nextLength = length * randomBetween(0.66, 0.76);
    const spread = randomBetween(25, 38);
    const nextDelay = delay + randomBetween(300, 390);

    growBranch(
      endX,
      endY,
      nextLength,
      constrainedAngle - spread + randomBetween(-6, 6),
      generationsRemaining - 1,
      nextDelay,
    );
    growBranch(
      endX,
      endY,
      nextLength,
      constrainedAngle + spread + randomBetween(-6, 6),
      generationsRemaining - 1,
      nextDelay + randomBetween(45, 120),
    );
  }

  growBranch(centerX, junctionY, 54, randomBetween(18, 31), 2, 560);
  growBranch(centerX, junctionY, 54, randomBetween(149, 162), 2, 610);
  growBranch(centerX, junctionY, 46, randomBetween(82, 98), 1, 700);

  return { branches, leaves };
}

export function AdviceTree() {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(Math.max(windowWidth - 48, 280), 440);
  const tree = useRef<Tree | null>(null);

  if (!tree.current) {
    tree.current = createTree(width);
  }

  const branches = tree.current.branches;
  const leaves = tree.current.leaves;
  const shouldAnimate = useRef(!hasPlayedTreeAnimation).current;
  const logoProgress = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const branchProgress = useRef(
    branches.map(() => new Animated.Value(shouldAnimate ? 0 : 1)),
  ).current;
  const leafProgress = useRef(
    leaves.map(() => new Animated.Value(shouldAnimate ? 0 : 1)),
  ).current;

  useEffect(() => {
    let isMounted = true;
    let treeAnimation: Animated.CompositeAnimation | undefined;

    async function startAnimation() {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();

      if (!isMounted) {
        return;
      }

      if (!shouldAnimate || reduceMotion) {
        logoProgress.setValue(1);
        branchProgress.forEach((progress) => progress.setValue(1));
        leafProgress.forEach((progress) => progress.setValue(1));
        hasPlayedTreeAnimation = true;
        return;
      }

      hasPlayedTreeAnimation = true;
      treeAnimation = Animated.parallel([
        Animated.spring(logoProgress, {
          toValue: 1,
          damping: 13,
          stiffness: 125,
          mass: 0.8,
          useNativeDriver: true,
        }),
        ...branches.map((branch, index) =>
          Animated.timing(branchProgress[index], {
            toValue: 1,
            delay: branch.delay,
            duration: 620,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
        ...leaves.map((leaf, index) =>
          Animated.sequence([
            Animated.delay(leaf.delay),
            Animated.spring(leafProgress[index], {
              toValue: 1,
              damping: 9,
              stiffness: 170,
              mass: 0.65,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]);

      treeAnimation.start();
    }

    void startAnimation();

    return () => {
      isMounted = false;
      treeAnimation?.stop();
    };
  }, [branchProgress, branches, leafProgress, leaves, logoProgress, shouldAnimate]);

  const logoScale = logoProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { width }]}
    >
      {branches.map((branch, index) => (
        <Animated.View
          key={`branch-${index}`}
          style={[
            styles.branch,
            {
              height: branch.thickness,
              left: branch.x,
              opacity: branchProgress[index],
              top: branch.y,
              width: branch.length,
              transformOrigin: 'left center',
              transform: [
                { rotateZ: `${branch.angle}deg` },
                { scaleX: branchProgress[index] },
              ],
            },
          ]}
        />
      ))}

      {leaves.map((leaf, index) => (
        <Animated.View
          key={`leaf-${index}`}
          style={[
            styles.leaf,
            {
              left: leaf.x - 4,
              opacity: leafProgress[index],
              top: leaf.y - 6,
              transform: [
                { rotateZ: `${leaf.angle}deg` },
                { scale: leafProgress[index] },
              ],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.logoContainer,
          {
            left: width / 2 - 46,
            opacity: logoProgress,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: TREE_HEIGHT,
    alignSelf: 'center',
  },
  branch: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  leaf: {
    position: 'absolute',
    width: 9,
    height: 14,
    borderTopLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: colors.accent,
  },
  logoContainer: {
    position: 'absolute',
    top: -12,
    width: 92,
    height: 92,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
