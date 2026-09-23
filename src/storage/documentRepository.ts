import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentItem, DocumentType } from '../types';
import { FileService } from '../services/fileService';

const DOCUMENTS_INDEX_KEY = '@scanflow_documents_index_v1';

export type DocumentSortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'size_desc';

export const DocumentRepository = {
  async getAll(): Promise<DocumentItem[]> {
    try {
      const json = await AsyncStorage.getItem(DOCUMENTS_INDEX_KEY);
      if (!json) return [];
      const items: DocumentItem[] = JSON.parse(json);
      return items;
    } catch (e) {
      console.error('Error fetching documents', e);
      return [];
    }
  },

  async getById(id: string): Promise<DocumentItem | null> {
    const list = await this.getAll();
    return list.find((item) => item.id === id) || null;
  },

  async save(doc: DocumentItem): Promise<DocumentItem> {
    const list = await this.getAll();
    const existingIndex = list.findIndex((item) => item.id === doc.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...doc, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...doc, createdAt: doc.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    await AsyncStorage.setItem(DOCUMENTS_INDEX_KEY, JSON.stringify(list));
    return doc;
  },

  async update(id: string, updates: Partial<DocumentItem>): Promise<DocumentItem | null> {
    const list = await this.getAll();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    await AsyncStorage.setItem(DOCUMENTS_INDEX_KEY, JSON.stringify(list));
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const list = await this.getAll();
    const target = list.find((item) => item.id === id);
    if (target) {
      // Safely delete underlying file if it exists
      await FileService.deleteFile(target.uri);
      if (target.thumbnailUri) {
        await FileService.deleteFile(target.thumbnailUri);
      }
    }
    const filtered = list.filter((item) => item.id !== id);
    await AsyncStorage.setItem(DOCUMENTS_INDEX_KEY, JSON.stringify(filtered));
    return true;
  },

  async rename(id: string, newTitle: string): Promise<DocumentItem | null> {
    const trimmed = newTitle.trim();
    if (!trimmed) return null;
    return await this.update(id, { title: trimmed });
  },

  async duplicate(id: string): Promise<DocumentItem | null> {
    const original = await this.getById(id);
    if (!original) return null;

    const newId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const ext = original.type === 'pdf' ? '.pdf' : '.jpg';
    const newUri = `${FileService.getDocsDirectory()}${newId}${ext}`;

    try {
      await FileService.copyFile(original.uri, newUri);
      const duplicateItem: DocumentItem = {
        id: newId,
        title: `${original.title} (Copy)`,
        uri: newUri,
        type: original.type,
        pageCount: original.pageCount,
        fileSize: original.fileSize,
        thumbnailUri: original.thumbnailUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.save(duplicateItem);
      return duplicateItem;
    } catch (e) {
      console.error('Failed to duplicate document', e);
      return null;
    }
  },

  filterAndSort(
    docs: DocumentItem[],
    searchQuery: string,
    filterType: 'all' | DocumentType,
    sortOption: DocumentSortOption = 'date_desc'
  ): DocumentItem[] {
    let result = [...docs];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((d) => d.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.title.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'date_asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name_asc':
          return a.title.localeCompare(b.title);
        case 'size_desc':
          return b.fileSize - a.fileSize;
        default:
          return 0;
      }
    });

    return result;
  },
};

