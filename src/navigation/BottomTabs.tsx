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

// Empty component for the Scan tab since pressing it navigates to CameraScreen directly
const DummyScanScreen = () => <View />;

// WhatsApp Signature Color Palette
const WA_COLORS = {
  green: '#25D366', // WhatsApp Emerald Green
  teal: '#00A884', // WhatsApp Teal Green
  darkBar: '#0B141B', // WhatsApp Dark Mode Bar
  darkBorder: '#1F2C34', // WhatsApp Dark Mode Border
  darkMuted: '#8696A0', // WhatsApp Dark Mode Muted Icon/Text
  darkActiveText: '#E9EDEF', // WhatsApp Dark Mode Active Label
  darkPill: 'rgba(37, 211, 102, 0.18)', // WhatsApp Dark Pill Capsule
  lightBar: '#FFFFFF', // WhatsApp Light Mode Bar
  lightBorder: '#E9EDEF', // WhatsApp Light Mode Border
  lightMuted: '#54656F', // WhatsApp Light Mode Muted Icon/Text
  lightActiveText: '#008069', // WhatsApp Light Mode Active Label
  lightPill: '#D8FDD2', // WhatsApp Light Pill Capsule
};

/**
 * Authentic WhatsApp Style Bottom Navigation Bar
 * Features full-width dock, WhatsApp signature active pill capsule indicators,
 * and a prominent WhatsApp Green Camera FAB for instant document scanning.
 */
const WhatsAppTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const barBg = isDark ? WA_COLORS.darkBar : WA_COLORS.lightBar;
  const borderTopColor = isDark ? WA_COLORS.darkBorder : WA_COLORS.lightBorder;
  const mutedColor = isDark ? WA_COLORS.darkMuted : WA_COLORS.lightMuted;
  const pillBg = isDark ? WA_COLORS.darkPill : WA_COLORS.lightPill;
  const activeIconColor = isDark ? WA_COLORS.green : WA_COLORS.teal;
  const activeTextColor = isDark ? WA_COLORS.darkActiveText : WA_COLORS.lightActiveText;

  // Safe bottom padding
  const bottomPadding = Math.max(insets.bottom, 6);

  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: Home, index: 0 },
    { name: 'DocumentsTab', label: 'Docs', icon: FileText, index: 1 },
    { name: 'ToolsTab', label: 'Tools', icon: Wrench, index: 3 },
    { name: 'SettingsTab', label: 'Settings', icon: SettingsIcon, index: 4 },
  ];

  return (
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
      {/* Left Tab: Home */}
      {(() => {
        const tab = tabs[0];
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
            <View style={[styles.pillWrapper, isFocused && { backgroundColor: pillBg }]}>
              <IconComponent
                size={22}
                color={isFocused ? activeIconColor : mutedColor}
                strokeWidth={isFocused ? 2.4 : 1.9}
              />
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
      })()}

      {/* Left-Center Tab: Docs */}
      {(() => {
        const tab = tabs[1];
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
            <View style={[styles.pillWrapper, isFocused && { backgroundColor: pillBg }]}>
              <IconComponent
                size={22}
                color={isFocused ? activeIconColor : mutedColor}
                strokeWidth={isFocused ? 2.4 : 1.9}
              />
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
      })()}

      {/* Center Action: WhatsApp Signature Green Camera Scan Button */}
      <View style={styles.centerActionWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CameraScreen')}
          style={styles.scanButtonTouch}
        >
          <View style={styles.scanGreenCircle}>
            <Camera size={23} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Text style={[styles.scanLabel, { color: WA_COLORS.green }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Right-Center Tab: Tools */}
      {(() => {
        const tab = tabs[2];
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
            <View style={[styles.pillWrapper, isFocused && { backgroundColor: pillBg }]}>
              <IconComponent
                size={22}
                color={isFocused ? activeIconColor : mutedColor}
                strokeWidth={isFocused ? 2.4 : 1.9}
              />
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
      })()}

      {/* Right Tab: Settings */}
      {(() => {
        const tab = tabs[3];
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
            <View style={[styles.pillWrapper, isFocused && { backgroundColor: pillBg }]}>
              <IconComponent
                size={22}
                color={isFocused ? activeIconColor : mutedColor}
                strokeWidth={isFocused ? 2.4 : 1.9}
              />
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
      })()}
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
      <Tab.Screen name="ScanTab" component={DummyScanScreen} />
      <Tab.Screen name="ToolsTab" component={PdfToolsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
  // WhatsApp Iconic Rounded Pill Capsule around active tab icon
  pillWrapper: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: -0.1,
  },
  // WhatsApp Center Quick Scan Button
  centerActionWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8, // Subtle elevation above the bar
  },
  scanGreenCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: WA_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WA_COLORS.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  scanLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
