import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// WhatsApp Official Color Palette
const WA_COLORS = {
  // Brand Greens
  green: '#25D366', // WhatsApp Emerald Green
  tealDark: '#008069', // WhatsApp Teal Green (Light active icon)

  // Dark Theme (WhatsApp Android M3)
  darkBar: '#0B141B', // WhatsApp Dark Nav Bar Background
  darkBorder: '#1F2C34', // WhatsApp Dark Top Border
  darkPill: '#103629', // WhatsApp Dark Active Pill Capsule
  darkActiveIcon: '#25D366', // WhatsApp Dark Active Icon
  darkActiveText: '#E9EDEF', // WhatsApp Dark Active Label
  darkMuted: '#8696A0', // WhatsApp Dark Inactive Icon & Label

  // Light Theme (WhatsApp Android M3)
  lightBar: '#FFFFFF', // WhatsApp Light Nav Bar Background
  lightBorder: '#E9EDEF', // WhatsApp Light Top Border
  lightPill: '#D8FDD2', // WhatsApp Light Active Pill Capsule
  lightActiveIcon: '#008069', // WhatsApp Light Active Icon
  lightActiveText: '#111B21', // WhatsApp Light Active Label
  lightMuted: '#54656F', // WhatsApp Light Inactive Icon & Label
};

const TAB_CONFIG = [
  { name: 'HomeTab', label: 'Home', icon: Home, hasBadge: false },
  { name: 'DocumentsTab', label: 'Docs', icon: FileText, hasBadge: false },
  { name: 'ToolsTab', label: 'Tools', icon: Wrench, hasBadge: false },
  { name: 'SettingsTab', label: 'Settings', icon: SettingsIcon, hasBadge: false },
];

const PILL_WIDTH = 64;
const PILL_HEIGHT = 32;

/**
 * Animated Tab Item Component with Scale Bounce & Color Transitions
 */
const AnimatedTabItem: React.FC<{
  tab: (typeof TAB_CONFIG)[0];
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  mutedColor: string;
  activeTextColor: string;
}> = ({ tab, isFocused, onPress, activeColor, mutedColor, activeTextColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = tab.icon;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.18,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tabItem}
    >
      <View style={styles.iconContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconComponent
            size={23}
            color={isFocused ? activeColor : mutedColor}
            fill={isFocused ? activeColor : 'none'}
            strokeWidth={isFocused ? 2.4 : 1.9}
          />
        </Animated.View>
        {tab.hasBadge && <View style={styles.badgeDot} />}
      </View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeTextColor : mutedColor,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Pixel-Perfect WhatsApp Material 3 Bottom Navigation Bar
 * - Smooth sliding pill capsule with Material You spring physics
 * - Subtle horizontal stretch animation during transitions
 * - Tactile icon scale bounce on select
 * - WhatsApp Floating Action Button (FAB) at bottom-right with pop animation
 */
const WhatsAppTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const tabWidth = windowWidth / TAB_CONFIG.length;
  const bottomPadding = Math.max(insets.bottom, 8);

  const barBg = isDark ? WA_COLORS.darkBar : WA_COLORS.lightBar;
  const borderTopColor = isDark ? WA_COLORS.darkBorder : WA_COLORS.lightBorder;
  const pillBg = isDark ? WA_COLORS.darkPill : WA_COLORS.lightPill;
  const activeIconColor = isDark ? WA_COLORS.darkActiveIcon : WA_COLORS.lightActiveIcon;
  const activeTextColor = isDark ? WA_COLORS.darkActiveText : WA_COLORS.lightActiveText;
  const mutedColor = isDark ? WA_COLORS.darkMuted : WA_COLORS.lightMuted;

  // Animated sliding pill
  const slideAnim = useRef(new Animated.Value(state.index)).current;
  const stretchAnim = useRef(new Animated.Value(1)).current;

  // FAB animation
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Slide pill to new tab
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: state.index,
        damping: 17,
        mass: 0.85,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretchAnim, {
          toValue: 1.15, // fluid horizontal stretch during motion
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(stretchAnim, {
          toValue: 1,
          damping: 14,
          mass: 0.8,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]),
      // 2. FAB bounce pop on tab switch
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 0.88,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(fabScale, {
          toValue: 1,
          damping: 12,
          mass: 0.8,
          stiffness: 190,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index]);

  // Interpolate slideAnim to X position
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      (tabWidth - PILL_WIDTH) / 2,
      tabWidth + (tabWidth - PILL_WIDTH) / 2,
      2 * tabWidth + (tabWidth - PILL_WIDTH) / 2,
      3 * tabWidth + (tabWidth - PILL_WIDTH) / 2,
    ],
  });

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
    navigation.navigate('CameraScreen');
  };

  return (
    <View style={styles.rootWrapper} pointerEvents="box-none">
      {/* WhatsApp Signature Floating Action Button (FAB) on bottom-right */}
      <Animated.View
        style={[
          styles.fabWrapper,
          {
            bottom: bottomPadding + 68,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleFabPress}
          style={[styles.fabButton, { backgroundColor: WA_COLORS.green }]}
        >
          <Camera size={26} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </Animated.View>

      {/* WhatsApp Flat 4-Tab Navigation Bar */}
      <View
        style={[
          styles.barContainer,
          {
            backgroundColor: barBg,
            borderTopColor,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* Animated Sliding Pill Capsule */}
        <Animated.View
          style={[
            styles.slidingPill,
            {
              backgroundColor: pillBg,
              transform: [{ translateX }, { scaleX: stretchAnim }],
            },
          ]}
        />

        {/* 4 Interactive Tab Items */}
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <AnimatedTabItem
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(tab.name);
                }
              }}
              activeColor={activeIconColor}
              mutedColor={mutedColor}
              activeTextColor={activeTextColor}
            />
          );
        })}
      </View>
    </View>
  );
};

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <WhatsAppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="DocumentsTab" component={DocumentsScreen} />
      <Tab.Screen name="ToolsTab" component={PdfToolsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  // WhatsApp Floating Action Button Wrapper
  fabWrapper: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    elevation: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 16, // WhatsApp Material 3 squircle FAB shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },
  // WhatsApp Bottom Bar Container
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 82 : 72,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  // Sliding Material You Pill Indicator
  slidingPill: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: 16,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 3,
    right: 18,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: WA_COLORS.green,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
