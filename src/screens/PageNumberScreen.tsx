import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hash, FolderOpen } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem, PageNumberConfig, PageNumberPosition } from '../types';
import { PdfService } from '../services/pdfService';
import { FileService } from '../services/fileService';

export const PageNumberScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [startNumber, setStartNumber] = useState<string>('1');
  const [format, setFormat] = useState<'number_only' | 'page_x' | 'page_x_of_y'>('page_x_of_y');
  const [fontSize, setFontSize] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    if (pdfs.length === 0) {
      Alert.alert('No PDFs Found', 'Please create or scan a PDF first.');
      return;
    }
    setAvailableDocs(pdfs);
    setPickerVisible(true);
  };

  const handleApplyNumbers = async () => {
    if (!selectedDoc) {
      Alert.alert('No PDF Selected', 'Please select a PDF document first.');
      return;
    }

    const startNumInt = parseInt(startNumber.trim(), 10) || 1;

    setLoading(true);
    try {
      const config: PageNumberConfig = {
        position,
        startNumber: startNumInt,
        format,
        fontSize,
      };

      const res = await PdfService.addPageNumbers(
        selectedDoc.uri,
        config,
        `${selectedDoc.title}_Numbered`
      );

      const numberedDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: `${selectedDoc.title} (Numbered)`,
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: selectedDoc.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(numberedDoc);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: numberedDoc });
    } catch (e: any) {
      setLoading(false);
      console.error('Page numbers error', e);
      Alert.alert('Error', e?.message || 'Could not add page numbers.');
    }
  };

  const positionOptions: { label: string; value: PageNumberPosition }[] = [
    { label: 'Bottom Center', value: 'bottom-center' },
    { label: 'Bottom Right', value: 'bottom-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Top Center', value: 'top-center' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Add Page Numbers"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleOpenPicker} style={styles.headerBtn}>
            <FolderOpen size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
      >
        {/* Document Selector */}
        <TouchableOpacity
          onPress={handleOpenPicker}
          style={[styles.docSelector, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <FolderOpen size={22} color={colors.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.docSelectorTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedDoc ? selectedDoc.title : 'Select PDF Document'}
            </Text>
            {selectedDoc ? (
              <Text style={[styles.docSelectorSub, { color: colors.textSecondary }]}>
                {selectedDoc.pageCount} pages • {FileService.formatFileSize(selectedDoc.fileSize)}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Position Selection */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          NUMBER POSITION
        </Text>
        <View style={styles.positionGrid}>
          {positionOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPosition(opt.value)}
              style={[
                styles.posCard,
                {
                  backgroundColor: colors.card,
                  borderColor: position === opt.value ? colors.primary : colors.border,
                  borderWidth: position === opt.value ? 2 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.posCardText,
                  { color: position === opt.value ? colors.primary : colors.text },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Format Selection */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          NUMBER FORMAT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: 'Page 1 of 10 ("Page X of Y")', val: 'page_x_of_y' as const },
            { label: 'Page 1 ("Page X")', val: 'page_x' as const },
            { label: '1 (Number only)', val: 'number_only' as const },
          ].map((f) => (
            <TouchableOpacity
              key={f.val}
              onPress={() => setFormat(f.val)}
              style={[
                styles.formatOption,
                {
                  backgroundColor: format === f.val ? colors.primaryLight : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.formatText,
                  { color: format === f.val ? colors.primary : colors.text },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Starting Number */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          STARTING PAGE NUMBER
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={startNumber}
            onChangeText={setStartNumber}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        {/* Apply Action */}
        <TouchableOpacity
          onPress={handleApplyNumbers}
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        >
          <Hash size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.applyBtnText}>Stamp Page Numbers</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Document Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select PDF Document</Text>
            <FlatList
              data={availableDocs}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoc(item);
                    setPickerVisible(false);
                  }}
                  style={[styles.pickerRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.pickerTitleText, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.pickerSubText, { color: colors.textSecondary }]}>
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

      <LoadingOverlay visible={loading} message="Adding page numbers..." />
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
  scrollContent: {
    padding: Spacing.lg,
  },
  docSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  docSelectorTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  docSelectorSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  posCard: {
    width: '48%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posCardText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  formatOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: 2,
  },
  formatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    margin: 4,
  },
  applyBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  applyBtnText: {
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
  pickerTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
});

