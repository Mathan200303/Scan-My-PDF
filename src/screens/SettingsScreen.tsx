import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Smartphone,
  ShieldCheck,
  FileCheck2,
  Info,
  Star,
  Share2,
  ChevronRight,
  Globe,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { SettingsRepository } from '../storage/settingsRepository';
import { UserSettings, ThemeMode, PdfPageSize, PdfQuality, ScanFilterType } from '../types';
import { Header } from '../components/Header';
import { ShareService } from '../services/shareService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode, setThemeMode, colors } = useTheme();

  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    defaultPageSize: 'A4',
    defaultQuality: 'HIGH',
    defaultFilter: 'original',
    onboardingCompleted: true,
  });

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  useEffect(() => {
    SettingsRepository.getSettings().then(setSettings);
  }, []);

  const handleUpdate = async (updates: Partial<UserSettings>) => {
    const updated = await SettingsRepository.updateSettings(updates);
    setSettings(updated);
  };

  const handleShareApp = async () => {
    Alert.alert(
      'Share Scan My PDF',
      'Scan My PDF – 100% Offline Document Scanner & PDF Utility for Android.',
      [{ text: 'OK' }]
    );
  };

  const handleRateApp = () => {
    Alert.alert('Rate Scan My PDF', 'Thank you for supporting Scan My PDF on Google Play Store.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
      >
        {/* Appearance Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Theme Mode</Text>
          <View style={styles.themeSelector}>
            {[
              { id: 'light' as ThemeMode, label: 'Light', icon: <Sun size={18} /> },
              { id: 'dark' as ThemeMode, label: 'Dark', icon: <Moon size={18} /> },
              { id: 'system' as ThemeMode, label: 'System', icon: <Smartphone size={18} /> },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setThemeMode(t.id)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === t.id ? colors.primary : colors.inputBg,
                  },
                ]}
              >
                {React.cloneElement(t.icon, {
                  color: mode === t.id ? '#FFFFFF' : colors.text,
                })}
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: mode === t.id ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Defaults Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          SCAN & PDF DEFAULTS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Default Page Size */}
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Default Page Size</Text>
            <View style={styles.pillGroup}>
              {(['A4', 'LETTER'] as PdfPageSize[]).map((sz) => (
                <TouchableOpacity
                  key={sz}
                  onPress={() => handleUpdate({ defaultPageSize: sz })}
                  style={[
                    styles.smallPill,
                    {
                      backgroundColor:
                        settings.defaultPageSize === sz ? colors.primary : colors.inputBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: settings.defaultPageSize === sz ? '#FFFFFF' : colors.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {sz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Default Quality */}
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Default Quality</Text>
            <View style={styles.pillGroup}>
              {(['LOW', 'MEDIUM', 'HIGH'] as PdfQuality[]).map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => handleUpdate({ defaultQuality: q })}
                  style={[
                    styles.smallPill,
                    {
                      backgroundColor:
                        settings.defaultQuality === q ? colors.primary : colors.inputBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: settings.defaultQuality === q ? '#FFFFFF' : colors.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {q === 'MEDIUM' ? 'MED' : q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Default Scan Filter */}
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Default Scan Filter</Text>
            <View style={styles.pillGroup}>
              {(['document', 'original', 'grayscale'] as ScanFilterType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => handleUpdate({ defaultFilter: f })}
                  style={[
                    styles.smallPill,
                    {
                      backgroundColor:
                        settings.defaultFilter === f ? colors.primary : colors.inputBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: settings.defaultFilter === f ? '#FFFFFF' : colors.text,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {f === 'document' ? 'Doc' : f === 'grayscale' ? 'Gray' : 'Orig'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Legal & Privacy Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          PRIVACY & SAFETY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setPrivacyModalVisible(true)}
            style={styles.clickableRow}
          >
            <ShieldCheck size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.rowTitle, { color: colors.text }]}>Privacy Policy</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={() => setTermsModalVisible(true)}
            style={styles.clickableRow}
          >
            <FileCheck2 size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.rowTitle, { color: colors.text }]}>Terms of Use</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About & Community Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setAboutModalVisible(true)}
            style={styles.clickableRow}
          >
            <Info size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>About Scan My PDF</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Version 1.0.0 (Production Build)</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity onPress={handleRateApp} style={styles.clickableRow}>
            <Star size={20} color="#F59E0B" style={{ marginRight: 12 }} />
            <Text style={[styles.rowTitle, { color: colors.text }]}>Rate Scan My PDF on Google Play</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity onPress={handleShareApp} style={styles.clickableRow}>
            <Share2 size={20} color={colors.text} style={{ marginRight: 12 }} />
            <Text style={[styles.rowTitle, { color: colors.text }]}>Share Application</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={[styles.modalDocContainer, { backgroundColor: colors.background }]}>
          <Header title="Privacy Policy" onBack={() => setPrivacyModalVisible(false)} />
          <ScrollView contentContainerStyle={styles.policyScroll}>
            <Text style={[styles.policyH1, { color: colors.text }]}>Privacy Policy for Scan My PDF</Text>
            <Text style={[styles.policyDate, { color: colors.textSecondary }]}>
              Last updated: September 2026
            </Text>

            <Text style={[styles.policyP, { color: colors.text }]}>
              Scan My PDF was engineered from the ground up to guarantee total document privacy.
            </Text>

            <Text style={[styles.policyH2, { color: colors.text }]}>1. 100% On-Device Processing</Text>
            <Text style={[styles.policyP, { color: colors.textSecondary }]}>
              Every scan, edge detection, perspective crop, and PDF operation (including merge, split,
              watermarking, and page manipulation) runs entirely on your local device. We never upload,
              transmit, or store your documents on external servers.
            </Text>

            <Text style={[styles.policyH2, { color: colors.text }]}>2. Zero Analytics & Hidden Tracking</Text>
            <Text style={[styles.policyP, { color: colors.textSecondary }]}>
              Scan My PDF does not include third-party tracking SDKs, advertising identifiers, or background
              telemetry. Your documents remain strictly your property.
            </Text>

            <Text style={[styles.policyH2, { color: colors.text }]}>3. Permissions Transparency</Text>
            <Text style={[styles.policyP, { color: colors.textSecondary }]}>
              • Camera: Used strictly to capture real-time document photographs.
              {'\n'}• Storage/Media: Used strictly to allow you to import images and save exported PDFs to your device.
            </Text>

            <Text style={[styles.policyH2, { color: colors.text }]}>4. Contact Us</Text>
            <Text style={[styles.policyP, { color: colors.textSecondary }]}>
              For questions or privacy inquiries, contact support@scanmypdf.app.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Terms of Use Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[styles.modalDocContainer, { backgroundColor: colors.background }]}>
          <Header title="Terms of Use" onBack={() => setTermsModalVisible(false)} />
          <ScrollView contentContainerStyle={styles.policyScroll}>
            <Text style={[styles.policyH1, { color: colors.text }]}>Terms & Conditions</Text>
            <Text style={[styles.policyP, { color: colors.textSecondary }]}>
              By using Scan My PDF, you agree to these terms. Scan My PDF provides local document digitization and
              PDF tools. Users retain full responsibility for the content they scan and export. Do not use
              Scan My PDF to duplicate copyrighted or restricted identity documents where prohibited by applicable
              law.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={[styles.aboutOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text style={[styles.aboutAppName, { color: colors.text }]}>Scan My PDF</Text>
            <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>v1.0.0 (Android Production)</Text>
            <Text style={[styles.aboutTagline, { color: colors.textSecondary }]}>
              "Scan. Convert. Manage. 100% Offline"
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing.md, width: '100%' }]} />

            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
              Engineered with React Native, TypeScript, and pdf-lib for modern, ultra-fast, offline document
              management.
            </Text>

            <TouchableOpacity
              onPress={() => setAboutModalVisible(false)}
              style={[styles.aboutCloseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  smallPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  modalDocContainer: {
    flex: 1,
  },
  policyScroll: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  policyH1: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  policyDate: {
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
  policyH2: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  policyP: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  aboutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  aboutCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  aboutLogoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: '800',
  },
  aboutVersion: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  aboutDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  aboutCloseBtn: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

