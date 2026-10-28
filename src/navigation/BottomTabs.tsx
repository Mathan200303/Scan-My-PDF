import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
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
  { name: 'HomeTab', label: 'Home', icon: Home },
  { name: 'DocumentsTab', label: 'Docs', icon: FileText },
  { name: 'ToolsTab', label: 'Tools', icon: Wrench },
  { name: 'SettingsTab', label: 'Settings', icon: SettingsIcon },
];

/**
 * Pixel-Perfect WhatsApp Material 3 Bottom Navigation Bar
 * - Flat, edge-to-edge bar with WhatsApp 4 uniform tabs
 * - Signature 64x32dp pill capsule behind active icon
 * - WhatsApp Floating Action Button (FAB) at bottom-right for instant camera scan
 */
const WhatsAppTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const barBg = isDark ? WA_COLORS.darkBar : WA_COLORS.lightBar;
  const borderTopColor = isDark ? WA_COLORS.darkBorder : WA_COLORS.lightBorder;
  const pillBg = isDark ? WA_COLORS.darkPill : WA_COLORS.lightPill;
  const activeIconColor = isDark ? WA_COLORS.darkActiveIcon : WA_COLORS.lightActiveIcon;
  const activeTextColor = isDark ? WA_COLORS.darkActiveText : WA_COLORS.lightActiveText;
  const mutedColor = isDark ? WA_COLORS.darkMuted : WA_COLORS.lightMuted;

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={styles.rootWrapper} pointerEvents="box-none">
      {/* WhatsApp Signature Floating Action Button (FAB) on bottom-right */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CameraScreen')}
        style={[
          styles.fabButton,
          {
            bottom: bottomPadding + 68,
            backgroundColor: WA_COLORS.green,
          },
        ]}
      >
        <Camera size={26} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>

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
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(tab.name);
                }
              }}
              style={styles.tabItem}
            >
              {/* WhatsApp M3 Pill Capsule around active tab icon */}
              <View
                style={[
                  styles.pillWrapper,
                  {
                    backgroundColor: isFocused ? pillBg : 'transparent',
                  },
                ]}
              >
                <IconComponent
                  size={24}
                  color={isFocused ? activeIconColor : mutedColor}
                  strokeWidth={isFocused ? 2.4 : 1.9}
                />
              </View>

              {/* WhatsApp Tab Label */}
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
  // WhatsApp Signature FAB
  fabButton: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 18, // WhatsApp Material 3 squircle FAB shape
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 10,
  },
  // Flat WhatsApp Bottom Navigation Bar
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  // WhatsApp Material 3 Pill Capsule (64x32dp, borderRadius 16)
  pillWrapper: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
