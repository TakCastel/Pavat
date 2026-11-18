/**
 * Réglages de monétisation (AdMob dans l'app, AdSense sur le web, achat « sans pub »).
 *
 * Les ID AdMob ci-dessous sont les ID de TEST publics de Google : ils affichent des
 * pubs factices et peuvent être utilisés sans risque. Avant la mise en production,
 * remplacer par les vrais ID du compte AdMob (et l'APPLICATION_ID dans
 * android/app/src/main/AndroidManifest.xml), puis passer `testing` à false.
 */
export const ADMOB = {
  testing: true,
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  /** Un interstitiel au plus toutes les N parties terminées. */
  interstitialEveryNGames: 3,
  /** Et jamais deux interstitiels à moins de N secondes d'écart. */
  interstitialMinIntervalSec: 120,
};

/**
 * AdSense (version web uniquement). Laisser vide tant que le site n'est pas validé
 * par AdSense : aucun script n'est alors chargé.
 * Exemple : client 'ca-pub-1234567890123456', slot '1234567890'.
 */
export const ADSENSE = {
  client: '',
  gameOverSlot: '',
};

/** Produit « achat unique » à créer dans la Play Console (Monétiser > Produits intégrés). */
export const REMOVE_ADS_PRODUCT_ID = 'remove_ads';
