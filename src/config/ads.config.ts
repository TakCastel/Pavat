/**
 * Configuration des publicités AdMob (apps Android / iOS uniquement : rien sur le site web).
 *
 * Tant que USE_TEST_ADS vaut true, ce sont les blocs de démo de Google qui s'affichent :
 * on peut tester sans risque de se faire bannir pour des clics invalides.
 *
 * Pour passer en production :
 *  1. Créer l'app Android et l'app iOS dans https://admob.google.com
 *  2. Créer pour chacune un bloc « Bannière » et un bloc « Interstitiel »
 *  3. Coller les identifiants de blocs ci-dessous (format ca-app-pub-XXXX/YYYY)
 *  4. Mettre les identifiants d'APPLICATION (format ca-app-pub-XXXX~ZZZZ) dans :
 *       - android/app/src/main/res/values/strings.xml  (admob_app_id)
 *       - ios/App/App/Info.plist                        (GADApplicationIdentifier)
 *  5. Passer USE_TEST_ADS à false
 */
export const USE_TEST_ADS = true;

interface AdUnits {
  banner: string;
  interstitial: string;
}

/** Blocs de démo officiels de Google (toujours remplis, jamais facturés) */
const TEST_UNITS: Record<'android' | 'ios', AdUnits> = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
};

/** À remplir avec vos vrais blocs AdMob */
const PROD_UNITS: Record<'android' | 'ios', AdUnits> = {
  android: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
  ios: {
    banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
    interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  },
};

export const adUnitsFor = (platform: 'android' | 'ios'): AdUnits =>
  (USE_TEST_ADS ? TEST_UNITS : PROD_UNITS)[platform];

/** Un interstitiel au plus toutes les N parties terminées… */
export const INTERSTITIAL_EVERY_N_GAMES = 2;
/** …et jamais deux à moins de X ms d'écart */
export const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
