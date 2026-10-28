import React, { useRef, useEffect, useState } from 'react';
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

// WhatsApp Signature Palette
const WA_COLORS = {
  green: '#25D366', // WhatsApp Emerald Green
  teal: '#00A884',

  // Floating Island Dock - Dark Mode (Matches user reference image)
  darkDockBg: 'rgba(22, 24, 28, 0.96)',
  darkDockBorder: 'rgba(255, 255, 255, 0.12)',
  darkSpotlight: 'rgba(255, 255, 255, 0.18)', // Oval translucent glow around active icon
  darkActiveIcon: '#FFFFFF',
  darkActiveText: '#FFFFFF',
  darkMuted: '#949BA4',

  // Floating Island Dock - Light Mode
  lightDockBg: 'rgba(255, 255, 255, 0.97)',
  lightDockBorder: 'rgba(0, 0, 0, 0.08)',
  lightSpotlight: 'rgba(37, 211, 102, 0.16)', // Soft mint translucent glow
  lightActiveIcon: '#111B21',
  lightActiveText: '#111B21',
  lightMuted: '#68737D',
};

const SPOTLIGHT_WIDTH = 48;
const SPOTLIGHT_HEIGHT = 38;
const INNER_PAD = 8;

/**
 * Animated Floating Capsule Dock Item (Home, Docs, Tools, Settings)
 */
const DockItem: React.FC<{
  label: string;
  icon: any;
  isFocused: boolean;
  onPress: () => void;
  activeIconColor: string;
  mutedColor: string;
  activeTextColor: string;
}> = ({ label, icon: IconComponent, isFocused, onPress, activeIconColor, mutedColor, activeTextColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.18,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
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
      <View style={styles.iconWrapper}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconComponent
            size={22}
            color={isFocused ? activeIconColor : mutedColor}
            strokeWidth={isFocused ? 2.5 : 2.0}
            fill={isFocused ? activeIconColor : 'none'}
          />
        </Animated.View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeTextColor : mutedColor,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Floating Island Capsule Tab Bar
 * Perfectly centered spotlight halo across all 5 slots:
 * [Home: 0, Docs: 1, Camera: 2, Tools: 3, Settings: 4]
 */
const FloatingCapsuleTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Floating dock dimensions
  const dockMargin = 14;
  const initialWidth = windowWidth - dockMargin * 2;
  const [capsuleWidth, setCapsuleWidth] = useState(initialWidth);

  // Available inner width for the 5 slots
  const availableWidth = Math.max(0, capsuleWidth - INNER_PAD * 2);
  const slotWidth = availableWidth / 5;

  const dockBg = isDark ? WA_COLORS.darkDockBg : WA_COLORS.lightDockBg;
  const dockBorder = isDark ? WA_COLORS.darkDockBorder : WA_COLORS.lightDockBorder;
  const spotlightBg = isDark ? WA_COLORS.darkSpotlight : WA_COLORS.lightSpotlight;
  const activeIconColor = isDark ? WA_COLORS.darkActiveIcon : WA_COLORS.lightActiveIcon;
  const activeTextColor = isDark ? WA_COLORS.darkActiveText : WA_COLORS.lightActiveText;
  const mutedColor = isDark ? WA_COLORS.darkMuted : WA_COLORS.lightMuted;

  // Map state.index [0: Home, 1: Docs, 2: Tools, 3: Settings] to 5-slot dock position [0, 1, 2, 3, 4]
  const getDockPosition = (index: number) => {
    switch (index) {
      case 0: return 0; // Home
      case 1: return 1; // Docs
      case 2: return 3; // Tools (after Camera)
      case 3: return 4; // Settings
      default: return 0;
    }
  };

  const slideAnim = useRef(new Animated.Value(getDockPosition(state.index))).current;
  const stretchAnim = useRef(new Animated.Value(1)).current;
  const cameraScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetPos = getDockPosition(state.index);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: targetPos,
        damping: 18,
        mass: 0.85,
        stiffness: 170,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretchAnim, {
          toValue: 1.15, // horizontal stretch during glide
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
    ]).start();
  }, [state.index]);

  // Perfectly centered X coordinates: INNER_PAD + (slot * slotWidth) + (slotWidth - SPOTLIGHT_WIDTH) / 2
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [
      INNER_PAD + 0 * slotWidth + (slotWidth - SPOTLIGHT_WIDTH) / 2,
      INNER_PAD + 1 * slotWidth + (slotWidth - SPOTLIGHT_WIDTH) / 2,
      INNER_PAD + 2 * slotWidth + (slotWidth - SPOTLIGHT_WIDTH) / 2,
      INNER_PAD + 3 * slotWidth + (slotWidth - SPOTLIGHT_WIDTH) / 2,
      INNER_PAD + 4 * slotWidth + (slotWidth - SPOTLIGHT_WIDTH) / 2,
    ],
  });

  // Center Camera button press
  const handleCameraPress = () => {
    Animated.sequence([
      Animated.timing(cameraScale, {
        toValue: 0.86,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(cameraScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
    navigation.navigate('CameraScreen');
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { bottom: Math.max(insets.bottom, 10) + 6 },
      ]}
      pointerEvents="box-none"
    >
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - capsuleWidth) > 1) {
            setCapsuleWidth(w);
          }
        }}
        style={[
          styles.dockCapsule,
          {
            backgroundColor: dockBg,
            borderColor: dockBorder,
            paddingHorizontal: INNER_PAD,
          },
        ]}
      >
        {/* Sliding Spotlight Halo Indicator (Centered around active icon) */}
        <Animated.View
          style={[
            styles.spotlightHalo,
            {
              backgroundColor: spotlightBg,
              transform: [{ translateX }, { scaleX: stretchAnim }],
            },
          ]}
        />

        {/* 1. Home Tab */}
        <DockItem
          label="Home"
          icon={Home}
          isFocused={state.index === 0}
          onPress={() => {
            if (state.index !== 0) navigation.navigate('HomeTab');
          }}
          activeIconColor={activeIconColor}
          mutedColor={mutedColor}
          activeTextColor={activeTextColor}
        />

        {/* 2. Documents Tab */}
        <DockItem
          label="Docs"
          icon={FileText}
          isFocused={state.index === 1}
          onPress={() => {
            if (state.index !== 1) navigation.navigate('DocumentsTab');
          }}
          activeIconColor={activeIconColor}
          mutedColor={mutedColor}
          activeTextColor={activeTextColor}
        />

        {/* 3. CENTER CAMERA SCANNER (Placed in center between Docs and Tools) */}
        <View style={styles.centerSlot}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCameraPress}
            style={styles.cameraTouchArea}
          >
            <Animated.View
              style={[
                styles.cameraCircle,
                {
                  transform: [{ scale: cameraScale }],
                  backgroundColor: WA_COLORS.green,
                },
              ]}
            >
              <Camera size={24} color="#FFFFFF" strokeWidth={2.4} />
            </Animated.View>
            <Text style={[styles.cameraLabel, { color: WA_COLORS.green }]}>
              Scan
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. PDF Tools Tab */}
        <DockItem
          label="Tools"
          icon={Wrench}
          isFocused={state.index === 2}
          onPress={() => {
            if (state.index !== 2) navigation.navigate('ToolsTab');
          }}
          activeIconColor={activeIconColor}
          mutedColor={mutedColor}
          activeTextColor={activeTextColor}
        />

        {/* 5. Settings Tab */}
        <DockItem
          label="Settings"
          icon={SettingsIcon}
          isFocused={state.index === 3}
          onPress={() => {
            if (state.index !== 3) navigation.navigate('SettingsTab');
          }}
          activeIconColor={activeIconColor}
          mutedColor={mutedColor}
          activeTextColor={activeTextColor}
        />
      </View>
    </View>
  );
};

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingCapsuleTabBar {...props} />}
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
  outerContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  // Floating Island Capsule Dock
  dockCapsule: {
    width: '100%',
    height: 68,
    borderRadius: 36, // Fully rounded capsule ends as in reference image
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  // Sliding Translucent Spotlight Halo (Centered behind the active icon)
  spotlightHalo: {
    position: 'absolute',
    top: 7,
    left: 0,
    width: SPOTLIGHT_WIDTH,
    height: SPOTLIGHT_HEIGHT,
    borderRadius: 19,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    zIndex: 1,
  },
  iconWrapper: {
    width: SPOTLIGHT_WIDTH,
    height: SPOTLIGHT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  // Center Camera Slot
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cameraTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8, // Subtle elevation pop above the dock
  },
  cameraCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WA_COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
