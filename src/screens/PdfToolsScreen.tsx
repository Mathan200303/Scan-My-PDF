import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GitMerge,
  Scissors,
  Layers,
  GraduationCap,
  Stamp,
  Hash,
  Minimize2,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing } from '../constants/theme';
import { ToolCard } from '../components/ToolCard';

export const PdfToolsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PDF Tools</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Offline Document Utilities
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.categoryHeading, { color: colors.textSecondary }]}>
          ORGANIZE & RESTRUCTURE
        </Text>

        {/* Merge PDF */}
        <ToolCard
          title="Merge PDF"
          description="Combine multiple PDF documents into a single organized file."
          icon={<GitMerge size={22} color={colors.primary} />}
          iconBgColor={colors.primaryLight}
          onPress={() => navigation.navigate('MergePdf')}
        />

        {/* Split PDF */}
        <ToolCard
          title="Split PDF"
          description="Extract selected pages or custom page ranges into a new document."
          icon={<Scissors size={22} color="#8B5CF6" />}
          iconBgColor="#EDE9FE"
          onPress={() => navigation.navigate('SplitPdf')}
        />

        {/* Page Manager */}
        <ToolCard
          title="Page Manager"
          description="Reorder, rotate, or delete specific pages from any PDF."
          icon={<Layers size={22} color="#0EA5E9" />}
          iconBgColor="#E0F2FE"
          onPress={() => navigation.navigate('PageManager')}
        />

        <Text style={[styles.categoryHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          ACADEMIC & BRANDING
        </Text>

        {/* Cover Page Generator */}
        <ToolCard
          title="Add Cover Page"
          description="Generate academic assignment and business report cover sheets."
          icon={<GraduationCap size={22} color="#10B981" />}
          iconBgColor={colors.successLight}
          onPress={() => navigation.navigate('CoverPage')}
        />

        {/* Watermark */}
        <ToolCard
          title="Add Watermark"
          description="Stamp custom security text like CONFIDENTIAL or DRAFT."
          icon={<Stamp size={22} color="#F59E0B" />}
          iconBgColor={colors.warningLight}
          onPress={() => navigation.navigate('Watermark')}
        />

        {/* Page Numbers */}
        <ToolCard
          title="Add Page Numbers"
          description="Number your PDF pages with customizable positions and formats."
          icon={<Hash size={22} color="#EC4899" />}
          iconBgColor="#FCE7F3"
          onPress={() => navigation.navigate('PageNumber')}
        />
      </ScrollView>
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
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  categoryHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
});

