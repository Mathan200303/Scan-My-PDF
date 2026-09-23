import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Files,
  CheckSquare,
  Square,
  Download,
  FolderOpen,
  FileUp,
  Check,
  Eye,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ModernDialog, DialogAction } from '../components/ModernDialog';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem } from '../types';
import { PdfService } from '../services/pdfService';
import { PdfRendererService } from '../services/pdfRendererService';
import { FileService } from '../services/fileService';
import { ShareService } from '../services/shareService';

export const PdfToImageScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [outputFormat, setOutputFormat] = useState<'JPG' | 'PNG'>('JPG');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Reading PDF document...');
  const [pageThumbnails, setPageThumbnails] = useState<{ [pageNum: number]: string }>({});

  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: 'success' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
    actions: DialogAction[];
  }>({
    type: 'info',
    title: '',
    message: '',
    actions: [],
  });

  const showDialog = (
    type: 'success' | 'error' | 'info' | 'confirm',
    title: string,
    message: string,
    actions: DialogAction[]
  ) => {
    setDialogConfig({ type, title, message, actions });
    setDialogVisible(true);
  };

  // Generate crisp thumbnails for all pages of the selected PDF
  const loadPageThumbnails = async (pdfUri: string, count: number, docId: string) => {
    setPageThumbnails({});
    for (let p = 1; p <= count; p++) {
      try {
        const dest = `${FileService.getThumbsDirectory()}thumb_${docId}_p${p}.jpg`;
        const res = await PdfRendererService.renderPageToImage(pdfUri, p, 'JPG', dest, 75);
        if (res?.uri) {
          setPageThumbnails((prev) => ({ ...prev, [p]: res.uri }));
        }
      } catch (err) {
        console.warn(`Could not render thumbnail for page ${p}`, err);
      }
    }
  };

  // Open native Android file manager to pick ANY PDF from phone
  const handlePickFromPhone = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setLoading(true);
        setLoadingMsg('Analyzing PDF pages...');

        let pageCount = 1;
        try {
          pageCount = await PdfRendererService.getPageCount(file.uri);
        } catch {
          pageCount = await PdfService.getPdfPageCount(file.uri);
        }

        const fileSize = file.size || (await FileService.getFileSizeBytes(file.uri));
        const docId = `external_${Date.now()}`;

        const pickedItem: DocumentItem = {
          id: docId,
          title: file.name.replace(/\.pdf$/i, ''),
          uri: file.uri,
          type: 'pdf',
          pageCount,
          fileSize,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSelectedDoc(pickedItem);
        setTotalPages(pageCount);

        const all = new Set<number>();
        for (let i = 1; i <= pageCount; i++) all.add(i);
        setSelectedPages(all);
        setLoading(false);

        // Render page previews
        loadPageThumbnails(file.uri, pageCount, docId);
      }
    } catch (e: any) {
      setLoading(false);
      console.error('File pick error', e);
      showDialog(
        'error',
        'Open Failed',
        'Could not open the selected PDF file from device storage.',
        [{ label: 'OK', primary: true, onPress: () => {} }]
      );
    }
  };

  // Pick from documents saved in app
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const handleOpenAppDocs = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    if (pdfs.length === 0) {
      handlePickFromPhone();
      return;
    }
    setAvailableDocs(pdfs);
    setPickerModalVisible(true);
  };

  const handleSelectAppDoc = async (doc: DocumentItem) => {
    setPickerModalVisible(false);
    setSelectedDoc(doc);
    setLoading(true);
    try {
      let count = 1;
      try {
        count = await PdfRendererService.getPageCount(doc.uri);
      } catch {
        count = await PdfService.getPdfPageCount(doc.uri);
      }
      setTotalPages(count);
      const all = new Set<number>();
      for (let i = 1; i <= count; i++) all.add(i);
      setSelectedPages(all);
      loadPageThumbnails(doc.uri, count, doc.id);
    } catch (e) {
      console.error('Could not read PDF', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    setSelectedPages(next);
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === totalPages) {
      setSelectedPages(new Set());
    } else {
      const all = new Set<number>();
      for (let i = 1; i <= totalPages; i++) all.add(i);
      setSelectedPages(all);
    }
  };

  const handleExport = async () => {
    if (!selectedDoc || selectedPages.size === 0) {
      showDialog(
        'info',
        'No Pages Selected',
        'Please select at least one page to export as an image.',
        [{ label: 'OK', primary: true, onPress: () => {} }]
      );
      return;
    }

    setLoading(true);
    setLoadingMsg(`Extracting ${selectedPages.size} page(s) to ${outputFormat}...`);

    try {
      const ext = outputFormat.toLowerCase();
      const baseClean = FileService.sanitizeFileName(selectedDoc.title);
      const exportedItems: DocumentItem[] = [];

      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);

      for (let i = 0; i < sortedPages.length; i++) {
        const pageNum = sortedPages[i];
        setLoadingMsg(`Converting page ${pageNum} of ${totalPages} to ${outputFormat}...`);

        const paddedNum = String(pageNum).padStart(2, '0');
        const fileName = `${baseClean}_page_${paddedNum}.${ext}`;
        const destPath = `${FileService.getDocsDirectory()}${fileName}`;

        // Render real HD image using native Android PdfRenderer & register with Phone Gallery!
        const result = await PdfRendererService.renderPageToImage(
          selectedDoc.uri,
          pageNum,
          outputFormat,
          destPath,
          95
        );

        // Also save a copy to public Pictures/ScanMyPDF gallery folder
        await PdfRendererService.saveToDownloads(
          result.uri,
          fileName,
          outputFormat === 'PNG' ? 'image/png' : 'image/jpeg'
        );

        const item: DocumentItem = {
          id: `img_${Date.now()}_p${pageNum}`,
          title: fileName,
          uri: result.uri,
          type: 'image',
          pageCount: 1,
          fileSize: result.fileSize,
          thumbnailUri: result.uri,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await DocumentRepository.save(item);
        exportedItems.push(item);
      }

      setLoading(false);

      // Show sleek modern dialog with Zero Emojis and Direct View/Download/Share actions
      showDialog(
        'success',
        'Export Complete',
        `Successfully extracted ${exportedItems.length} page(s) as ${outputFormat} images and saved to your Phone Gallery (Pictures/ScanMyPDF) and library.`,
        [
          {
            label: 'View Document',
            primary: true,
            icon: Eye,
            onPress: () => {
              if (exportedItems.length > 0) {
                navigation.navigate('DocumentViewer', { document: exportedItems[0] });
              }
            },
          },
          {
            label: 'Share Image',
            primary: false,
            icon: Share2,
            onPress: () => {
              if (exportedItems.length > 0) {
                ShareService.shareFile(exportedItems[0].uri);
              }
            },
          },
          {
            label: 'Done',
            primary: false,
            onPress: () => {},
          },
        ]
      );
    } catch (e: any) {
      setLoading(false);
      console.error('Export error', e);
      showDialog(
        'error',
        'Export Failed',
        e?.message || 'Could not convert PDF pages to image.',
        [{ label: 'OK', primary: true, onPress: () => {} }]
      );
    }
  };

  const pageList = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="PDF to Image"
        onBack={() => navigation.goBack()}
        rightAction={
          selectedDoc ? (
            <TouchableOpacity onPress={handlePickFromPhone} style={styles.changeDocBtn}>
              <FileUp size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      {!selectedDoc ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Files size={44} color={colors.primary} />
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>Convert PDF to Images</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Choose any PDF file stored on your phone to extract pages into high-resolution JPG or PNG images.
          </Text>

          {/* Primary Action: Choose from phone storage */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickFromPhone}
            style={[styles.primaryPickBtn, { backgroundColor: colors.primary }]}
          >
            <FolderOpen size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryPickText}>Choose PDF from Phone Files</Text>
          </TouchableOpacity>

          {/* Secondary Action: Select from Scanned Docs */}
          <TouchableOpacity
            onPress={handleOpenAppDocs}
            style={[styles.secondaryPickBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Files size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryPickText, { color: colors.text }]}>
              Choose from Scanned in App
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Document Info Card */}
          <View style={[styles.docHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.docHeaderInfo}>
              <Text style={[styles.docTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedDoc.title}
              </Text>
              <Text style={[styles.docSub, { color: colors.textSecondary }]}>
                {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {selectedPages.size} selected •{' '}
                {FileService.formatFileSize(selectedDoc.fileSize)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePickFromPhone}
              style={[styles.smallChangeBtn, { backgroundColor: colors.inputBg }]}
            >
              <Text style={[styles.smallChangeText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Format Selector & Select All Bar */}
          <View style={[styles.controlBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            {/* Format toggle pills */}
            <View style={[styles.formatToggle, { backgroundColor: colors.inputBg }]}>
              {(['JPG', 'PNG'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  onPress={() => setOutputFormat(fmt)}
                  style={[
                    styles.formatPill,
                    outputFormat === fmt ? [styles.formatPillActive, { backgroundColor: colors.primary }] : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.formatPillText,
                      { color: outputFormat === fmt ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {fmt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select All / Deselect button */}
            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
              {selectedPages.size === totalPages ? (
                <CheckSquare size={18} color={colors.primary} style={{ marginRight: 6 }} />
              ) : (
                <Square size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.selectAllText, { color: colors.text }]}>
                {selectedPages.size === totalPages ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid of Real Page Previews */}
          <FlatList
            data={pageList}
            keyExtractor={(item) => `page_${item}`}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item: pageNum }) => {
              const isSelected = selectedPages.has(pageNum);
              const thumb = pageThumbnails[pageNum];

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => togglePageSelection(pageNum)}
                  style={[
                    styles.pageCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {/* Selection Check Badge */}
                  <View
                    style={[
                      styles.checkBadge,
                      {
                        backgroundColor: isSelected ? colors.primary : 'rgba(0, 0, 0, 0.45)',
                        borderColor: isSelected ? colors.primary : '#FFFFFF',
                      },
                    ]}
                  >
                    {isSelected ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>

                  {/* Real Document Page Preview Image */}
                  <View style={[styles.pageThumbBox, { backgroundColor: colors.inputBg }]}>
                    {thumb ? (
                      <Image
                        source={{ uri: thumb }}
                        style={styles.pageThumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.pageThumbLoading}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Page Label */}
                  <Text
                    style={[
                      styles.pageNumLabel,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    Page {pageNum}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Bottom Export Bar */}
          <View
            style={[
              styles.bottomExportBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExport}
              disabled={selectedPages.size === 0 || loading}
              style={[
                styles.exportActionBtn,
                {
                  backgroundColor: selectedPages.size > 0 ? colors.primary : colors.border,
                },
              ]}
            >
              <Download size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportActionText}>
                {selectedPages.size === 0
                  ? 'Select Pages to Export'
                  : `Export ${selectedPages.size} ${outputFormat} Image${selectedPages.size > 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Internal Docs Picker Modal */}
      {pickerModalVisible && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }]}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select PDF Document</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableDocs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: Spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectAppDoc(item)}
                  style={[styles.appDocRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                >
                  <Files size={24} color={colors.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.appDocTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.appDocSub, { color: colors.textSecondary }]}>
                      {item.pageCount} pages • {FileService.formatFileSize(item.fileSize)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message={loadingMsg} />

      {/* Custom Sleek Modal Dialog */}
      <ModernDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        actions={dialogConfig.actions}
        onClose={() => setDialogVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  changeDocBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  primaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  primaryPickText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryPickText: {
    fontSize: 15,
    fontWeight: '600',
  },
  docHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  docHeaderInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  docSub: {
    fontSize: 12,
  },
  smallChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  smallChangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginTop: Spacing.sm,
  },
  formatToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 3,
  },
  formatPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.sm - 2,
  },
  formatPillActive: {
    elevation: 2,
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContent: {
    padding: Spacing.sm,
  },
  pageCard: {
    flex: 1 / 3,
    margin: Spacing.xs,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    alignItems: 'center',
    position: 'relative',
    minHeight: 150,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
  },
  pageThumbBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  pageThumbImg: {
    width: '100%',
    height: '100%',
  },
  pageThumbLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomExportBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  exportActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  appDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  appDocTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  appDocSub: {
    fontSize: 12,
  },
});
