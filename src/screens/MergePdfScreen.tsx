import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  FilePlus,
  GitMerge,
  Trash2,
  MoveUp,
  MoveDown,
  FileText,
  Check,
  FolderOpen,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { DocumentRepository } from '../storage/documentRepository';
import { DocumentItem } from '../types';
import { PdfService } from '../services/pdfService';
import { FileService } from '../services/fileService';

export const MergePdfScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDocs, setSelectedDocs] = useState<DocumentItem[]>([]);
  const [outputTitle, setOutputTitle] = useState(`Merged_${new Date().toISOString().slice(0, 10)}`);
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handlePickFromPhone = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        for (const file of res.assets) {
          const count = await PdfService.getPdfPageCount(file.uri);
          const size = file.size || (await FileService.getFileSizeBytes(file.uri));
          const item: DocumentItem = {
            id: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            title: file.name.replace(/\.pdf$/i, ''),
            uri: file.uri,
            type: 'pdf',
            pageCount: count,
            fileSize: size,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setSelectedDocs((prev) => [...prev, item]);
        }
      }
    } catch (e) {
      console.error('File pick error', e);
    }
  };

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    setAvailableDocs(pdfs);
    setPickerVisible(true);
  };

  const handleToggleDocSelection = (doc: DocumentItem) => {
    const exists = selectedDocs.some((d) => d.id === doc.id);
    if (exists) {
      setSelectedDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } else {
      setSelectedDocs((prev) => [...prev, doc]);
    }
  };

  const handleRemove = (index: number) => {
    setSelectedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedDocs];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSelectedDocs(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedDocs.length - 1) return;
    const updated = [...selectedDocs];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSelectedDocs(updated);
  };

  const handleMerge = async () => {
    if (selectedDocs.length < 2) {
      Alert.alert('Minimum 2 Required', 'Please select at least 2 PDF documents to merge.');
      return;
    }

    setLoading(true);
    try {
      const uris = selectedDocs.map((d) => d.uri);
      const res = await PdfService.mergePdfs(uris, outputTitle);

      const mergedItem: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: outputTitle.trim() || 'Merged_Document',
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: selectedDocs[0]?.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(mergedItem);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: mergedItem });
    } catch (e: any) {
      setLoading(false);
      console.error('Merge error', e);
      Alert.alert('Merge Failed', e?.message || 'Could not merge documents.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Merge PDFs"
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={handlePickFromPhone} style={styles.headerBtn}>
              <FolderOpen size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenPicker} style={styles.headerBtn}>
              <FilePlus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {selectedDocs.length === 0 ? (
        <EmptyState
          icon={<GitMerge size={40} color={colors.primary} />}
          title="Select PDFs to Merge"
          description="Choose 2 or more PDF documents from your phone or app scans to combine them."
          actionTitle="Choose from Phone Files"
          onAction={handlePickFromPhone}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Document name input */}
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Output File Name</Text>
            <TextInput
              value={outputTitle}
              onChangeText={setOutputTitle}
              placeholder="Merged Document Name"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
          </View>

          {/* List of PDFs to merge in order */}
          <FlatList
            data={selectedDocs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <View style={[styles.docItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.orderBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.orderBadgeText}>{index + 1}</Text>
                </View>

                <View style={styles.docItemInfo}>
                  <Text style={[styles.docItemTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.docItemMeta, { color: colors.textSecondary }]}>
                    {item.pageCount} pages • {FileService.formatFileSize(item.fileSize)}
                  </Text>
                </View>

                {/* Move Up / Down & Remove */}
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <MoveUp size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === selectedDocs.length - 1}
                    style={[styles.arrowBtn, { opacity: index === selectedDocs.length - 1 ? 0.3 : 1 }]}
                  >
                    <MoveDown size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemove(index)} style={styles.removeBtn}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Merge trigger bar */}
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
              onPress={handleMerge}
              disabled={selectedDocs.length < 2}
              style={[
                styles.mergeBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: selectedDocs.length < 2 ? 0.5 : 1,
                },
              ]}
            >
              <GitMerge size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.mergeBtnText}>
                Merge {selectedDocs.length} Documents
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select PDFs to Combine</Text>
            <FlatList
              data={availableDocs}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => {
                const isSelected = selectedDocs.some((d) => d.id === item.id);
                return (
                  <TouchableOpacity
                    onPress={() => handleToggleDocSelection(item)}
                    style={[
                      styles.pickerRow,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerDocTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.pickerDocMeta, { color: colors.textSecondary }]}>
                        {item.pageCount} pages • {FileService.formatFileSize(item.fileSize)}
                      </Text>
                    </View>
                    {isSelected ? <Check size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <LoadingOverlay visible={loading} message="Merging PDF documents..." />
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
  inputBox: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  docItemInfo: {
    flex: 1,
  },
  docItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  docItemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowBtn: {
    padding: 6,
  },
  removeBtn: {
    padding: 6,
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: Spacing.lg,
  },
  mergeBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mergeBtnText: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
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
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});

