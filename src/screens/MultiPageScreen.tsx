import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  FileDown,
  Trash2,
  RotateCw,
  MoveUp,
  MoveDown,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { ScannedPage, PdfPageSize, PdfQuality, DocumentItem } from '../types';
import { Header } from '../components/Header';
import { PageThumbnail } from '../components/PageThumbnail';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ImageService } from '../services/imageService';
import { PdfService } from '../services/pdfService';
import { DocumentRepository } from '../storage/documentRepository';
import { AdService } from '../services/adService';

export const MultiPageScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [pages, setPages] = useState<ScannedPage[]>(route.params?.pages || []);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating PDF...');

  // PDF Export Dialog State
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [docTitle, setDocTitle] = useState(`Scan_${new Date().toISOString().slice(0, 10)}`);
  const [pageSize, setPageSize] = useState<PdfPageSize>('A4');
  const [quality, setQuality] = useState<PdfQuality>('HIGH');
  const [margin, setMargin] = useState<number>(10);

  const handleAddPage = () => {
    navigation.navigate('CameraScreen', {
      existingPages: pages,
    });
  };

  const handleRotatePage = async (index: number) => {
    const target = pages[index];
    try {
      const nextUri = await ImageService.rotateImage(target.currentUri, 90);
      const updatedList = [...pages];
      updatedList[index] = {
        ...target,
        currentUri: nextUri,
        rotation: (target.rotation + 90) % 360,
      };
      setPages(updatedList);
    } catch (e) {
      console.error('Rotate page error', e);
    }
  };

  const handleDeletePage = (index: number) => {
    Alert.alert('Delete Page', `Are you sure you want to remove Page ${index + 1}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = pages.filter((_, i) => i !== index);
          setPages(updated);
          if (updated.length === 0) {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...pages];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setPages(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === pages.length - 1) return;
    const updated = [...pages];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setPages(updated);
  };

  const handleSaveAsPdf = async () => {
    if (pages.length === 0) {
      Alert.alert('Empty Document', 'Please add at least one page before exporting.');
      return;
    }

    setExportModalVisible(false);
    setLoading(true);
    setLoadingMsg('Generating High-Quality PDF...');

    try {
      const imageUris = pages.map((p) => p.currentUri);
      const res = await PdfService.createPdfFromImages(imageUris, {
        title: docTitle.trim() || 'ScanMyPDF_Document',
        pageSize,
        quality,
        margin,
      });

      // Save to document repository
      const docItem: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: docTitle.trim() || 'ScanMyPDF_Document',
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: pages[0]?.currentUri || pages[0]?.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(docItem);
      setLoading(false);

      // Optionally show Interstitial Ad
      AdService.showInterstitial();

      // Open in document viewer
      navigation.replace('DocumentViewer', { document: docItem });
    } catch (e: any) {
      setLoading(false);
      console.error('PDF creation error', e);
      Alert.alert('Export Failed', e?.message || 'Could not generate PDF.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={`Scanned Document (${pages.length})`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={[styles.saveHeaderBtn, { backgroundColor: colors.primary }]}
          >
            <FileDown size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveHeaderBtnText}>Save PDF</Text>
          </TouchableOpacity>
        }
      />

      {/* Pages Grid */}
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (
          <View style={styles.pageCard}>
            <PageThumbnail
              uri={item.currentUri}
              pageNumber={index + 1}
              onRotate={() => handleRotatePage(index)}
              onDelete={() => handleDeletePage(index)}
            />

            {/* Reorder Buttons */}
            <View style={styles.orderControls}>
              <TouchableOpacity
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                style={[
                  styles.moveBtn,
                  { backgroundColor: colors.inputBg, opacity: index === 0 ? 0.3 : 1 },
                ]}
              >
                <MoveUp size={14} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMoveDown(index)}
                disabled={index === pages.length - 1}
                style={[
                  styles.moveBtn,
                  {
                    backgroundColor: colors.inputBg,
                    opacity: index === pages.length - 1 ? 0.3 : 1,
                  },
                ]}
              >
                <MoveDown size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Add Page Button */}
      <View
        style={[
          styles.bottomFloatingBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          onPress={handleAddPage}
          style={[styles.addPageBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
        >
          <Plus size={20} color={colors.primary} />
          <Text style={[styles.addPageText, { color: colors.primary }]}>Add More Pages</Text>
        </TouchableOpacity>
      </View>

      {/* PDF Export Config Modal */}
      <Modal
        transparent
        visible={exportModalVisible}
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTitleRow}>
              <FileText size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Export PDF Document</Text>
            </View>

            {/* Document Title Input */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Document Name</Text>
            <TextInput
              value={docTitle}
              onChangeText={setDocTitle}
              placeholder="Enter document name"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Page Size Options */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Page Size
            </Text>
            <View style={styles.optionRow}>
              {(['A4', 'LETTER', 'FIT'] as PdfPageSize[]).map((sz) => (
                <TouchableOpacity
                  key={sz}
                  onPress={() => setPageSize(sz)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: pageSize === sz ? colors.primary : colors.inputBg,
                      borderColor: pageSize === sz ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: pageSize === sz ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {sz === 'FIT' ? 'Fit to Image' : sz}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Image Quality Options */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Image Quality
            </Text>
            <View style={styles.optionRow}>
              {(['LOW', 'MEDIUM', 'HIGH'] as PdfQuality[]).map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuality(q)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: quality === q ? colors.primary : colors.inputBg,
                      borderColor: quality === q ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: quality === q ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Margins */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Page Margins
            </Text>
            <View style={styles.optionRow}>
              {[
                { label: 'None (0pt)', val: 0 },
                { label: 'Small (10pt)', val: 10 },
                { label: 'Standard (20pt)', val: 20 },
              ].map((m) => (
                <TouchableOpacity
                  key={m.label}
                  onPress={() => setMargin(m.val)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: margin === m.val ? colors.primary : colors.inputBg,
                      borderColor: margin === m.val ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: margin === m.val ? '#FFFFFF' : colors.text,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveAsPdf}
                style={[styles.confirmModalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Create PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={loading} message={loadingMsg} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 120,
    alignItems: 'center',
  },
  pageCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  orderControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  moveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  bottomFloatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  addPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addPageText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xxl,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: Spacing.sm,
  },
  confirmModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.md,
  },
});

