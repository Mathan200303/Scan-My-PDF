import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  FileText,
  Camera,
  Wrench,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { PdfToolsScreen } from '../screens/PdfToolsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Empty component for the Scan tab since pressing it opens Camera directly
const DummyScanScreen = () => <View />;

// Modern Floating Dock Tab Bar with Cyberpunk Spectrum Running Border Animation & Unclipped Center Scan Button
const CustomModernTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Slow continuous rotation animation for the glowing border beam (6.5s per revolution)
  const borderRotateAnim = useRef(new Animated.Value(0)).current;
  // Center scan ring continuous rotation (4.5s per revolution)
  const scanRingRotateAnim = useRef(new Animated.Value(0)).current;
  // Subtle breathing pulse for the center scanner glow
  const scanPulseAnim = useRef(new Animated.Value(1)).current;

  // Lighter cool slate & electric cyan palette
  const activeColor = '#38BDF8'; // Vivid Electric Cyan
  const activePillBg = 'rgba(56, 189, 248, 0.22)';
  const scanLabelColor = '#38BDF8';

  useEffect(() => {
    // 1. Slow loop for dock border beam
    const borderLoop = Animated.loop(
      Animated.timing(borderRotateAnim, {
        toValue: 1,
        duration: 6500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Continuous loop for scan button ring
    const scanRingLoop = Animated.loop(
      Animated.timing(scanRingRotateAnim, {
        toValue: 1,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 3. Gentle breathing pulse for scan button
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulseAnim, {
          toValue: 1.05,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanPulseAnim, {
          toValue: 1.0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    borderLoop.start();
    scanRingLoop.start();
    pulseLoop.start();

    return () => {
      borderLoop.stop();
      scanRingLoop.stop();
      pulseLoop.stop();
    };
  }, [borderRotateAnim, scanRingRotateAnim, scanPulseAnim]);

  const borderSpin = borderRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanRingSpin = scanRingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bottomMargin = Math.max(insets.bottom, 10);

  // Tab definitions
  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: Home, index: 0 },
    { name: 'DocumentsTab', label: 'Docs', icon: FileText, index: 1 },
    { name: 'ToolsTab', label: 'Tools', icon: Wrench, index: 3 },
    { name: 'SettingsTab', label: 'Settings', icon: SettingsIcon, index: 4 },
  ];

  return (
    <View style={[styles.floatingWrapper, { paddingBottom: bottomMargin }]} pointerEvents="box-none">
      {/* 1. Track with Animated Running Glowing Border */}
      <View style={styles.animatedBorderTrack}>
        {/* Continuous Rotating Multi-Color Light Beam */}
        <Animated.View
          style={[
            styles.rotatingGradientBox,
            {
              transform: [{ rotate: borderSpin }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              '#80c5e3', // Cyan
              '#818CF8', // Indigo
              '#C084FC', // Purple
              '#34D399', // Mint
              '#38BDF8', // Cyan
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fullSize}
          />
        </Animated.View>

        {/* Inner Floating Island Dock with Lighter Cool Slate Backdrop */}
        <LinearGradient
          colors={['#3e5474', '#355175', '#2a4467']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dockContainer}
        >
          {/* Left Tabs: Home & Docs */}
          {tabs.slice(0, 2).map((tab) => {
            const isFocused = state.index === tab.index;
            const IconComponent = tab.icon;

            return (
              <TouchableOpacity
                key={tab.name}
                activeOpacity={0.7}
                onPress={() => {
                  if (!isFocused) navigation.navigate(tab.name);
                }}
                style={styles.tabItem}
              >
                <View
                  style={[
                    styles.tabIconWrapper,
                    isFocused && {
                      backgroundColor: activePillBg,
                    },
                  ]}
                >
                  <IconComponent
                    size={21}
                    color={isFocused ? activeColor : '#CBD5E1'}
                    strokeWidth={isFocused ? 2.5 : 1.9}
                  />
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? activeColor : '#CBD5E1',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>

                {isFocused ? (
                  <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
                ) : (
                  <View style={styles.inactiveIndicator} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Center Space Reserved for Floating Scan Button */}
          <View style={styles.centerPlaceholder} />

          {/* Right Tabs: Tools & Settings */}
          {tabs.slice(2, 4).map((tab) => {
            const isFocused = state.index === tab.index;
            const IconComponent = tab.icon;

            return (
              <TouchableOpacity
                key={tab.name}
                activeOpacity={0.7}
                onPress={() => {
                  if (!isFocused) navigation.navigate(tab.name);
                }}
                style={styles.tabItem}
              >
                <View
                  style={[
                    styles.tabIconWrapper,
                    isFocused && {
                      backgroundColor: activePillBg,
                    },
                  ]}
                >
                  <IconComponent
                    size={21}
                    color={isFocused ? activeColor : '#CBD5E1'}
                    strokeWidth={isFocused ? 2.5 : 1.9}
                  />
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? activeColor : '#CBD5E1',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>

                {isFocused ? (
                  <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
                ) : (
                  <View style={styles.inactiveIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>

      {/* 2. Elevated Floating Center Scan Button (OUTSIDE the clipped overflow container so it is NEVER cut off) */}
      <View style={styles.floatingCenterOverlay} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CameraScreen')}
          style={styles.scanTouchTarget}
        >
          {/* Animated Outer Pulse Ring */}
          <Animated.View
            style={[
              styles.scanPulseWrapper,
              {
                transform: [{ scale: scanPulseAnim }],
              },
            ]}
          >
            {/* Rotating Glow Ring */}
            <View style={styles.scanGlowRingTrack}>
              <Animated.View
                style={[
                  styles.scanRotatingGradient,
                  {
                    transform: [{ rotate: scanRingSpin }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#60A5FA', '#3B82F6', '#06B6D4', '#60A5FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fullSize}
                />
              </Animated.View>

              {/* Inner Gradient Action Core (Electric Royal Blue) */}
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanCore}
              >
                <View style={styles.scanTargetCornerTL} />
                <View style={styles.scanTargetCornerBR} />
                <Camera size={26} color="#FFFFFF" strokeWidth={2.4} />
              </LinearGradient>
            </View>
          </Animated.View>

          <Text style={[styles.scanLabel, { color: scanLabelColor }]}>SCAN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="DocumentsTab" component={DocumentsScreen} />
      <Tab.Screen name="ScanTab" component={DummyScanScreen} />
      <Tab.Screen name="ToolsTab" component={PdfToolsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 1.8px Outer Animated Track which clips the rotating beam to only the border
  animatedBorderTrack: {
    width: '92%',
    maxWidth: 440,
    height: 68,
    borderRadius: 34,
    padding: 1.8, // Thickness of running glowing border
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Elevation and Ambient Drop Shadow with Royal Blue Glow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  rotatingGradientBox: {
    position: 'absolute',
    width: 600,
    height: 600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  dockContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 32.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  inactiveIndicator: {
    width: 14,
    height: 3,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  centerPlaceholder: {
    flex: 1.1,
  },
  // Floating Center Scan Overlay placed above the dock with NO clipping
  floatingCenterOverlay: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 20,
  },
  scanTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPulseWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGlowRingTrack: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2.2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  scanRotatingGradient: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCore: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanTargetCornerTL: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 7,
    height: 7,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderTopLeftRadius: 2,
  },
  scanTargetCornerBR: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 7,
    height: 7,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomRightRadius: 2,
  },
  scanLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.6,
  },
});
