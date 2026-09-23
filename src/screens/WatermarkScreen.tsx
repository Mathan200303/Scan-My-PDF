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
import { Stamp, FolderOpen, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem, WatermarkConfig } from '../types';
import { PdfService } from '../services/pdfService';
import { FileService } from '../services/fileService';

export const WatermarkScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotation, setRotation] = useState<number>(45);
  const [position, setPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [pageScope, setPageScope] = useState<'all' | 'first'>('all');

  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    if (pdfs.length === 0) {
      Alert.alert('No PDFs Found', 'Create or scan a PDF document first.');
      return;
    }
    setAvailableDocs(pdfs);
    setPickerVisible(true);
  };

  const handleApplyWatermark = async () => {
    if (!selectedDoc) {
      Alert.alert('No PDF Selected', 'Please choose a target PDF document first.');
      return;
    }

    if (!watermarkText.trim()) {
      Alert.alert('Empty Text', 'Please enter watermark text.');
      return;
    }

    setLoading(true);
    try {
      const config: WatermarkConfig = {
        text: watermarkText.trim(),
        fontSize,
        opacity,
        rotation,
        position,
        pageScope,
      };

      const res = await PdfService.addWatermark(
        selectedDoc.uri,
        config,
        `${selectedDoc.title}_Watermarked`
      );

      const watermarkedDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: `${selectedDoc.title} (Watermarked)`,
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: selectedDoc.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(watermarkedDoc);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: watermarkedDoc });
    } catch (e: any) {
      setLoading(false);
      console.error('Watermark error', e);
      Alert.alert('Error', e?.message || 'Could not apply watermark.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Add Watermark"
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
        {/* Selected Document Indicator */}
        <TouchableOpacity
          onPress={handleOpenPicker}
          style={[styles.docSelector, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <FolderOpen size={22} color={colors.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.docSelectorTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedDoc ? selectedDoc.title : 'Select Target PDF Document'}
            </Text>
            {selectedDoc ? (
              <Text style={[styles.docSelectorSub, { color: colors.textSecondary }]}>
                {selectedDoc.pageCount} pages • {FileService.formatFileSize(selectedDoc.fileSize)}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Live Visual Preview */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          LIVE PREVIEW
        </Text>
        <View style={[styles.previewPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Simulated text lines */}
          <View style={[styles.dummyLine, { width: '80%', backgroundColor: colors.inputBg }]} />
          <View style={[styles.dummyLine, { width: '90%', backgroundColor: colors.inputBg }]} />
          <View style={[styles.dummyLine, { width: '75%', backgroundColor: colors.inputBg }]} />
          <View style={[styles.dummyLine, { width: '85%', backgroundColor: colors.inputBg }]} />

          {/* Watermark Overlay Preview */}
          <View
            style={[
              styles.watermarkStamp,
              {
                opacity,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <Text
              style={[
                styles.stampText,
                {
                  fontSize: Math.min(32, fontSize * 0.7),
                  color: colors.textSecondary,
                },
              ]}
            >
              {watermarkText || 'SAMPLE'}
            </Text>
          </View>
        </View>

        {/* Text Presets & Custom Input */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          WATERMARK TEXT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={watermarkText}
            onChangeText={setWatermarkText}
            placeholder="Watermark text (e.g. DRAFT)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          {/* Quick presets */}
          <View style={styles.presetsRow}>
            {['DRAFT', 'CONFIDENTIAL', 'SAMPLE', 'COPY'].map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => setWatermarkText(tag)}
                style={[
                  styles.presetPill,
                  {
                    backgroundColor: watermarkText === tag ? colors.primary : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: watermarkText === tag ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Config Sliders & Toggles */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Rotation Toggle */}
          <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>Rotation Angle</Text>
          <View style={styles.optionRow}>
            {[
              { label: 'Diagonal (45°)', val: 45 },
              { label: 'Horizontal (0°)', val: 0 },
              { label: 'Reverse (-45°)', val: -45 },
            ].map((r) => (
              <TouchableOpacity
                key={r.label}
                onPress={() => setRotation(r.val)}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: rotation === r.val ? colors.primary : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: rotation === r.val ? '#FFFFFF' : colors.text,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Opacity */}
          <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            Opacity Level
          </Text>
          <View style={styles.optionRow}>
            {[
              { label: 'Subtle (15%)', val: 0.15 },
              { label: 'Medium (30%)', val: 0.3 },
              { label: 'Solid (60%)', val: 0.6 },
            ].map((op) => (
              <TouchableOpacity
                key={op.label}
                onPress={() => setOpacity(op.val)}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: opacity === op.val ? colors.primary : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: opacity === op.val ? '#FFFFFF' : colors.text,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Page Scope */}
          <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            Apply Watermark To
          </Text>
          <View style={styles.optionRow}>
            {[
              { label: 'All Pages', val: 'all' },
              { label: 'First Page Only', val: 'first' },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => setPageScope(s.val as any)}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: pageScope === s.val ? colors.primary : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: pageScope === s.val ? '#FFFFFF' : colors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Apply Action */}
        <TouchableOpacity
          onPress={handleApplyWatermark}
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        >
          <Stamp size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.applyBtnText}>Apply Watermark to PDF</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Document Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Target PDF</Text>
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

      <LoadingOverlay visible={loading} message="Applying Watermark..." />
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
  previewPaper: {
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dummyLine: {
    height: 6,
    borderRadius: 3,
    marginVertical: 4,
  },
  watermarkStamp: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontWeight: '900',
    letterSpacing: 2,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  input: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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

