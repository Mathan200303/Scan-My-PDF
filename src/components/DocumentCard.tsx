import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import {
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Share2,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Download,
} from 'lucide-react-native';
import { DocumentItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../constants/theme';
import { FileService } from '../services/fileService';
import { PdfRendererService } from '../services/pdfRendererService';

interface DocumentCardProps {
  item: DocumentItem;
  onPress: () => void;
  onShare: (item: DocumentItem) => void;
  onDelete: (item: DocumentItem) => void;
  onRename: (item: DocumentItem, newTitle: string) => void;
  onDuplicate: (item: DocumentItem) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  item,
  onPress,
  onShare,
  onDelete,
  onRename,
  onDuplicate,
}) => {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState(item.title);

  const formattedDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  const handleConfirmRename = () => {
    if (newTitle.trim()) {
      onRename(item, newTitle.trim());
      setRenameModalVisible(false);
    }
  };

  const handleDeletePrompt = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Thumbnail / Icon preview */}
        <View
          style={[
            styles.previewBox,
            { backgroundColor: item.type === 'pdf' ? colors.primaryLight : colors.inputBg },
          ]}
        >
          {item.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnailImg} resizeMode="cover" />
          ) : item.type === 'pdf' ? (
            <FileText size={26} color={colors.primary} />
          ) : (
            <ImageIcon size={26} color={colors.accent} />
          )}
        </View>

        {/* Metadata info */}
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor:
                    item.type === 'pdf' ? colors.primaryLight : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: item.type === 'pdf' ? colors.primary : colors.warning },
                ]}
              >
                {item.type.toUpperCase()}
              </Text>
            </View>

            {item.pageCount > 0 ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} •{' '}
              </Text>
            ) : null}

            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {FileService.formatFileSize(item.fileSize)} •{' '}
            </Text>

            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Three dots menu trigger */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.moreBtn}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Action Menu Modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          style={[styles.menuOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.menuHeader, { color: colors.textSecondary }]}>
              {item.title}
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onPress();
              }}
            >
              <ExternalLink size={20} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Open Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setNewTitle(item.title);
                setRenameModalVisible(true);
              }}
            >
              <Edit2 size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onShare(item);
              }}
            >
              <Share2 size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuVisible(false);
                try {
                  const isImg = item.type === 'image';
                  const ext = isImg ? (item.uri.endsWith('.png') ? '.png' : '.jpg') : '.pdf';
                  const cleanTitle = FileService.sanitizeFileName(item.title);
                  const fileName = `${cleanTitle}${ext}`;
                  await PdfRendererService.saveToDownloads(item.uri, fileName);
                  Alert.alert(
                    'Saved Successfully',
                    `"${fileName}" has been saved to your phone's ${
                      isImg ? 'Gallery (Pictures/ScanMyPDF)' : 'Downloads (Downloads/ScanMyPDF)'
                    } folder.`
                  );
                } catch (e) {
                  Alert.alert('Save Failed', 'Could not save file to device storage.');
                }
              }}
            >
              <Download size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Save to Device / Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDuplicate(item);
              }}
            >
              <Copy size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Duplicate</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleDeletePrompt}>
              <Trash2 size={20} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Dialog Modal */}
      <Modal
        transparent
        visible={renameModalVisible}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={[styles.menuOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.renameDialog,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Rename Document</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={styles.dialogBtn}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRename}
                style={[styles.dialogBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  previewBox: {
    width: 52,
    height: 60,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 12,
  },
  moreBtn: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  renameDialog: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: '40%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.md,
  },
});

