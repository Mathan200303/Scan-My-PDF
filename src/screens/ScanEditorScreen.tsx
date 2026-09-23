import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RotateCcw,
  RotateCw,
  Check,
  Undo2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Palette,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { ScannedPage, ScanFilterType } from '../types';
import { ImageService } from '../services/imageService';
import { Header } from '../components/Header';

interface ScanEditorScreenProps {
  navigation: any;
  route: any;
}

export const ScanEditorScreen: React.FC<ScanEditorScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { originalUri, croppedUri, existingPages = [] } = route.params;

  // baseUri is the current image at current rotation, without filter
  const [baseUri, setBaseUri] = useState<string>(croppedUri);
  const [activeUri, setActiveUri] = useState<string>(croppedUri);
  const [rotation, setRotation] = useState<number>(0);
  const [filter, setFilter] = useState<ScanFilterType>('original');
  const [filterCache, setFilterCache] = useState<{ [key: string]: string }>({
    original: croppedUri,
  });
  const [loading, setLoading] = useState(false);

  const filterOptions: {
    id: ScanFilterType;
    label: string;
    desc: string;
    icon: any;
  }[] = [
    { id: 'original', label: 'Original', desc: 'True natural colors', icon: ImageIcon },
    { id: 'document', label: 'Document B&W', desc: 'Crisp text & white paper', icon: FileText },
    { id: 'color_boost', label: 'Magic Color', desc: 'Vibrant punch & stamps', icon: Palette },
    { id: 'grayscale', label: 'Grayscale', desc: 'Smooth monochrome', icon: Sparkles },
  ];

  // Apply filter with cache
  const applyFilter = async (targetFilter: ScanFilterType, sourceUri: string) => {
    if (targetFilter === 'original') {
      setActiveUri(sourceUri);
      return;
    }

    const cacheKey = `${sourceUri}_${targetFilter}`;
    if (filterCache[cacheKey]) {
      setActiveUri(filterCache[cacheKey]);
      return;
    }

    try {
      setLoading(true);
      const filteredUri = await ImageService.applyScanFilter(sourceUri, targetFilter);
      setFilterCache((prev) => ({ ...prev, [cacheKey]: filteredUri }));
      setActiveUri(filteredUri);
    } catch (e) {
      console.error('Failed to apply filter:', e);
      setActiveUri(sourceUri);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFilter = (selected: ScanFilterType) => {
    setFilter(selected);
    applyFilter(selected, baseUri);
  };

  const handleRotateLeft = async () => {
    setLoading(true);
    try {
      const nextBase = await ImageService.rotateImage(baseUri, 270);
      setBaseUri(nextBase);
      setRotation((prev) => (prev + 270) % 360);
      await applyFilter(filter, nextBase);
    } catch (e) {
      console.error('Rotate left error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateRight = async () => {
    setLoading(true);
    try {
      const nextBase = await ImageService.rotateImage(baseUri, 90);
      setBaseUri(nextBase);
      setRotation((prev) => (prev + 90) % 360);
      await applyFilter(filter, nextBase);
    } catch (e) {
      console.error('Rotate right error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBaseUri(croppedUri);
    setActiveUri(croppedUri);
    setRotation(0);
    setFilter('original');
  };

  // Instant navigation with 0ms delay
  const handleSavePage = () => {
    const newPage: ScannedPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      originalUri,
      currentUri: activeUri,
      thumbnailUri: activeUri,
      rotation,
      filter,
    };

    const updatedPages = [...existingPages, newPage];

    navigation.navigate('MultiPage', {
      pages: updatedPages,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Enhance & Edit Scan"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Undo2 size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>
        }
      />

      {/* Main Image Preview */}
      <View style={styles.previewContainer}>
        <View
          style={[
            styles.imageWrapper,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Image
            source={{ uri: activeUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingOverlayText}>Enhancing Document...</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Editing Toolbar */}
      <View
        style={[
          styles.toolbarContainer,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        {/* Rotation controls */}
        <View style={styles.rotationRow}>
          <TouchableOpacity
            onPress={handleRotateLeft}
            disabled={loading}
            style={[styles.toolIconBtn, { backgroundColor: colors.inputBg }]}
          >
            <RotateCcw size={18} color={colors.text} />
            <Text style={[styles.toolIconLabel, { color: colors.textSecondary }]}>90° Left</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRotateRight}
            disabled={loading}
            style={[styles.toolIconBtn, { backgroundColor: colors.inputBg }]}
          >
            <RotateCw size={18} color={colors.text} />
            <Text style={[styles.toolIconLabel, { color: colors.textSecondary }]}>90° Right</Text>
          </TouchableOpacity>
        </View>

        {/* Filter selection pills */}
        <Text style={[styles.filterHeading, { color: colors.textSecondary }]}>
          DOCUMENT ENHANCEMENT
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map((opt) => {
            const isSelected = filter === opt.id;
            const IconComponent = opt.icon;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleSelectFilter(opt.id)}
                disabled={loading}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.inputBg,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.filterPillHeader}>
                  <IconComponent
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.filterPillTitle,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.filterPillDesc,
                    {
                      color: isSelected
                        ? 'rgba(255, 255, 255, 0.85)'
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Save Action */}
        <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            onPress={handleSavePage}
            disabled={loading}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save Scanned Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  toolbarContainer: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  rotationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  toolIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
  },
  toolIconLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 125,
  },
  filterPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPillTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillDesc: {
    fontSize: 10,
    marginTop: 3,
  },
  bottomAction: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
