module.exports = {
  expo: {
    name: 'Azora',
    slug: 'Azora',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/iconApp.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FF8C00',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.azora.breath',
      usesAppleSignIn: true,
      infoPlist: {
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera. Azora uses your camera and flash to estimate your heart rate during breathing sessions by detecting color changes in your fingertip. Place your finger over the rear camera so Azora can show live BPM and breathing feedback. Azora does not take photos or store video.',
        NSPhotoLibraryUsageDescription:
          'Allow $(PRODUCT_NAME) to choose a profile photo',
      },
      
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FF8C00',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.POST_NOTIFICATIONS',
      ],
      package: 'com.azora.breath',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-asset',
      'react-native-vision-camera',
      './plugins/with-heart-rate-plugin',
      './plugins/with-continuous-haptics-plugin',
      './plugins/with-local-notifications-only-plugin',
      [
        'expo-audio',
        {
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to choose a profile photo',
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.464959684647-rreivqrb4nfroan35pl04gb7nr3mumel',
        },
      ],
      'expo-apple-authentication',
      '@react-native-community/datetimepicker',
      'expo-video',
      'react-native-appsflyer',
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            'Allow $(PRODUCT_NAME) to measure ad performance so we can improve Azora.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'da7f6c59-bf84-4a19-b5a5-416fa73df15b',
      },
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabasePublishableKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      appsFlyerDevKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY,
      appsFlyerAppId: process.env.EXPO_PUBLIC_APPSFLYER_APP_ID,
      googleWebClientId:
        '464959684647-og75a7kr59nc9siganhms2rlp8ph2afm.apps.googleusercontent.com',
      googleIosClientId:
        '464959684647-rreivqrb4nfroan35pl04gb7nr3mumel.apps.googleusercontent.com',
    },
  },
}
