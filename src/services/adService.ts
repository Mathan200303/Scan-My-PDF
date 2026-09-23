import { Platform } from 'react-native';
import mobileAds, {
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

/**
 * AdMob Configuration & Service
 * 
 * Replace the production IDs below with your real AdMob Ad Unit IDs
 * when your AdMob account is ready to go live on Play Store.
 */
export const AdConfig = {
  // Set to false for Production release
  USE_TEST_ADS: false,

  // Android Ad Unit IDs (Your Production IDs)
  ANDROID: {
    BANNER_ID: 'ca-app-pub-6665157780036298/1366653562',
    INTERSTITIAL_ID: 'ca-app-pub-6665157780036298/7908011184',
  },

  // iOS Ad Unit IDs (Fallback test IDs)
  IOS: {
    BANNER_ID: 'ca-app-pub-3940256099942544/2934735716',
    INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/4411468910',
  },
};

export const getBannerAdUnitId = (): string => {
  if (__DEV__ || AdConfig.USE_TEST_ADS) {
    return TestIds.BANNER;
  }
  return Platform.OS === 'ios' ? AdConfig.IOS.BANNER_ID : AdConfig.ANDROID.BANNER_ID;
};

export const getInterstitialAdUnitId = (): string => {
  if (__DEV__ || AdConfig.USE_TEST_ADS) {
    return TestIds.INTERSTITIAL;
  }
  return Platform.OS === 'ios' ? AdConfig.IOS.INTERSTITIAL_ID : AdConfig.ANDROID.INTERSTITIAL_ID;
};

let interstitialAd: InterstitialAd | null = null;
let isInterstitialLoaded = false;

export const AdService = {
  /**
   * Initializes the Google Mobile Ads SDK on app startup
   */
  async initialize(): Promise<void> {
    try {
      await mobileAds().initialize();
      this.loadInterstitial();
    } catch (e) {
      console.warn('AdMob initialization error', e);
    }
  },

  /**
   * Pre-loads an Interstitial Ad in the background
   */
  loadInterstitial(): void {
    try {
      const adUnitId = getInterstitialAdUnitId();
      interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        isInterstitialLoaded = true;
      });

      interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        isInterstitialLoaded = false;
        // Reload for next time
        this.loadInterstitial();
      });

      interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        isInterstitialLoaded = false;
      });

      interstitialAd.load();
    } catch (e) {
      console.warn('Failed to load interstitial ad', e);
    }
  },

  /**
   * Shows an Interstitial Ad (e.g., after PDF creation) if loaded
   */
  showInterstitial(): boolean {
    try {
      if (interstitialAd && isInterstitialLoaded) {
        interstitialAd.show();
        return true;
      }
    } catch (e) {
      console.warn('Error showing interstitial', e);
    }
    return false;
  },
};

