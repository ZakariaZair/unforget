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

import { colors, fonts } from '../constants/theme';

export const ADVICE_TREE_HEIGHT = 276;
const TREE_SEED = Math.floor(Math.random() * 2_147_483_646) + 1;

type Branch = {
  angle: number;
  delay: number;
  isTerminal: boolean;
  length: number;
  thickness: number;
  x: number;
  y: number;
};

type Tree = {
  branches: Branch[];
};

type GrowthNode = {
  angle: number;
  children: number;
  depth: number;
  firstTurn: -1 | 1;
  length: number;
  x: number;
  y: number;
};

function createRandom(seed: number) {
  let state = seed % 2_147_483_647;

  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}

function clampAngle(angle: number) {
  return Math.max(5, Math.min(175, angle));
}

function createTree(width: number, adviceCount: number): Tree {
  const branches: Branch[] = [];
  const nodes: GrowthNode[] = [];
  const random = createRandom(TREE_SEED);
  const targetTipCount = Math.max(0, Math.floor(adviceCount));
  const centerX = width / 2;
  const lowerBoundary = ADVICE_TREE_HEIGHT - 18;

  function addBranch(
    parent: GrowthNode | null,
    x: number,
    y: number,
    length: number,
    angle: number,
    depth: number,
    delay: number,
  ) {
    let constrainedAngle = clampAngle(angle);
    let radians = (constrainedAngle * Math.PI) / 180;
    let endX = x + Math.cos(radians) * length;
    let endY = y + Math.sin(radians) * length;

    if (endX < 14) {
      constrainedAngle = randomBetween(random, 18, 68);
    } else if (endX > width - 14) {
      constrainedAngle = randomBetween(random, 112, 162);
    }

    if (endY > lowerBoundary) {
      constrainedAngle =
        x < centerX
          ? randomBetween(random, 6, 24)
          : randomBetween(random, 156, 174);
    }

    radians = (constrainedAngle * Math.PI) / 180;
    endX = x + Math.cos(radians) * length;
    endY = y + Math.sin(radians) * length;

    branches.push({
      angle: constrainedAngle,
      delay,
      isTerminal: false,
      length,
      thickness: Math.max(1.25, 3 - depth * 0.36),
      x,
      y,
    });

    if (parent) {
      parent.children += 1;
    }

    const node: GrowthNode = {
      angle: constrainedAngle,
      children: 0,
      depth,
      firstTurn:
        constrainedAngle < 78
          ? 1
          : constrainedAngle > 102
            ? -1
            : random() > 0.5
              ? 1
              : -1,
      length,
      x: endX,
      y: endY,
    };

    nodes.push(node);
    return node;
  }

  if (targetTipCount === 0) {
    return { branches };
  }

  const trunk = addBranch(null, centerX, 62, 43, 90, 0, 260);
  const candidates: GrowthNode[] = [];
  const rightAngle = randomBetween(random, 18, 31);
  const leftAngle = randomBetween(random, 149, 162);
  const centerAngle = randomBetween(random, 82, 98);
  const mainAngles =
    targetTipCount === 1
      ? [centerAngle]
      : targetTipCount === 2
        ? [rightAngle, leftAngle]
        : [rightAngle, leftAngle, centerAngle];

  for (const angle of mainAngles) {
    const branch = addBranch(
      trunk,
      trunk.x,
      trunk.y,
      angle > 75 && angle < 105 ? 56 : 66,
      angle,
      1,
      560 + candidates.length * 70,
    );
    candidates.push(branch);
  }

  let terminalTipCount = candidates.length;

  while (terminalTipCount < targetTipCount) {
    const parent = candidates.shift() ?? trunk;
    const spread = randomBetween(random, 24, 37);
    const nextLength = Math.max(
      12,
      parent.length * randomBetween(random, 0.65, 0.76),
    );
    const nextDelay =
      540 + parent.depth * 320 + branches.length * 22 + randomBetween(random, 0, 90);
    const firstBranch = addBranch(
      parent,
      parent.x,
      parent.y,
      nextLength,
      parent.angle + parent.firstTurn * spread + randomBetween(random, -6, 6),
      parent.depth + 1,
      nextDelay,
    );
    const secondBranch = addBranch(
      parent,
      parent.x,
      parent.y,
      nextLength * randomBetween(random, 0.9, 1.04),
      parent.angle - parent.firstTurn * spread + randomBetween(random, -6, 6),
      parent.depth + 1,
      nextDelay + randomBetween(random, 45, 110),
    );

    if (random() > 0.5) {
      candidates.push(firstBranch, secondBranch);
    } else {
      candidates.push(secondBranch, firstBranch);
    }
    terminalTipCount += 1;
  }

  nodes.forEach((node, index) => {
    branches[index].isTerminal = node.children === 0;
  });

  return { branches };
}

type AdviceTreeProps = {
  adviceCount: number;
};

export function AdviceTree({ adviceCount }: AdviceTreeProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(Math.max(windowWidth - 48, 280), 440);
  const tree = useRef<Tree | null>(null);

  if (!tree.current) {
    tree.current = createTree(width, adviceCount);
  }

  const branches = tree.current.branches;
  const logoProgress = useRef(new Animated.Value(0)).current;
  const branchProgress = useRef(
    branches.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    let isMounted = true;
    let treeAnimation: Animated.CompositeAnimation | undefined;

    async function startAnimation() {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();

      if (!isMounted) {
        return;
      }

      if (reduceMotion) {
        logoProgress.setValue(1);
        branchProgress.forEach((progress) => progress.setValue(1));
        return;
      }

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
      ]);

      treeAnimation.start();
    }

    void startAnimation();

    return () => {
      isMounted = false;
      treeAnimation?.stop();
    };
  }, [branchProgress, branches, logoProgress]);

  const logoScale = logoProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });
  const emptyTextOpacity = logoProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.34],
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
        >
          {branch.isTerminal ? (
            <>
              <View style={styles.branchCore} />
              <View style={styles.branchFade} />
            </>
          ) : (
            <View style={styles.branchSolid} />
          )}
        </Animated.View>
      ))}

      <Animated.View
        style={[
          styles.logoContainer,
          {
            left: width / 2 - 52,
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

      {adviceCount === 0 ? (
        <Animated.Text style={[styles.emptyText, { opacity: emptyTextOpacity }]}>
          No advice yet
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: ADVICE_TREE_HEIGHT,
    alignSelf: 'center',
  },
  branch: {
    position: 'absolute',
    borderRadius: 2,
  },
  branchSolid: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  branchCore: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '70%',
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  branchFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: '70%',
    experimental_backgroundImage: `linear-gradient(90deg, ${colors.ink} 0%, transparent 100%)`,
  },
  logoContainer: {
    position: 'absolute',
    top: -10,
    width: 104,
    height: 104,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    position: 'absolute',
    top: 112,
    right: 0,
    left: 0,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
