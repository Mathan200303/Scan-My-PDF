import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Zap, FileText } from 'lucide-react-native';
import { SettingsRepository } from '../storage/settingsRepository';
import { FileService } from '../services/fileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Animation values - Initialized for slow-motion reveal
  const bgOrbAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const frameExpand = useRef(new Animated.Value(0)).current;
  const radarWave1 = useRef(new Animated.Value(0)).current;
  const radarWave2 = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-120)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const pillsFade = useRef(new Animated.Value(0)).current;
  const pillsSlide = useRef(new Animated.Value(14)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Ambient Background Glow Rotation
    Animated.loop(
      Animated.timing(bgOrbAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Radar Wave Expansion
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(radarWave1, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarWave1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(radarWave2, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarWave2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 3. Slow-Motion Holographic Scanner Brackets Expansion + Logo Pop
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 25,
        useNativeDriver: true,
      }),
      Animated.spring(frameExpand, {
        toValue: 1,
        friction: 7,
        tension: 25,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Laser Scan Beam & Shimmer Sweep (Continuous)
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 124,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 140,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(shimmerAnim, {
            toValue: -140,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 5. Staggered Typography & Feature Badges Reveal (Smooth Slow-Motion)
    Animated.sequence([
      Animated.delay(280),
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          friction: 7,
          tension: 25,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pillsFade, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(pillsSlide, {
          toValue: 0,
          friction: 7,
          tension: 25,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 6. Sleek Loading Progress Line
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // 7. App Initialization & Cinematic Slow Fade-out to Dashboard
    const initApp = async () => {
      await FileService.initDirectories();
      const settings = await SettingsRepository.getSettings();

      setTimeout(() => {
        // Slow-motion cinematic fade-out transition (750ms)
        Animated.parallel([
          Animated.timing(exitScale, {
            toValue: 1.04,
            duration: 750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(exitOpacity, {
            toValue: 0,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (settings.onboardingCompleted) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Onboarding');
          }
        });
      }, 1600);
    };

    initApp();
  }, []);

  const orbRotate = bgOrbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const wave1Scale = radarWave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const wave1Opacity = radarWave1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const wave2Scale = radarWave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const wave2Opacity = radarWave2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const bracketOffset = frameExpand.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          opacity: exitOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
    >
      {/* Ambient Radial Aurora Glows */}
      <Animated.View
        style={[
          styles.ambientOrb1,
          {
            transform: [{ rotate: orbRotate }],
          },
        ]}
      />
      <View style={styles.ambientOrb2} />

      {/* Main Center Stage */}
      <View style={styles.centerStage}>
        {/* Expanding Radar Waves */}
        <Animated.View
          style={[
            styles.radarRing,
            {
              transform: [{ scale: wave1Scale }],
              opacity: wave1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarRing,
            {
              transform: [{ scale: wave2Scale }],
              opacity: wave2Opacity,
            },
          ]}
        />

        {/* Viewfinder Corner Brackets */}
        <View style={styles.viewfinderWrapper}>
          {/* Top-Left Bracket */}
          <Animated.View
            style={[
              styles.cornerBracket,
              styles.bracketTL,
              {
                transform: [
                  { translateX: bracketOffset },
                  { translateY: bracketOffset },
                ],
              },
            ]}
          />
          {/* Top-Right Bracket */}
          <Animated.View
            style={[
              styles.cornerBracket,
              styles.bracketTR,
              {
                transform: [
                  {
                    translateX: bracketOffset.interpolate({
                      inputRange: [-18, 0],
                      outputRange: [18, 0],
                    }),
                  },
                  { translateY: bracketOffset },
                ],
              },
            ]}
          />
          {/* Bottom-Right Bracket */}
          <Animated.View
            style={[
              styles.cornerBracket,
              styles.bracketBR,
              {
                transform: [
                  {
                    translateX: bracketOffset.interpolate({
                      inputRange: [-18, 0],
                      outputRange: [18, 0],
                    }),
                  },
                  {
                    translateY: bracketOffset.interpolate({
                      inputRange: [-18, 0],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          />
          {/* Bottom-Left Bracket */}
          <Animated.View
            style={[
              styles.cornerBracket,
              styles.bracketBL,
              {
                transform: [
                  { translateX: bracketOffset },
                  {
                    translateY: bracketOffset.interpolate({
                      inputRange: [-18, 0],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Central Logo Card */}
          <Animated.View
            style={[
              styles.logoCard,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />

            {/* Shimmer Light Reflection Sweep */}
            <Animated.View
              style={[
                styles.shimmerBar,
                {
                  transform: [{ translateX: shimmerAnim }],
                },
              ]}
            />

            {/* Neon Cyan Laser Scan Beam */}
            <Animated.View
              style={[
                styles.laserBeamContainer,
                {
                  transform: [{ translateY: scanLineAnim }],
                },
              ]}
            >
              <View style={styles.laserLine} />
              <View style={styles.laserGlowFlare} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Brand Typography */}
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: textFade,
              transform: [{ translateY: textSlide }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>Scan My PDF</Text>
            <View style={styles.glowDot} />
          </View>
          <Text style={styles.brandTagline}>Smart Document Scanner & PDF Utility</Text>
        </Animated.View>

        {/* Floating Feature Badges */}
        <Animated.View
          style={[
            styles.pillRow,
            {
              opacity: pillsFade,
              transform: [{ translateY: pillsSlide }],
            },
          ]}
        >
          <View style={styles.featurePill}>
            <Zap size={11} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.featurePillText}>Fast HD Scan</Text>
          </View>
          <View style={styles.featurePill}>
            <FileText size={11} color="#60A5FA" style={{ marginRight: 4 }} />
            <Text style={styles.featurePillText}>PDF Tools</Text>
          </View>
          <View style={styles.featurePill}>
            <Shield size={11} color="#34D399" style={{ marginRight: 4 }} />
            <Text style={styles.featurePillText}>100% Offline</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Loading Progress & Privacy Assurance */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        {/* Futuristic Mini Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.privacyCaption}>
          100% Local On-Device Processing • Zero Cloud Tracking
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    opacity: 0.8,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: 80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  viewfinderWrapper: {
    width: 172,
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
    zIndex: 10,
  },
  bracketTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bracketBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  bracketBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  logoCard: {
    width: 138,
    height: 138,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  logoImage: {
    width: 138,
    height: 138,
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ skewX: '-25deg' }],
  },
  laserBeamContainer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 20,
  },
  laserLine: {
    height: 3,
    backgroundColor: '#00F2FE',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  laserGlowFlare: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: 'rgba(0, 242, 254, 0.4)',
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 34,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  glowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00F2FE',
    marginLeft: 6,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
  },
  featurePillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 36,
  },
  progressBarTrack: {
    width: 140,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  privacyCaption: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
