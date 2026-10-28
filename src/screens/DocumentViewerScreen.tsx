import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Share2,
  Trash2,
  Edit3,
  FileText,
  Download,
  Info,
  Calendar,
  HardDrive,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { DocumentItem } from '../types';
import { Header } from '../components/Header';
import { FileService } from '../services/fileService';
import { ShareService } from '../services/shareService';
import { DocumentRepository } from '../storage/documentRepository';
import { PdfRendererService } from '../services/pdfRendererService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DocumentViewerScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const initialDoc: DocumentItem = route.params.document;

  const [document, setDocument] = useState<DocumentItem>(initialDoc);
  const [pageCount, setPageCount] = useState<number>(initialDoc.pageCount || 1);
  const [pageUris, setPageUris] = useState<(string | null)[]>(() => {
    const count = initialDoc.pageCount || 1;
    const arr = new Array(count).fill(null);
    if (initialDoc.thumbnailUri) {
      arr[0] = initialDoc.thumbnailUri;
    }
    return arr;
  });
  const [renameVisible, setRenameVisible] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [infoVisible, setInfoVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Multi-page PDF Rendering: renders every page so user can scroll through the entire PDF
  useEffect(() => {
    let isMounted = true;

    const loadAllPages = async () => {
      if (document.type === 'pdf' && document.uri) {
        try {
          const totalPages =
            document.pageCount && document.pageCount > 0
              ? document.pageCount
              : await PdfRendererService.getPageCount(document.uri);

          if (isMounted) {
            setPageCount(totalPages);
            setPageUris((prev) => {
              const next = new Array(totalPages).fill(null);
              for (let i = 0; i < totalPages; i++) {
                if (prev[i]) next[i] = prev[i];
              }
              if (!next[0] && document.thumbnailUri) {
                next[0] = document.thumbnailUri;
              }
              return next;
            });
          }

          // Sequentially render each page to crisp image
          for (let p = 1; p <= totalPages; p++) {
            if (!isMounted) break;
            const destPath = `${FileService.getDocsDirectory()}/preview_${document.id}_${p}.jpg`;
            try {
              const rendered = await PdfRendererService.renderPageToImage(
                document.uri,
                p,
                'JPG',
                destPath,
                92
              );
              if (isMounted && rendered?.uri) {
                setPageUris((prev) => {
                  const updated = [...prev];
                  updated[p - 1] = rendered.uri;
                  return updated;
                });
              }
            } catch (err) {
              console.log(`PDF page ${p} render fallback:`, err);
            }
          }
        } catch (err) {
          console.log('PDF multi-page preview error:', err);
        }
      }
    };

    loadAllPages();

    return () => {
      isMounted = false;
    };
  }, [document.type, document.uri, document.id, document.pageCount]);

  const handleShare = async () => {
    await ShareService.shareFile(document.uri);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const isImg = document.type === 'image';
      const ext = isImg ? (document.uri.endsWith('.png') ? '.png' : '.jpg') : '.pdf';
      const cleanTitle = FileService.sanitizeFileName(document.title);
      const fileName = `${cleanTitle}${ext}`;

      await PdfRendererService.saveToDownloads(
        document.uri,
        fileName,
        isImg ? (ext === '.png' ? 'image/png' : 'image/jpeg') : 'application/pdf'
      );

      Alert.alert(
        'Saved Successfully',
        `"${fileName}" has been saved to your phone's ${
          isImg ? 'Gallery (Pictures/ScanMyPDF)' : 'Downloads (Downloads/ScanMyPDF)'
        } folder.`
      );
    } catch (e: any) {
      console.error('Download error', e);
      ShareService.shareFile(document.uri);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${document.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await DocumentRepository.delete(document.id);
            handleBack();
          },
        },
      ]
    );
  };

  const handleConfirmRename = async () => {
    if (newTitle.trim()) {
      const updated = await DocumentRepository.rename(document.id, newTitle.trim());
      if (updated) {
        setDocument(updated);
      }
      setRenameVisible(false);
    }
  };

  const imageSourceUri = React.useMemo(() => {
    const raw =
      pageUris[0] ||
      document.thumbnailUri ||
      (document.type === 'image' ? document.uri : '');
    if (!raw) return '';
    if (
      raw.startsWith('file://') ||
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('content://') ||
      raw.startsWith('data:')
    ) {
      return raw;
    }
    return `file://${raw}`;
  }, [pageUris, document.thumbnailUri, document.uri, document.type]);

  const handleBack = () => {
    navigation.navigate('MainTabs');
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={document.title}
        subtitle={`${document.type.toUpperCase()} • ${FileService.formatFileSize(document.fileSize)}`}
        onBack={handleBack}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={[styles.headerBtn, { opacity: downloading ? 0.5 : 1 }]}
            >
              <Download size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInfoVisible(true)} style={styles.headerBtn}>
              <Info size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
              <Share2 size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Main Multi-Page Scrollable Viewer Area */}
      <ScrollView
        contentContainerStyle={[
          styles.viewerScroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 85 },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {document.type === 'pdf' ? (
          pageUris.map((uri, index) => (
            <View
              key={`page_${index}`}
              style={[
                styles.pageCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Page Number Badge */}
              <View style={styles.pageHeaderRow}>
                <View style={[styles.pageNumberBadge, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.pageNumberText, { color: colors.textSecondary }]}>
                    Page {index + 1} of {pageCount}
                  </Text>
                </View>
              </View>

              {uri ? (
                <Image
                  source={{ uri: uri.startsWith('file://') ? uri : `file://${uri}` }}
                  style={styles.pageImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pageLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.pageLoadingText, { color: colors.textSecondary }]}>
                    Rendering Page {index + 1}...
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View
            style={[
              styles.pageCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {imageSourceUri ? (
              <Image
                source={{ uri: imageSourceUri }}
                style={styles.pageImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setNewTitle(document.title);
            setRenameVisible(true);
          }}
          style={styles.actionBtn}
        >
          <Edit3 size={18} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Rename</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          style={[styles.actionBtn, { opacity: downloading ? 0.5 : 1 }]}
        >
          <Download size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {downloading ? 'Saving...' : 'Download'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Share2 size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
          <Trash2 size={18} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Rename Dialog */}
      <Modal
        transparent
        visible={renameVisible}
        animationType="fade"
        onRequestClose={() => setRenameVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Rename File</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              style={[
                styles.dialogInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
              ]}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setRenameVisible(false)} style={styles.dialogBtn}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRename}
                style={[styles.dialogBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Dialog */}
      <Modal
        transparent
        visible={infoVisible}
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Document Details</Text>

            <View style={styles.infoRow}>
              <FileText size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{document.type.toUpperCase()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Layers size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Pages:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{document.pageCount}</Text>
            </View>

            <View style={styles.infoRow}>
              <HardDrive size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Size:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {FileService.formatFileSize(document.fileSize)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(document.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setInfoVisible(false)}
              style={[styles.dialogBtn, { backgroundColor: colors.primary, marginTop: Spacing.md }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }}>Close</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  viewerScroll: {
    padding: Spacing.md,
  },
  pageCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: 4,
  },
  pageNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pageNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pageImage: {
    width: '100%',
    height: (SCREEN_WIDTH - 32) * 1.414,
  },
  pageLoadingContainer: {
    width: '100%',
    height: (SCREEN_WIDTH - 32) * 1.414,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLoadingText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pdfIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pdfSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  dialogBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
