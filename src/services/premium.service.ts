import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { REMOVE_ADS_PRODUCT_ID } from '../monetization.config';

const STORAGE_KEY = 'pavat_premium';

/**
 * Achat unique « Retirer les pubs » via Google Play Billing.
 * L'état est mis en cache localement pour ne pas afficher de pub au démarrage
 * le temps que Play réponde, puis revérifié auprès de Play à chaque lancement.
 */
@Injectable({ providedIn: 'root' })
export class PremiumService {
  readonly isNative = Capacitor.isNativePlatform();
  readonly isPremium = signal<boolean>(this.readCache());
  /** Prix localisé renvoyé par Play (ex. « 2,99 € »), null tant qu'inconnu. */
  readonly price = signal<string | null>(null);
  readonly busy = signal(false);
  /** Achats disponibles sur cet appareil (Play Billing présent et produit configuré). */
  readonly available = signal(false);

  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.isNative ? this.init() : Promise.resolve();
  }

  /** Résout une fois l'état premium vérifié auprès de Play (ou au plus tard après 4 s). */
  whenReady(): Promise<void> {
    return Promise.race([this.ready, new Promise<void>(r => setTimeout(r, 4000))]);
  }

  private async init(): Promise<void> {
    try {
      const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      if (!isBillingSupported) return;
      await this.refreshFromStore();
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [REMOVE_ADS_PRODUCT_ID],
        productType: PURCHASE_TYPE.INAPP,
      });
      const product = products.find(p => p.identifier === REMOVE_ADS_PRODUCT_ID);
      if (product) {
        this.price.set(product.priceString);
        this.available.set(true);
      }
    } catch (error) {
      console.warn('Play Billing indisponible:', error);
    }
  }

  private async refreshFromStore(): Promise<void> {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const owned = purchases.some(
      p => p.productIdentifier === REMOVE_ADS_PRODUCT_ID && (p.purchaseState === undefined || p.purchaseState === '1'),
    );
    this.setPremium(owned);
  }

  async buy(): Promise<void> {
    if (!this.available() || this.busy()) return;
    this.busy.set(true);
    try {
      const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
      const tx = await NativePurchases.purchaseProduct({
        productIdentifier: REMOVE_ADS_PRODUCT_ID,
        productType: PURCHASE_TYPE.INAPP,
      });
      // purchaseState "1" = acheté ; "2" = en attente (paiement différé), on n'active pas encore
      if (tx.purchaseState === undefined || tx.purchaseState === '1') {
        this.setPremium(true);
      }
    } catch (error) {
      // Annulation par le joueur ou erreur Play : rien à faire
      console.warn('Achat non abouti:', error);
    } finally {
      this.busy.set(false);
    }
  }

  async restore(): Promise<void> {
    if (!this.isNative || this.busy()) return;
    this.busy.set(true);
    try {
      const { NativePurchases } = await import('@capgo/native-purchases');
      await NativePurchases.restorePurchases();
      await this.refreshFromStore();
    } catch (error) {
      console.warn('Restauration impossible:', error);
    } finally {
      this.busy.set(false);
    }
  }

  private setPremium(value: boolean): void {
    this.isPremium.set(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // stockage indisponible
    }
  }

  private readCache(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
