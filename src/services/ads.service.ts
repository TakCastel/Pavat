import { Injectable, effect, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  type AdMobRevenueData,
} from '@capacitor-community/admob';
import {
  INTERSTITIAL_EVERY_N_GAMES,
  INTERSTITIAL_MIN_INTERVAL_MS,
  USE_TEST_ADS,
  adUnitsFor,
} from '../config/ads.config';
import { AnalyticsService } from './analytics.service';
import { SoundService } from './sound.service';

/**
 * Publicités AdMob, dans les apps Android / iOS seulement (le site web reste sans pub).
 *
 * - Une bannière en bas de l'écran pendant la partie (la mise en page se décale au-dessus,
 *   via la variable CSS --ad-banner-h).
 * - Un interstitiel quand on relance une partie après un « Fin de partie »,
 *   au plus toutes les INTERSTITIAL_EVERY_N_GAMES parties et pas plus souvent que
 *   INTERSTITIAL_MIN_INTERVAL_MS.
 *
 * Le consentement RGPD est recueilli par le formulaire Google (UMP), à configurer dans
 * AdMob > Confidentialité et messages. Sur iOS, la demande ATT (suivi publicitaire) suit.
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private analytics = inject(AnalyticsService);
  private sound = inject(SoundService);

  /** true dans les apps natives : c'est là, et seulement là, qu'on affiche des pubs */
  readonly enabled = Capacitor.isNativePlatform();
  /** Le joueur peut rouvrir le formulaire de consentement pub (exigé en Europe) */
  readonly privacyOptionsRequired = signal(false);

  private platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  private units = adUnitsFor(this.platform as 'android' | 'ios');
  private started = false;
  private ready = false;
  private interstitialLoaded = false;
  private gamesSinceInterstitial = 0;
  private lastInterstitialAt = Date.now();

  constructor() {
    if (!this.enabled) return;
    // Le son du jeu coupé = les pubs vidéo démarrent muettes
    effect(() => {
      const muted = !this.sound.isSoundEnabled();
      if (this.ready) void AdMob.setApplicationMuted({ muted }).catch(() => undefined);
    });
  }

  /** À appeler une fois l'interface affichée. */
  async init(): Promise<void> {
    if (!this.enabled || this.started) return;
    this.started = true;
    try {
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        consent = await AdMob.showConsentForm();
      }
      this.privacyOptionsRequired.set(
        String(consent.privacyOptionsRequirementStatus) === 'REQUIRED',
      );
      if (!consent.canRequestAds) return;

      if (this.platform === 'ios') {
        const { status } = await AdMob.trackingAuthorizationStatus();
        if (status === 'notDetermined') await AdMob.requestTrackingAuthorization();
      }

      await AdMob.initialize();
      this.ready = true;
      await AdMob.setApplicationMuted({ muted: !this.sound.isSoundEnabled() }).catch(() => undefined);
      await this.registerListeners();
      await this.showBanner();
      void this.prepareInterstitial();
    } catch (error) {
      console.warn('AdMob non initialisé :', error);
    }
  }

  /** Rouvre le formulaire de consentement publicitaire (lien dans les options). */
  async showPrivacyOptions(): Promise<void> {
    if (!this.enabled) return;
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch (error) {
      console.warn('Formulaire de confidentialité indisponible :', error);
    }
  }

  /** Une partie vient de se terminer. */
  onGameOver(): void {
    this.gamesSinceInterstitial++;
  }

  /**
   * Le joueur relance une partie après un « Fin de partie » : moment naturel pour un interstitiel.
   * Ne bloque jamais : si aucune pub n'est prête, on joue tout de suite.
   */
  async maybeShowInterstitial(): Promise<void> {
    if (!this.ready || !this.interstitialLoaded) return;
    if (this.gamesSinceInterstitial < INTERSTITIAL_EVERY_N_GAMES) return;
    if (Date.now() - this.lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return;
    try {
      this.interstitialLoaded = false;
      await AdMob.showInterstitial();
      this.gamesSinceInterstitial = 0;
      this.lastInterstitialAt = Date.now();
    } catch (error) {
      console.warn('Interstitiel non affiché :', error);
      void this.prepareInterstitial();
    }
  }

  private async showBanner(): Promise<void> {
    await AdMob.showBanner({
      adId: this.units.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: USE_TEST_ADS,
    });
  }

  private async prepareInterstitial(): Promise<void> {
    try {
      await AdMob.prepareInterstitial({ adId: this.units.interstitial, isTesting: USE_TEST_ADS, immersiveMode: true });
    } catch (error) {
      console.warn('Interstitiel non chargé :', error);
    }
  }

  private async registerListeners(): Promise<void> {
    // Décale la mise en page du jeu au-dessus de la bannière
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      document.documentElement.style.setProperty('--ad-banner-h', `${Math.max(0, size.height)}px`);
    });
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
      document.documentElement.style.setProperty('--ad-banner-h', '0px');
    });
    await AdMob.addListener(BannerAdPluginEvents.AdPaid, (data) => this.trackRevenue('banner', data));

    await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      this.interstitialLoaded = true;
    });
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
      this.interstitialLoaded = false;
      // Nouvel essai plus tard, sans insister
      setTimeout(() => void this.prepareInterstitial(), 60_000);
    });
    await AdMob.addListener(InterstitialAdPluginEvents.AdImpression, (data) => this.trackRevenue('interstitial', data));
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => void this.prepareInterstitial());
  }

  /** Revenu publicitaire → événement GA4 recommandé « ad_impression » */
  private trackRevenue(format: 'banner' | 'interstitial', data: AdMobRevenueData): void {
    this.analytics.track('ad_impression', {
      ad_platform: 'AdMob',
      ad_source: data?.networkName,
      ad_format: format,
      ad_unit_name: data?.adUnitId,
      value: (data?.valueMicros ?? 0) / 1_000_000,
      currency: data?.currencyCode || 'USD',
    });
  }
}
