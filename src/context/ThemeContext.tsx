import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';
import { SettingsRepository } from '../storage/settingsRepository';
import { ThemeMode } from '../types';

type ColorPalette = typeof Colors.light;

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  colors: Colors.light,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    SettingsRepository.getSettings().then((s) => {
      if (s.theme) setMode(s.theme);
    });
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? Colors.dark : Colors.light;

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await SettingsRepository.updateSettings({ theme: newMode });
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

