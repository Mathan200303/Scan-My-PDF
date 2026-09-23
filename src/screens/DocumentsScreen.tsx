import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search,
  SlidersHorizontal,
  FileText,
  X,
  Check,
  ArrowUpDown,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { DocumentRepository, DocumentSortOption } from '../storage/documentRepository';
import { DocumentItem, DocumentType } from '../types';
import { DocumentCard } from '../components/DocumentCard';
import { EmptyState } from '../components/EmptyState';
import { ShareService } from '../services/shareService';

export const DocumentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | DocumentType>('all');
  const [sortOption, setSortOption] = useState<DocumentSortOption>('date_desc');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const fetchDocs = async () => {
    const list = await DocumentRepository.getAll();
    setAllDocs(list);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDocs();
    }, [])
  );

  const filteredDocs = DocumentRepository.filterAndSort(
    allDocs,
    searchQuery,
    filterType,
    sortOption
  );

  const handleShare = async (item: DocumentItem) => {
    await ShareService.shareFile(item.uri);
  };

  const handleDelete = async (item: DocumentItem) => {
    await DocumentRepository.delete(item.id);
    await fetchDocs();
  };

  const handleRename = async (item: DocumentItem, newTitle: string) => {
    await DocumentRepository.rename(item.id, newTitle);
    await fetchDocs();
  };

  const handleDuplicate = async (item: DocumentItem) => {
    await DocumentRepository.duplicate(item.id);
    await fetchDocs();
  };

  const sortOptionsList: { label: string; value: DocumentSortOption }[] = [
    { label: 'Newest First', value: 'date_desc' },
    { label: 'Oldest First', value: 'date_asc' },
    { label: 'File Name (A - Z)', value: 'name_asc' },
    { label: 'Largest Size', value: 'size_desc' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Documents</Text>
        <Text style={[styles.docCount, { color: colors.textSecondary }]}>
          {allDocs.length} {allDocs.length === 1 ? 'file' : 'files'}
        </Text>
      </View>

      {/* Search & Sort Row */}
      <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg }]}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={[styles.sortButton, { backgroundColor: colors.inputBg }]}
        >
          <SlidersHorizontal size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['all', 'pdf', 'image'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type)}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterType === type ? colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: filterType === type ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {type === 'all' ? 'All Files' : type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Document List */}
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DocumentCard
            item={item}
            onPress={() => navigation.navigate('DocumentViewer', { document: item })}
            onShare={handleShare}
            onDelete={handleDelete}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<FileText size={36} color={colors.primary} />}
            title={searchQuery ? 'No Results Found' : 'No Documents'}
            description={
              searchQuery
                ? 'Try a different search term.'
                : 'Scanned files and exported PDFs will be stored here.'
            }
          />
        }
      />

      {/* Sort Options Modal */}
      <Modal
        transparent
        visible={sortModalVisible}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.sortModalCard, { backgroundColor: colors.card }]}>
            <View style={styles.sortHeader}>
              <ArrowUpDown size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sortTitle, { color: colors.text }]}>Sort Documents By</Text>
            </View>

            {sortOptionsList.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setSortOption(opt.value);
                  setSortModalVisible(false);
                }}
                style={styles.sortItem}
              >
                <Text
                  style={[
                    styles.sortItemText,
                    {
                      color: sortOption === opt.value ? colors.primary : colors.text,
                      fontWeight: sortOption === opt.value ? '700' : '400',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {sortOption === opt.value ? <Check size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  docCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortModalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sortTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  sortItemText: {
    fontSize: 15,
  },
});

