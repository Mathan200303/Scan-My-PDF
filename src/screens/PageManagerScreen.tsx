import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RotateCw,
  Trash2,
  MoveUp,
  MoveDown,
  Layers,
  Save,
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

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
}

export const PageManagerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [outputTitle, setOutputTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  const handleOpenPicker = async () => {
    const list = await DocumentRepository.getAll();
    const pdfs = list.filter((d) => d.type === 'pdf');
    if (pdfs.length === 0) {
      Alert.alert('No PDFs Found', 'Please scan or create a PDF first.');
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
      const initialPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `p_${i}`,
        originalIndex: i,
        rotation: 0,
      }));
      setPages(initialPages);
      setOutputTitle(`${doc.title}_Reordered`);
    } catch (e) {
      console.error('Page load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = (index: number) => {
    const updated = [...pages];
    updated[index] = {
      ...updated[index],
      rotation: (updated[index].rotation + 90) % 360,
    };
    setPages(updated);
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      Alert.alert('Cannot Delete', 'A PDF must contain at least one page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    if (!selectedDoc || pages.length === 0) return;

    setLoading(true);
    try {
      const newOrderIndices = pages.map((p) => p.originalIndex);
      const rotations: { [pageIndex: number]: number } = {};
      pages.forEach((p) => {
        if (p.rotation !== 0) {
          rotations[p.originalIndex] = p.rotation;
        }
      });

      const res = await PdfService.modifyPages(
        selectedDoc.uri,
        newOrderIndices,
        rotations,
        outputTitle || `${selectedDoc.title}_Edited`
      );

      const modifiedDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: outputTitle.trim() || `${selectedDoc.title}_Edited`,
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: selectedDoc.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(modifiedDoc);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: modifiedDoc });
    } catch (e: any) {
      setLoading(false);
      console.error('Modify pages error', e);
      Alert.alert('Error', e?.message || 'Failed to modify PDF pages.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="PDF Page Manager"
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
          icon={<Layers size={40} color={colors.primary} />}
          title="Select a PDF Document"
          description="Reorganize, rotate, or delete unwanted pages from any existing PDF."
          actionTitle="Choose PDF"
          onAction={handleOpenPicker}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Document Header */}
          <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                {selectedDoc.title}
              </Text>
              <Text style={[styles.pageStats, { color: colors.textSecondary }]}>
                {pages.length} pages remaining
              </Text>
            </View>
          </View>

          {/* Page Grid */}
          <FlatList
            data={pages}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item, index }) => (
              <View style={[styles.pageTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tileBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tileBadgeText}>Page {index + 1}</Text>
                </View>

                <View style={styles.tilePlaceholder}>
                  <Text style={[styles.origIndexText, { color: colors.textSecondary }]}>
                    Original Page {item.originalIndex + 1}
                  </Text>
                  {item.rotation !== 0 ? (
                    <Text style={[styles.rotText, { color: colors.primary }]}>
                      {item.rotation}°
                    </Text>
                  ) : null}
                </View>

                {/* Actions row */}
                <View style={[styles.tileActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity onPress={() => handleRotate(index)} style={styles.actionBtn}>
                    <RotateCw size={15} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={[styles.actionBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <MoveUp size={15} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === pages.length - 1}
                    style={[styles.actionBtn, { opacity: index === pages.length - 1 ? 0.3 : 1 }]}
                  >
                    <MoveDown size={15} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(index)} style={styles.actionBtn}>
                    <Trash2 size={15} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Bottom Save Bar */}
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
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Changes as New PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Picker Modal */}
      {pickerVisible && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose PDF to Manage</Text>
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

      <LoadingOverlay visible={loading} message="Processing PDF pages..." />
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
  },
  pageStats: {
    fontSize: 12,
    marginTop: 2,
  },
  gridContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  pageTile: {
    flex: 1 / 2,
    margin: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderBottomRightRadius: BorderRadius.sm,
  },
  tileBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tilePlaceholder: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  origIndexText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  rotText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  tileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  actionBtn: {
    padding: 6,
  },
  bottomBar: {
    borderTopWidth: 1,
    padding: Spacing.lg,
  },
  saveBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
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

