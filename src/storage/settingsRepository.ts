import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

const SETTINGS_KEY = '@scanflow_user_settings_v1';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  defaultPageSize: 'A4',
  defaultQuality: 'HIGH',
  defaultFilter: 'original',
  onboardingCompleted: false,
};

export const SettingsRepository = {
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save settings', e);
      throw e;
    }
  },

  async setOnboardingCompleted(completed = true): Promise<void> {
    await this.updateSettings({ onboardingCompleted: completed });
  },
};

