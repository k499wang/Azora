import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';

const HOUSE_CLEANING_PDF = require('../../../assets/house-cleaning-checklist.pdf');

export async function getHouseCleaningPdfUri(): Promise<string> {
  const asset = Asset.fromModule(HOUSE_CLEANING_PDF);
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}

/** Opens the bundled guide in a compatible native app when one is installed. */
export async function previewHouseCleaningPdf(): Promise<void> {
  await Linking.openURL(await getHouseCleaningPdfUri());
}

/** The platform sheet includes Files/Downloads where the OS supports saving. */
export async function shareHouseCleaningPdf(): Promise<void> {
  if (!await Sharing.isAvailableAsync()) {
    throw new Error('Sharing this guide is not available on this device.');
  }
  await Sharing.shareAsync(await getHouseCleaningPdfUri(), {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
