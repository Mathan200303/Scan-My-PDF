import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scissors, FolderOpen, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem } from '../types';
import { PdfService } from '../services/pdfService';
import { FileService } from '../services/fileService';

export const SplitPdfScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [outputTitle, setOutputTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    if (pdfs.length === 0) {
      Alert.alert('No PDFs Available', 'Please scan or create a PDF first.');
      return;
    }
    setAvailableDocs(pdfs);
    setPickerVisible(true);
  };

  const handleSelectDoc = async (doc: DocumentItem) => {
    setPickerVisible(false);
    setSelectedDoc(doc);
    setLoading(true);
    try {
      const count = await PdfService.getPdfPageCount(doc.uri);
      setTotalPages(count);
      setRangeInput(count > 1 ? `1-${Math.min(count, 3)}` : '1');
      setOutputTitle(`${doc.title}_Extracted`);
    } catch (e) {
      console.error('Split load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!selectedDoc) return;
    const parsedIndices = PdfService.parsePageRange(rangeInput, totalPages);

    if (parsedIndices.length === 0) {
      Alert.alert(
        'Invalid Range',
        `Please enter a valid page range between 1 and ${totalPages} (e.g. 1-3, 5).`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await PdfService.splitPdf(
        selectedDoc.uri,
        parsedIndices,
        outputTitle || `${selectedDoc.title}_Split`
      );

      const splitItem: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: outputTitle.trim() || `${selectedDoc.title}_Split`,
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: selectedDoc.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(splitItem);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: splitItem });
    } catch (e: any) {
      setLoading(false);
      console.error('Split error', e);
      Alert.alert('Split Failed', e?.message || 'Could not extract pages.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Split PDF"
        onBack={() => navigation.goBack()}
        rightAction={
          selectedDoc ? (
            <TouchableOpacity onPress={handleOpenPicker} style={styles.headerBtn}>
              <FolderOpen size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      {!selectedDoc ? (
        <EmptyState
          icon={<Scissors size={40} color={colors.primary} />}
          title="Select a PDF to Split"
          description="Extract individual pages or custom ranges without modifying the original file."
          actionTitle="Choose PDF Document"
          onAction={handleOpenPicker}
        />
      ) : (
        <View style={styles.content}>
          {/* Document Summary */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.docTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedDoc.title}
            </Text>
            <Text style={[styles.docPages, { color: colors.primary }]}>
              Total Pages: {totalPages}
            </Text>
          </View>

          {/* Page Range Input */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.md }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Pages to Extract</Text>
            <TextInput
              value={rangeInput}
              onChangeText={setRangeInput}
              placeholder="e.g. 1-3, 5, 8-10"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Enter ranges (e.g. 1-4) or comma-separated numbers (e.g. 1, 3, 5) up to {totalPages}.
            </Text>
          </View>

          {/* New Document Name */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.md }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>New File Name</Text>
            <TextInput
              value={outputTitle}
              onChangeText={setOutputTitle}
              placeholder="Output Document Name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
          </View>

          {/* Bottom Action */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              onPress={handleSplit}
              style={[styles.splitBtn, { backgroundColor: colors.primary }]}
            >
              <Scissors size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.splitBtnText}>Extract & Save PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select PDF Document</Text>
            <FlatList
              data={availableDocs}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectDoc(item)}
                  style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.pickerDocTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.pickerDocMeta, { color: colors.textSecondary }]}>
                    {item.pageCount} pages • {FileService.formatFileSize(item.fileSize)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <LoadingOverlay visible={loading} message="Splitting PDF..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  docPages: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
  },
  bottomBar: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
  },
  splitBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: Spacing.xl,
    zIndex: 10,
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  pickerRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  pickerDocTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerDocMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
});

