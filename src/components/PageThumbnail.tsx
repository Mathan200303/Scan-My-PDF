import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { RotateCw, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../constants/theme';

interface PageThumbnailProps {
  uri: string;
  pageNumber: number;
  rotation?: number;
  isSelected?: boolean;
  selectable?: boolean;
  onPress?: () => void;
  onRotate?: () => void;
  onDelete?: () => void;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  uri,
  pageNumber,
  rotation = 0,
  isSelected = false,
  selectable = false,
  onPress,
  onRotate,
  onDelete,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      {/* Page number badge */}
      <View style={[styles.badge, { backgroundColor: colors.overlay }]}>
        <Text style={styles.badgeText}>{pageNumber}</Text>
      </View>

      {/* Select check badge */}
      {selectable ? (
        <View
          style={[
            styles.selectBadge,
            {
              backgroundColor: isSelected ? colors.primary : colors.card,
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
        >
          {isSelected ? <Check size={12} color="#FFFFFF" /> : null}
        </View>
      ) : null}

      {/* Image Preview */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              transform: [{ rotate: `${rotation}deg` }],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Action Footer */}
      {(onRotate || onDelete) && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {onRotate && (
            <TouchableOpacity
              onPress={onRotate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <RotateCw size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    margin: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  selectBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 140,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  actionBtn: {
    padding: 4,
  },
});

