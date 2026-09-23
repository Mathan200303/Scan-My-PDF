import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  ZapOff,
  X,
  Image as ImageIcon,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { ScannedPage } from '../types';
import { ImageService } from '../services/imageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CameraScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const guideRef = useRef<View>(null);

  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPages, setCapturedPages] = useState<ScannedPage[]>(
    route?.params?.existingPages || []
  );

  // Exact coordinates of the dotted viewfinder frame on screen
  const defaultFrameW = SCREEN_WIDTH - 60;
  const defaultFrameH = Math.round(defaultFrameW * (4 / 3));
  const [frameCoords, setFrameCoords] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    x: 30,
    y: Math.round((SCREEN_HEIGHT - defaultFrameH) / 2),
    width: defaultFrameW,
    height: defaultFrameH,
  });

  const updateFrameLayout = () => {
    if (guideRef.current) {
      guideRef.current.measureInWindow((x, y, width, height) => {
        if (width > 50 && height > 50) {
          setFrameCoords({
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      });
    }
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // 1. Normalize EXIF rotation so portrait dimensions (width < height) are physically locked
        const normalized = await ImageService.normalizeOrientation(photo.uri);

        const screenW = SCREEN_WIDTH;
        const screenH = SCREEN_HEIGHT;
        const imgW = normalized.width;
        const imgH = normalized.height;

        // 2. CameraView renders full-screen with resizeMode='cover' (aspect fill)
        const scale = Math.max(screenW / imgW, screenH / imgH);
        const renderedW = imgW * scale;
        const renderedH = imgH * scale;
        const offsetX = (screenW - renderedW) / 2;
        const offsetY = (screenH - renderedH) / 2;

        // 3. Map on-screen dotted viewfinder box to exact sensor image pixels
        const rawCropX = (frameCoords.x - offsetX) / scale;
        const rawCropY = (frameCoords.y - offsetY) / scale;
        const rawCropW = frameCoords.width / scale;
        const rawCropH = frameCoords.height / scale;

        const originX = Math.max(0, Math.min(imgW - 10, Math.round(rawCropX)));
        const originY = Math.max(0, Math.min(imgH - 10, Math.round(rawCropY)));
        const cropW = Math.max(10, Math.min(imgW - originX, Math.round(rawCropW)));
        const cropH = Math.max(10, Math.min(imgH - originY, Math.round(rawCropH)));

        // 4. Crop image to ONLY what was inside the dotted viewfinder frame
        const frameCroppedUri = await ImageService.cropImage(
          normalized.uri,
          originX,
          originY,
          cropW,
          cropH
        );

        // 5. Navigate to CropScreen with the accurately framed scan
        navigation.navigate('CropScreen', {
          imageUri: frameCroppedUri,
          existingPages: capturedPages,
        });
      }
    } catch (e) {
      console.error('Failed to take picture', e);
      Alert.alert('Capture Failed', 'Could not capture document image.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Scan My PDF needs photo library access to import images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.95,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        navigation.navigate('CropScreen', {
          imageUri: result.assets[0].uri,
          existingPages: capturedPages,
        });
      }
    } catch (e) {
      console.error('Failed to pick image', e);
    }
  };

  const handleFinishBatch = () => {
    if (capturedPages.length === 0) return;
    navigation.navigate('MultiPage', { pages: capturedPages });
  };

  // If permission status not loaded yet
  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // If permission not granted
  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
          Scan My PDF processes all documents entirely on your phone. Camera access is required
          to photograph and scan physical documents.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.grantBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        >
          <Text style={{ color: colors.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
      >
        {/* Top Controls Bar */}
        <View style={[styles.topControls, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.circleBtn}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Flash Mode Toggle */}
          <TouchableOpacity onPress={toggleFlash} style={styles.circleBtn}>
            {flash === 'off' ? (
              <ZapOff size={22} color="#FFFFFF" />
            ) : (
              <Zap size={22} color={flash === 'auto' ? '#FBBF24' : '#38BDF8'} />
            )}
          </TouchableOpacity>
        </View>

        {/* Framing Guide Overlay (Visual Viewfinder Frame) */}
        <View style={styles.guideWrapper} pointerEvents="none">
          <View
            ref={guideRef}
            onLayout={updateFrameLayout}
            style={styles.guideBorder}
          />
          <Text style={styles.guideText}>Align document within frame</Text>
        </View>

        {/* Bottom Bar Controls */}
        <View
          style={[
            styles.bottomControls,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {/* Gallery Import Shortcut */}
          <TouchableOpacity
            onPress={handlePickFromGallery}
            style={styles.iconAction}
          >
            <ImageIcon size={28} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCapture}
            disabled={isCapturing}
            style={styles.shutterOuter}
          >
            <View style={styles.shutterInner}>
              {isCapturing ? (
                <ActivityIndicator color="#0284C7" size="small" />
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Multi-page batch indicator or review */}
          <TouchableOpacity
            onPress={handleFinishBatch}
            disabled={capturedPages.length === 0}
            style={[
              styles.iconAction,
              { opacity: capturedPages.length > 0 ? 1 : 0.4 },
            ]}
          >
            <View style={styles.batchBadge}>
              <Layers size={24} color="#FFFFFF" />
              {capturedPages.length > 0 ? (
                <View style={styles.batchCount}>
                  <Text style={styles.batchCountText}>{capturedPages.length}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.actionLabel}>Done ({capturedPages.length})</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  grantBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    padding: 10,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  guideBorder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  guideText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconAction: {
    alignItems: 'center',
    minWidth: 60,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  batchBadge: {
    position: 'relative',
  },
  batchCount: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  batchCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
