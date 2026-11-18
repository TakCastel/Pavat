import { Injectable, effect, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { AdMobPlugin } from '@capacitor-community/admob';
import { ADMOB } from '../monetization.config';
import { PremiumService } from './premium.service';

/**
 * Pubs AdMob de l'app native : bannière, interstitiel entre deux parties, vidéo récompensée.
 * Sur le web ce service ne fait rien (voir AdSenseService).
 *
 * Le consentement RGPD aux pubs passe par le formulaire UMP de Google, configuré
 * dans la console AdMob (Confidentialité et messages).
 */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private premium = inject(PremiumService);
  private readonly isNative = Capacitor.isNativePlatform();

  private admob: AdMobPlugin | null = null;
  private started = false;
  private bannerShown = false;
  private interstitialReady = false;
  private gamesSinceInterstitial = 0;
  private lastInterstitialAt = 0;

  /** Une vidéo récompensée est chargée et prête à être montrée. */
  readonly rewardedReady = signal(false);
  /** Le joueur doit pouvoir rouvrir le formulaire de consentement aux pubs (EEE, UK...). */
  readonly privacyOptionsRequired = signal(false);

  constructor() {
    // Achat « sans pub » pendant la session : on retire la bannière tout de suite
    effect(() => {
      if (this.premium.isPremium()) void this.hideBanner();
    });
  }

  async start(): Promise<void> {
    if (!this.isNative || this.started) return;
    this.started = true;
    try {
      const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = await import('@capacitor-community/admob');
      this.admob = AdMob;

      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        info = await AdMob.showConsentForm();
      }
      this.privacyOptionsRequired.set(
        String(info.privacyOptionsRequirementStatus) === 'REQUIRED',
      );
      if (!info.canRequestAds) return;

      await AdMob.initialize({ initializeForTesting: ADMOB.testing });

      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, size => {
        document.documentElement.style.setProperty('--ad-h', `${size.height}px`);
      });

      await this.premium.whenReady();
      if (!this.premium.isPremium()) {
        await this.showBanner();
        void this.loadInterstitial();
      }
      void this.loadRewarded();
    } catch (error) {
      console.warn('AdMob non initialisé:', error);
    }
  }

  async showPrivacyOptions(): Promise<void> {
    await this.admob?.showPrivacyOptionsForm();
  }

  private async showBanner(): Promise<void> {
    if (!this.admob || this.bannerShown) return;
    const { BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob');
    await this.admob.showBanner({
      adId: ADMOB.bannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: ADMOB.testing,
    });
    this.bannerShown = true;
  }

  private async hideBanner(): Promise<void> {
    if (!this.admob || !this.bannerShown) return;
    this.bannerShown = false;
    try {
      await this.admob.removeBanner();
    } finally {
      document.documentElement.style.setProperty('--ad-h', '0px');
    }
  }

  private async loadInterstitial(): Promise<void> {
    if (!this.admob || this.interstitialReady) return;
    try {
      await this.admob.prepareInterstitial({ adId: ADMOB.interstitialId, isTesting: ADMOB.testing });
      this.interstitialReady = true;
    } catch {
      this.interstitialReady = false;
    }
  }

  private async loadRewarded(): Promise<void> {
    if (!this.admob || this.rewardedReady()) return;
    try {
      await this.admob.prepareRewardVideoAd({ adId: ADMOB.rewardedId, isTesting: ADMOB.testing });
      this.rewardedReady.set(true);
    } catch {
      this.rewardedReady.set(false);
    }
  }

  /**
   * À appeler quand le joueur relance une partie après un game over.
   * Montre un interstitiel si le plafond de fréquence le permet.
   */
  async onGameFinished(): Promise<void> {
    if (!this.admob || this.premium.isPremium()) return;
    this.gamesSinceInterstitial++;
    const now = Date.now();
    const due =
      this.gamesSinceInterstitial >= ADMOB.interstitialEveryNGames &&
      now - this.lastInterstitialAt >= ADMOB.interstitialMinIntervalSec * 1000;
    if (!due || !this.interstitialReady) return;
    this.interstitialReady = false;
    try {
      await this.admob.showInterstitial();
      this.gamesSinceInterstitial = 0;
      this.lastInterstitialAt = now;
    } catch (error) {
      console.warn('Interstitiel non affiché:', error);
    } finally {
      void this.loadInterstitial();
    }
  }

  /** Montre la vidéo récompensée. Résout à true si le joueur a gagné sa récompense. */
  async showRewarded(): Promise<boolean> {
    if (!this.admob || !this.rewardedReady()) return false;
    this.rewardedReady.set(false);
    try {
      const reward = await this.admob.showRewardVideoAd();
      return !!reward;
    } catch (error) {
      console.warn('Vidéo récompensée non aboutie:', error);
      return false;
    } finally {
      void this.loadRewarded();
    }
  }
}
