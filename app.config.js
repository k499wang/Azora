module.exports = {
  expo: {
    name: 'Azora',
    slug: 'Azora',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/iconApp.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.azora.breath',
      usesAppleSignIn: true,
      infoPlist: {
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
        NSPhotoLibraryUsageDescription:
          'Allow $(PRODUCT_NAME) to choose a profile photo',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ['android.permission.CAMERA', 'android.permission.CAMERA'],
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
      googleWebClientId:
        '464959684647-og75a7kr59nc9siganhms2rlp8ph2afm.apps.googleusercontent.com',
      googleIosClientId:
        '464959684647-rreivqrb4nfroan35pl04gb7nr3mumel.apps.googleusercontent.com',
    },
  },
}
