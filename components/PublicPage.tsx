import { Link } from 'expo-router';
import { ReactNode } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '../constants/theme';

type PublicPageProps = {
  children: ReactNode;
  description: string;
  title: string;
};

type PublicSectionProps = {
  children: ReactNode;
  title: string;
};

export function PublicSection({ children, title }: PublicSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function PublicParagraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function PublicBullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function SupportEmailLink() {
  return (
    <Link href="mailto:unforget.support@gmail.com" asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.emailButton,
          pressed && styles.emailButtonPressed,
        ]}
      >
        <Text style={styles.emailButtonText}>unforget.support@gmail.com</Text>
        <Text style={styles.emailArrow}>↗</Text>
      </Pressable>
    </Link>
  );
}

export function PublicPage({ children, description, title }: PublicPageProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.navigation}>
            <Link href="/" style={styles.brandLink}>
              <Image
                accessibilityLabel="Unforget logo"
                resizeMode="contain"
                source={require('../assets/logo.png')}
                style={styles.logo}
              />
              <Text style={styles.brand}>unforget</Text>
            </Link>

            <View style={styles.navigationLinks}>
              <Link href="../support" style={styles.navigationLink}>
                Support
              </Link>
              <Link href="../privacy" style={styles.navigationLink}>
                Privacy
              </Link>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>UNFORGET</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.rule} />
          <View style={styles.body}>{children}</View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Zakaria Zair</Text>
            <Text style={styles.footerText}>Advice worth remembering.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 40,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  brandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    textDecorationLine: 'none',
  },
  logo: {
    width: 38,
    height: 38,
  },
  brand: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.5,
  },
  navigationLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navigationLink: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    textDecorationLine: 'none',
  },
  hero: {
    maxWidth: 720,
    paddingTop: 92,
    paddingBottom: 56,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 14,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 58,
    letterSpacing: -1.6,
    lineHeight: 64,
  },
  description: {
    maxWidth: 620,
    marginTop: 20,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 29,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  body: {
    maxWidth: 720,
    paddingTop: 34,
    paddingBottom: 44,
  },
  section: {
    marginBottom: 34,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 36,
  },
  paragraph: {
    marginBottom: 12,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 27,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    marginTop: 9,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  bulletText: {
    flex: 1,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
  emailButton: {
    maxWidth: 410,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.ink,
  },
  emailButtonPressed: {
    opacity: 0.84,
  },
  emailButtonText: {
    color: colors.white,
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
  },
  emailArrow: {
    color: colors.accent,
    fontFamily: fonts.bodySemibold,
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 24,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    color: colors.faint,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
