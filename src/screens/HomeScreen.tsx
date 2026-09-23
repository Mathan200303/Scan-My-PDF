import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Camera,
  FileImage,
  FileText,
  Wrench,
  Search,
  Files,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem } from '../types';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';
import { BannerAdView } from '../components/BannerAdView';
import { ShareService } from '../services/shareService';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = async () => {
    const list = await DocumentRepository.getAll();
    setRecentDocs(list.slice(0, 10)); // Top 10 recent
  };

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleShare = async (item: DocumentItem) => {
    await ShareService.shareFile(item.uri);
  };

  const handleDelete = async (item: DocumentItem) => {
    await DocumentRepository.delete(item.id);
    await loadDocuments();
  };

  const handleRename = async (item: DocumentItem, newTitle: string) => {
    await DocumentRepository.rename(item.id, newTitle);
    await loadDocuments();
  };

  const handleDuplicate = async (item: DocumentItem) => {
    await DocumentRepository.duplicate(item.id);
    await loadDocuments();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandText, { color: colors.text }]}>Scan My PDF</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('DocumentsTab')}
          style={[styles.iconButton, { backgroundColor: colors.inputBg }]}
        >
          <Search size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Actions Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          QUICK ACTIONS
        </Text>

        <View style={styles.actionGrid}>
          {/* Scan Document */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CameraScreen')}
            style={[styles.primaryActionCard, { backgroundColor: colors.primary }]}
          >
            <View style={styles.actionIconCircle}>
              <Camera size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.primaryActionTitle}>Scan Document</Text>
            <Text style={styles.primaryActionDesc}>Camera edge-detect & crop</Text>
            <View style={styles.cardSparkle}>
              <Sparkles size={14} color="#FDE047" />
            </View>
          </TouchableOpacity>

          <View style={styles.secondaryActionsCol}>
            {/* Image to PDF */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ImageToPdf')}
              style={[
                styles.secondaryActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.miniIconBg, { backgroundColor: colors.primaryLight }]}>
                <FileImage size={18} color={colors.primary} />
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>
                  Image to PDF
                </Text>
                <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary }]}>
                  Gallery photos to PDF
                </Text>
              </View>
            </TouchableOpacity>

            {/* PDF to Image */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PdfToImage')}
              style={[
                styles.secondaryActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.miniIconBg, { backgroundColor: colors.warningLight }]}>
                <Files size={18} color={colors.warning} />
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>
                  PDF to Image
                </Text>
                <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary }]}>
                  Extract pages to JPG
                </Text>
              </View>
            </TouchableOpacity>

            {/* PDF Tools */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ToolsTab')}
              style={[
                styles.secondaryActionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.miniIconBg, { backgroundColor: colors.successLight }]}>
                <Wrench size={18} color={colors.success} />
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={[styles.secondaryActionTitle, { color: colors.text }]}>
                  PDF Tools
                </Text>
                <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary }]}>
                  Merge, split, watermark
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Documents Header */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
            RECENT DOCUMENTS
          </Text>
          {recentDocs.length > 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('DocumentsTab')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Recent Documents List */}
        {recentDocs.length === 0 ? (
          <EmptyState
            icon={<FileText size={36} color={colors.primary} />}
            title="No Documents Yet"
            description="Scan documents or import photos to create your first PDF document."
            actionTitle="Scan Document"
            onAction={() => navigation.navigate('CameraScreen')}
          />
        ) : (
          recentDocs.map((item) => (
            <DocumentCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('DocumentViewer', { document: item })}
              onShare={handleShare}
              onDelete={handleDelete}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
            />
          ))
        )}

        {/* AdMob Banner Ad View */}
        <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
          <BannerAdView />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  actionGrid: {
    marginBottom: Spacing.xl,
  },
  primaryActionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  primaryActionDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  cardSparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 12,
  },
  secondaryActionsCol: {
    gap: Spacing.sm,
  },
  secondaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  miniIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionTextWrapper: {
    flex: 1,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

