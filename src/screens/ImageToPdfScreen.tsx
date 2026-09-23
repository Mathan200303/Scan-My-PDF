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
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ImagePlus,
  FileDown,
  RotateCw,
  Trash2,
  MoveUp,
  MoveDown,
  FileImage,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { PdfPageSize, PdfQuality, DocumentItem } from '../types';
import { Header } from '../components/Header';
import { PageThumbnail } from '../components/PageThumbnail';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { EmptyState } from '../components/EmptyState';
import { ImageService } from '../services/imageService';
import { PdfService } from '../services/pdfService';
import { DocumentRepository } from '../storage/documentRepository';

interface ImageItem {
  id: string;
  uri: string;
  rotation: number;
}

export const ImageToPdfScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [docTitle, setDocTitle] = useState(`Images_${new Date().toISOString().slice(0, 10)}`);
  const [pageSize, setPageSize] = useState<PdfPageSize>('A4');
  const [quality, setQuality] = useState<PdfQuality>('HIGH');
  const [margin, setMargin] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant photo permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.95,
      });

      if (!result.canceled && result.assets) {
        const newItems: ImageItem[] = result.assets.map((asset, idx) => ({
          id: `img_${Date.now()}_${idx}`,
          uri: asset.uri,
          rotation: 0,
        }));
        setImages((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error('Image pick error', e);
    }
  };

  const handleRotate = async (index: number) => {
    const target = images[index];
    try {
      const rotated = await ImageService.rotateImage(target.uri, 90);
      const updated = [...images];
      updated[index] = {
        ...target,
        uri: rotated,
        rotation: (target.rotation + 90) % 360,
      };
      setImages(updated);
    } catch (e) {
      console.error('Rotate error', e);
    }
  };

  const handleDelete = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setImages(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const updated = [...images];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setImages(updated);
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please select at least one image.');
      return;
    }

    setLoading(true);
    try {
      const uris = images.map((img) => img.uri);
      const res = await PdfService.createPdfFromImages(uris, {
        title: docTitle.trim() || 'ScanMyPDF_Images',
        pageSize,
        quality,
        margin,
      });

      const docItem: DocumentItem = {
        id: `doc_${Date.now()}`,
        title: docTitle.trim() || 'ScanMyPDF_Images',
        uri: res.uri,
        type: 'pdf',
        pageCount: res.pageCount,
        fileSize: res.fileSize,
        thumbnailUri: images[0]?.uri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await DocumentRepository.save(docItem);
      setLoading(false);

      navigation.replace('DocumentViewer', { document: docItem });
    } catch (e: any) {
      setLoading(false);
      console.error('PDF export error', e);
      Alert.alert('Error', e?.message || 'Failed to create PDF.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Image to PDF"
        onBack={() => navigation.goBack()}
        rightAction={
          images.length > 0 ? (
            <TouchableOpacity onPress={handlePickImages} style={styles.headerAddBtn}>
              <ImagePlus size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      {images.length === 0 ? (
        <EmptyState
          icon={<FileImage size={40} color={colors.primary} />}
          title="Select Photos to Convert"
          description="Choose one or multiple images from your photo gallery to turn into a clean PDF document."
          actionTitle="Select from Gallery"
          onAction={handlePickImages}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Options Card */}
          <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={docTitle}
              onChangeText={setDocTitle}
              placeholder="Document Title"
              placeholderTextColor={colors.textMuted}
              style={[styles.titleInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />

            <View style={styles.optionsRow}>
              {/* Page size toggle */}
              <View style={styles.optionGroup}>
                <Text style={[styles.optLabel, { color: colors.textSecondary }]}>Size:</Text>
                {(['A4', 'LETTER', 'FIT'] as PdfPageSize[]).map((sz) => (
                  <TouchableOpacity
                    key={sz}
                    onPress={() => setPageSize(sz)}
                    style={[
                      styles.optPill,
                      {
                        backgroundColor: pageSize === sz ? colors.primary : colors.inputBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optPillText,
                        { color: pageSize === sz ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {sz}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quality toggle */}
              <View style={styles.optionGroup}>
                <Text style={[styles.optLabel, { color: colors.textSecondary }]}>Quality:</Text>
                {(['LOW', 'MED', 'HIGH'] as const).map((q) => {
                  const mappedQ: PdfQuality = q === 'MED' ? 'MEDIUM' : q;
                  return (
                    <TouchableOpacity
                      key={q}
                      onPress={() => setQuality(mappedQ)}
                      style={[
                        styles.optPill,
                        {
                          backgroundColor: quality === mappedQ ? colors.primary : colors.inputBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optPillText,
                          { color: quality === mappedQ ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {q}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Image List */}
          <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }) => (
              <View style={styles.pageCard}>
                <PageThumbnail
                  uri={item.uri}
                  pageNumber={index + 1}
                  onRotate={() => handleRotate(index)}
                  onDelete={() => handleDelete(index)}
                />
                <View style={styles.reorderRow}>
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
                    disabled={index === images.length - 1}
                    style={[
                      styles.moveBtn,
                      {
                        backgroundColor: colors.inputBg,
                        opacity: index === images.length - 1 ? 0.3 : 1,
                      },
                    ]}
                  >
                    <MoveDown size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
              onPress={handleGeneratePdf}
              style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            >
              <FileDown size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportBtnText}>Generate PDF ({images.length} pages)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <LoadingOverlay visible={loading} message="Creating PDF..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAddBtn: {
    padding: Spacing.xs,
  },
  configCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  titleInput: {
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  optPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  optPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
    alignItems: 'center',
  },
  pageCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reorderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  moveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  bottomExportBar: {
    borderTopWidth: 1,
    padding: Spacing.lg,
  },
  exportBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

