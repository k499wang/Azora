const appsFlyerDevKey = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY
const appsFlyerAppId = process.env.EXPO_PUBLIC_APPSFLYER_APP_ID
const analyticsEnv =
  process.env.ANALYTICS_ENV ??
  process.env.EAS_BUILD_PROFILE ??
  'development'

if (
  (process.env.EAS_BUILD === 'true' || process.env.EAS_BUILD_PROFILE != null) &&
  (appsFlyerDevKey == null ||
    appsFlyerDevKey.length === 0 ||
    appsFlyerAppId == null ||
    appsFlyerAppId.length === 0)
) {
  throw new Error(
    'Missing AppsFlyer EAS build env. Set EXPO_PUBLIC_APPSFLYER_DEV_KEY and EXPO_PUBLIC_APPSFLYER_APP_ID for this build profile.',
  )
}

module.exports = {
  expo: {
    name: 'Azora',
    slug: 'Azora',
    version: '1.0.8',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-lockup.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.azora.breath',
      usesAppleSignIn: true,
      infoPlist: {
        NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera. Azora uses your camera and flash to estimate your heart rate during breathing sessions by detecting color changes in your fingertip. Place your finger over the rear camera so Azora can show live BPM and breathing feedback. Azora does not take photos or store video.',
        NSLocationWhenInUseUsageDescription:
          'Allow $(PRODUCT_NAME) to access your approximate location while using the app to support attribution and diagnostics. Azora does not use location for breathwork sessions.',
        NSPhotoLibraryUsageDescription:
          'Allow $(PRODUCT_NAME) to choose a profile photo',
        ITSAppUsesNonExemptEncryption: false,
        // Send postback copies to AppsFlyer so it can validate conversion
        // values and power SKAN reporting, on both attribution frameworks:
        //   NSAdvertisingAttributionReportEndpoint → SKAdNetwork (iOS 15+)
        //   AttributionCopyEndpoint               → AdAttributionKit (iOS 17.4+),
        //     the raw key behind Xcode's "AdAttributionKit - Postback Copy URL".
        NSAdvertisingAttributionReportEndpoint: 'https://appsflyer-skadnetwork.com/',
        AttributionCopyEndpoint: 'https://appsflyer-skadnetwork.com/',
        // Keep in sync with AppsFlyer dashboard → SKAdNetwork → "Download SKAdNetwork IDs".
        // Required for Apple to deliver SKAN postbacks; Meta + AppsFlyer must be present.
        SKAdNetworkItems: [
          { SKAdNetworkIdentifier: '4fzdc2evr5.skadnetwork' }, // AppsFlyer
          { SKAdNetworkIdentifier: '53nm4hsx3w.skadnetwork' },
          { SKAdNetworkIdentifier: '4pfyvq9l8r.skadnetwork' },
          { SKAdNetworkIdentifier: '633vhxswh4.skadnetwork' },
          { SKAdNetworkIdentifier: 'tmhh9296z4.skadnetwork' },
          { SKAdNetworkIdentifier: 'vcra2ehyfk.skadnetwork' },
          { SKAdNetworkIdentifier: 'zh3b7bxvad.skadnetwork' },
          { SKAdNetworkIdentifier: 'xmn954pzmp.skadnetwork' },
          { SKAdNetworkIdentifier: '79w64w269u.skadnetwork' },
          { SKAdNetworkIdentifier: 'cg4yq2srnc.skadnetwork' },
          { SKAdNetworkIdentifier: '488r3q3dtq.skadnetwork' },
          { SKAdNetworkIdentifier: 'd7g9azk84q.skadnetwork' },
          { SKAdNetworkIdentifier: 'nzq8sh4pbs.skadnetwork' },
          { SKAdNetworkIdentifier: 'vhf287vqwu.skadnetwork' },
          { SKAdNetworkIdentifier: '866k9ut3g3.skadnetwork' },
          { SKAdNetworkIdentifier: '2q884k2j68.skadnetwork' },
          { SKAdNetworkIdentifier: 'v72qych5uu.skadnetwork' },
          { SKAdNetworkIdentifier: '6xzpu9s2p8.skadnetwork' },
          { SKAdNetworkIdentifier: 'ludvb6z3bs.skadnetwork' },
          { SKAdNetworkIdentifier: 'x8jxxk4ff5.skadnetwork' },
          { SKAdNetworkIdentifier: 'mlmmfzh3r3.skadnetwork' },
          { SKAdNetworkIdentifier: 'gfat3222tu.skadnetwork' },
          { SKAdNetworkIdentifier: 'pd25vrrwzn.skadnetwork' },
          { SKAdNetworkIdentifier: 'c6k4g5qg8m.skadnetwork' },
          { SKAdNetworkIdentifier: '3qy4746246.skadnetwork' },
          { SKAdNetworkIdentifier: 'y755zyxw56.skadnetwork' },
          { SKAdNetworkIdentifier: 'qlbq5gtkt8.skadnetwork' },
          { SKAdNetworkIdentifier: '67369282zy.skadnetwork' },
          { SKAdNetworkIdentifier: '238da6jt44.skadnetwork' },
          { SKAdNetworkIdentifier: '899vrgt9g8.skadnetwork' },
          { SKAdNetworkIdentifier: 'mj797d8u6f.skadnetwork' },
          { SKAdNetworkIdentifier: '22mmun2rn5.skadnetwork' },
          { SKAdNetworkIdentifier: 'f38h382jlk.skadnetwork' },
          { SKAdNetworkIdentifier: 'mp6xlyr22a.skadnetwork' },
          { SKAdNetworkIdentifier: '88k8774x49.skadnetwork' },
          { SKAdNetworkIdentifier: 'hs6bdukanm.skadnetwork' },
          { SKAdNetworkIdentifier: 't3b3f7n3x8.skadnetwork' },
          { SKAdNetworkIdentifier: 'c7g47wypnu.skadnetwork' },
          { SKAdNetworkIdentifier: 'prcb7njmu6.skadnetwork' },
          { SKAdNetworkIdentifier: '52fl2v3hgk.skadnetwork' },
          { SKAdNetworkIdentifier: '9vvzujtq5s.skadnetwork' },
          { SKAdNetworkIdentifier: '4468km3ulz.skadnetwork' },
          { SKAdNetworkIdentifier: 'm8dbw4sv7c.skadnetwork' },
          { SKAdNetworkIdentifier: 'm5mvw97r93.skadnetwork' },
          { SKAdNetworkIdentifier: 'z5b3gh5ugf.skadnetwork' },
          { SKAdNetworkIdentifier: 'pwdxu55a5a.skadnetwork' },
          { SKAdNetworkIdentifier: 'dd3a75yxkv.skadnetwork' },
          { SKAdNetworkIdentifier: '9nlqeag3gk.skadnetwork' },
          { SKAdNetworkIdentifier: 'h5jmj969g5.skadnetwork' },
          { SKAdNetworkIdentifier: 'dr774724x4.skadnetwork' },
          { SKAdNetworkIdentifier: 'v9wttpbfk9.skadnetwork' }, // Meta
          { SKAdNetworkIdentifier: 'n38lu8286q.skadnetwork' }, // Meta
          { SKAdNetworkIdentifier: 't7ky8fmwkd.skadnetwork' },
          { SKAdNetworkIdentifier: 'fz2k2k5tej.skadnetwork' },
          { SKAdNetworkIdentifier: 'cs644xg564.skadnetwork' },
          { SKAdNetworkIdentifier: 'w28pnjg2k4.skadnetwork' },
          { SKAdNetworkIdentifier: '2rq3zucswp.skadnetwork' },
          { SKAdNetworkIdentifier: 'vc83br9sjg.skadnetwork' },
          { SKAdNetworkIdentifier: 'cstr6suwn9.skadnetwork' },
          { SKAdNetworkIdentifier: 'eqhxz8m8av.skadnetwork' },
          { SKAdNetworkIdentifier: '7k3cvf297u.skadnetwork' },
          { SKAdNetworkIdentifier: 'w9q455wk68.skadnetwork' },
          { SKAdNetworkIdentifier: '54nzkqm89y.skadnetwork' },
          { SKAdNetworkIdentifier: 'lr83yxwka7.skadnetwork' },
          { SKAdNetworkIdentifier: 'v4nxqhlyqp.skadnetwork' },
          { SKAdNetworkIdentifier: 'wzmmz9fp6w.skadnetwork' },
          { SKAdNetworkIdentifier: 'com.apple.ads' },
          { SKAdNetworkIdentifier: 'su67r6k2v3.skadnetwork' },
          { SKAdNetworkIdentifier: 'yclnxrl5pm.skadnetwork' },
          { SKAdNetworkIdentifier: '7tnzynbdc7.skadnetwork' },
          { SKAdNetworkIdentifier: 'l6nv3x923s.skadnetwork' },
          { SKAdNetworkIdentifier: 'h8vml93bkz.skadnetwork' },
          { SKAdNetworkIdentifier: 'uzqba5354d.skadnetwork' },
          { SKAdNetworkIdentifier: 'nu4557a4je.skadnetwork' },
          { SKAdNetworkIdentifier: 'x44k69ngh6.skadnetwork' },
          { SKAdNetworkIdentifier: '8qiegk9qfv.skadnetwork' },
          { SKAdNetworkIdentifier: 'v79kvwwj4g.skadnetwork' },
          { SKAdNetworkIdentifier: 'xx9sdjej2w.skadnetwork' },
          { SKAdNetworkIdentifier: 'au67k4efj4.skadnetwork' },
          { SKAdNetworkIdentifier: 't38b2kh725.skadnetwork' },
          { SKAdNetworkIdentifier: '7ug5zh24hu.skadnetwork' },
          { SKAdNetworkIdentifier: '5lm9lj6jb7.skadnetwork' },
          { SKAdNetworkIdentifier: 'feyaarzu9v.skadnetwork' },
          { SKAdNetworkIdentifier: 'dmv22haz9p.skadnetwork' },
          { SKAdNetworkIdentifier: 'n6fk4nfna4.skadnetwork' },
          { SKAdNetworkIdentifier: '7rz58n8ntl.skadnetwork' },
          { SKAdNetworkIdentifier: '7fbxrn65az.skadnetwork' },
          { SKAdNetworkIdentifier: 'kbd757ywx3.skadnetwork' },
          { SKAdNetworkIdentifier: 'b55w3d8y8z.skadnetwork' },
          { SKAdNetworkIdentifier: 'ejvt5qm6ak.skadnetwork' },
          { SKAdNetworkIdentifier: 'v7896pgt74.skadnetwork' },
          { SKAdNetworkIdentifier: '5ghnmfs3dh.skadnetwork' },
          { SKAdNetworkIdentifier: '275upjj5gd.skadnetwork' },
          { SKAdNetworkIdentifier: '627r9wr2y5.skadnetwork' },
          { SKAdNetworkIdentifier: 'sczv5946wb.skadnetwork' },
          { SKAdNetworkIdentifier: '8w3np9l82g.skadnetwork' },
          { SKAdNetworkIdentifier: 'hb56zgv37p.skadnetwork' },
          { SKAdNetworkIdentifier: '9t245vhmpl.skadnetwork' },
          { SKAdNetworkIdentifier: 'nrt9jy4kw9.skadnetwork' },
          { SKAdNetworkIdentifier: 'dn942472g5.skadnetwork' },
          { SKAdNetworkIdentifier: '6v7lgmsu45.skadnetwork' },
          { SKAdNetworkIdentifier: 'cad8qz2s3j.skadnetwork' },
          { SKAdNetworkIdentifier: 'eh6m2bh4zr.skadnetwork' },
          { SKAdNetworkIdentifier: 'jb7bn6koa5.skadnetwork' },
          { SKAdNetworkIdentifier: 'fkak3gfpt6.skadnetwork' },
          { SKAdNetworkIdentifier: '97r2b46745.skadnetwork' },
          { SKAdNetworkIdentifier: '44jx6755aq.skadnetwork' },
          { SKAdNetworkIdentifier: 'b9bk5wbcq9.skadnetwork' },
          { SKAdNetworkIdentifier: '84993kbrcf.skadnetwork' },
          { SKAdNetworkIdentifier: 'zmvfpc5aq8.skadnetwork' },
          { SKAdNetworkIdentifier: 'tl55sbb4fm.skadnetwork' },
          { SKAdNetworkIdentifier: '2tdux39lx8.skadnetwork' },
          { SKAdNetworkIdentifier: '2u9pt9hc89.skadnetwork' },
          { SKAdNetworkIdentifier: '5a6flpkh64.skadnetwork' },
          { SKAdNetworkIdentifier: '3cgn6rq224.skadnetwork' },
          { SKAdNetworkIdentifier: '8s468mfl3y.skadnetwork' },
          { SKAdNetworkIdentifier: 'glqzh8vgby.skadnetwork' },
          { SKAdNetworkIdentifier: 'av6w8kgt66.skadnetwork' },
          { SKAdNetworkIdentifier: 'klf5c3l5u5.skadnetwork' },
          { SKAdNetworkIdentifier: 'nfqy3847ph.skadnetwork' },
          { SKAdNetworkIdentifier: 'ppxm28t8ap.skadnetwork' },
          { SKAdNetworkIdentifier: '9wsyqb3ku7.skadnetwork' },
          { SKAdNetworkIdentifier: '424m5254lk.skadnetwork' },
          { SKAdNetworkIdentifier: 'qu637u8glc.skadnetwork' },
          { SKAdNetworkIdentifier: 'f73kdq92p3.skadnetwork' },
          { SKAdNetworkIdentifier: '44n7hlldy6.skadnetwork' },
          { SKAdNetworkIdentifier: '5l3tpt7t6e.skadnetwork' },
          { SKAdNetworkIdentifier: 'ecpz2srf59.skadnetwork' },
          { SKAdNetworkIdentifier: 'pwa73g5rt2.skadnetwork' },
          { SKAdNetworkIdentifier: 'x5854y7y24.skadnetwork' },
          { SKAdNetworkIdentifier: 'f7s53z58qe.skadnetwork' },
          { SKAdNetworkIdentifier: 'x8uqf25wch.skadnetwork' },
          { SKAdNetworkIdentifier: 'uw77j35x4d.skadnetwork' },
          { SKAdNetworkIdentifier: '6964rsfnh4.skadnetwork' },
          { SKAdNetworkIdentifier: 'gvmwg8q7h5.skadnetwork' },
          { SKAdNetworkIdentifier: '9yg77x724h.skadnetwork' },
          { SKAdNetworkIdentifier: 'n66cz3y3bx.skadnetwork' },
          { SKAdNetworkIdentifier: 'ydx93a7ass.skadnetwork' },
          { SKAdNetworkIdentifier: '578prtvx9j.skadnetwork' },
          { SKAdNetworkIdentifier: '4dzt52r2t5.skadnetwork' },
          { SKAdNetworkIdentifier: '6qx585k4p6.skadnetwork' },
          { SKAdNetworkIdentifier: 'l93v5h6a4m.skadnetwork' },
          { SKAdNetworkIdentifier: 'rvh3l7un93.skadnetwork' },
          { SKAdNetworkIdentifier: 'gta9lk7p23.skadnetwork' },
          { SKAdNetworkIdentifier: 'r45fhb6rf7.skadnetwork' },
          { SKAdNetworkIdentifier: 'e5fvkxwrpn.skadnetwork' },
          { SKAdNetworkIdentifier: '8c4e2ghe7u.skadnetwork' },
          { SKAdNetworkIdentifier: 'zq492l623r.skadnetwork' },
          { SKAdNetworkIdentifier: '32z4fx6l9h.skadnetwork' },
          { SKAdNetworkIdentifier: 'axh5283zss.skadnetwork' },
          { SKAdNetworkIdentifier: '3rd42ekr43.skadnetwork' },
          { SKAdNetworkIdentifier: '5mv394q32t.skadnetwork' },
          { SKAdNetworkIdentifier: '3qcr597p9d.skadnetwork' },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
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
      './plugins/with-google-modular-headers-plugin',
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
            'Allow $(PRODUCT_NAME) to tailor your experience and keep improving the app. Your sessions stay private.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'da7f6c59-bf84-4a19-b5a5-416fa73df15b',
      },
      analyticsEnv,
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
      appsFlyerDevKey,
      appsFlyerAppId,
      googleWebClientId:
        '464959684647-og75a7kr59nc9siganhms2rlp8ph2afm.apps.googleusercontent.com',
      googleIosClientId:
        '464959684647-rreivqrb4nfroan35pl04gb7nr3mumel.apps.googleusercontent.com',
    },
  },
}
