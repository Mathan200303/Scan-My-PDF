import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCw, Check, Maximize2, SkipForward, X, Crop } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { DocumentCropBox, CropRect } from '../components/DocumentCropBox';
import { ImageService } from '../services/imageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const MAX_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.62;

export const CropScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { imageUri, existingPages = [] } = route.params;

  const [currentUri, setCurrentUri] = useState<string>(imageUri);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({
    width: 1,
    height: 1,
  });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: MAX_PREVIEW_WIDTH,
    height: Math.round(MAX_PREVIEW_WIDTH * 1.33),
  });
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 0,
    y: 0,
    width: MAX_PREVIEW_WIDTH,
    height: Math.round(MAX_PREVIEW_WIDTH * 1.33),
  });
  const [loading, setLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);

  // Initialize and normalize EXIF orientation to physical pixels
  const initializeImage = async (uri: string) => {
    try {
      setLoading(true);
      const normalized = await ImageService.normalizeOrientation(uri);
      setCurrentUri(normalized.uri);
      setImageSize({ width: normalized.width, height: normalized.height });

      const aspect = normalized.width / normalized.height;
      let displayW = MAX_PREVIEW_WIDTH;
      let displayH = Math.round(displayW / aspect);

      if (displayH > MAX_PREVIEW_HEIGHT) {
        displayH = Math.round(MAX_PREVIEW_HEIGHT);
        displayW = Math.round(displayH * aspect);
      }

      setContainerSize({ width: displayW, height: displayH });

      // Default crop: Full frame because Camera has already framed the viewfinder region
      setCropRect({
        x: 0,
        y: 0,
        width: displayW,
        height: displayH,
      });

      setImageReady(true);
    } catch (e) {
      console.error('Error normalizing image:', e);
      setImageReady(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeImage(imageUri);
  }, [imageUri]);

  const handleSelectFull = () => {
    setCropRect({
      x: 0,
      y: 0,
      width: containerSize.width,
      height: containerSize.height,
    });
  };

  const handleCenterCrop = () => {
    const padX = Math.round(containerSize.width * 0.08);
    const padY = Math.round(containerSize.height * 0.08);
    setCropRect({
      x: padX,
      y: padY,
      width: containerSize.width - padX * 2,
      height: containerSize.height - padY * 2,
    });
  };

  const handleSkipCrop = () => {
    navigation.navigate('ScanEditor', {
      originalUri: imageUri,
      croppedUri: currentUri,
      existingPages,
    });
  };

  const handleRotate = async () => {
    try {
      setLoading(true);
      const rotated = await ImageService.rotateImage(currentUri, 90);
      await initializeImage(rotated);
    } catch (e) {
      console.error('Rotate error', e);
      setLoading(false);
    }
  };

  const handleConfirmCrop = async () => {
    try {
      setLoading(true);

      const { width: displayW, height: displayH } = containerSize;
      const { width: imgW, height: imgH } = imageSize;

      // If user selected practically the full image, skip extra cropping
      const isPracticallyFull =
        cropRect.x <= 4 &&
        cropRect.y <= 4 &&
        cropRect.x + cropRect.width >= displayW - 4 &&
        cropRect.y + cropRect.height >= displayH - 4;

      if (isPracticallyFull) {
        setLoading(false);
        navigation.navigate('ScanEditor', {
          originalUri: imageUri,
          croppedUri: currentUri,
          existingPages,
        });
        return;
      }

      // Exact pixel scaling ratio
      const scaleX = imgW / displayW;
      const scaleY = imgH / displayH;

      const originX = Math.max(0, Math.round(cropRect.x * scaleX));
      const originY = Math.max(0, Math.round(cropRect.y * scaleY));
      const cropW = Math.min(imgW - originX, Math.round(cropRect.width * scaleX));
      const cropH = Math.min(imgH - originY, Math.round(cropRect.height * scaleY));

      const croppedUri = await ImageService.cropImage(
        currentUri,
        originX,
        originY,
        cropW,
        cropH
      );

      setLoading(false);
      navigation.navigate('ScanEditor', {
        originalUri: imageUri,
        croppedUri,
        existingPages,
      });
    } catch (e) {
      console.error('Crop error', e);
      setLoading(false);
      navigation.navigate('ScanEditor', {
        originalUri: imageUri,
        croppedUri: currentUri,
        existingPages,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#070C18', paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Crop Document</Text>

        {/* Skip crop shortcut */}
        <TouchableOpacity onPress={handleSkipCrop} style={styles.skipBtn}>
          <Text style={styles.skipText}>Done</Text>
          <SkipForward size={14} color="#38BDF8" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Main Viewport */}
      <View style={styles.viewport}>
        {imageReady ? (
          <View
            style={[
              styles.imageContainer,
              {
                width: containerSize.width,
                height: containerSize.height,
              },
            ]}
          >
            <Image
              source={{ uri: currentUri }}
              style={{
                width: containerSize.width,
                height: containerSize.height,
              }}
              resizeMode="cover"
            />

            {/* Draggable Document Crop Box with 4 corners, 4 edges, and center pan */}
            <DocumentCropBox
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              cropRect={cropRect}
              onCropChange={setCropRect}
              accentColor="#38BDF8"
            />

            {loading ? (
              <View style={styles.loadingCover}>
                <ActivityIndicator color="#38BDF8" size="large" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.loadingCover}>
            <ActivityIndicator color="#38BDF8" size="large" />
            <Text style={[styles.loadingText, { marginTop: 12 }]}>Loading Scan...</Text>
          </View>
        )}
      </View>

      {/* Quick Adjustment Options */}
      <View style={styles.quickToolsRow}>
        <TouchableOpacity onPress={handleSelectFull} style={styles.quickToolBtn}>
          <Maximize2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.quickToolText}>Full Frame</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCenterCrop} style={styles.quickToolBtn}>
          <Crop size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.quickToolText}>Center Crop</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRotate} style={styles.quickToolBtn}>
          <RotateCw size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.quickToolText}>Rotate 90°</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          onPress={handleSkipCrop}
          style={styles.cancelActionBtn}
        >
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontWeight: '600' }}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirmCrop}
          disabled={loading}
          style={[styles.confirmBtn, { backgroundColor: '#0284C7' }]}
        >
          <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.confirmBtnText}>Save & Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  skipText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  imageContainer: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  quickToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
  },
  quickToolText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#151F32',
  },
  cancelActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: BorderRadius.full,
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
