import { Alert, Linking } from 'react-native';

export function showCameraAccessNeededAlert() {
  Alert.alert(
    'Camera access needed',
    'Azora needs camera access to measure heart rate from your fingertip.',
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ],
  );
}

export function showHeartRateCameraUnavailableAlert() {
  Alert.alert(
    'Camera unavailable',
    'Azora could not find a rear camera for heart-rate measurement on this device.',
  );
}
