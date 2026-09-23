import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const ShareService = {
  async shareFile(fileUri: string, mimeType?: string, dialogTitle?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
        return false;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: mimeType || (fileUri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        dialogTitle: dialogTitle || 'Share Document',
        UTI: fileUri.endsWith('.pdf') ? 'com.adobe.pdf' : 'public.jpeg',
      });
      return true;
    } catch (e: any) {
      if (e?.message?.includes('User did not share')) {
        return false;
      }
      console.warn('Share error', e);
      Alert.alert('Share Error', 'Could not share this document.');
      return false;
    }
  },
};

