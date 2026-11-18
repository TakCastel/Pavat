# Publier Pavat sur le Play Store et l'App Store (avec pubs et Analytics)

Ce qui est déjà en place dans le code :

| Quoi | Où | État |
|---|---|---|
| Projets natifs Android et iOS (Capacitor 8, SDK Android cible 36) | `android/`, `ios/` | ✅ générés et versionnés |
| Icônes et écrans de démarrage | `assets/` → `npm run assets:mobile` | ✅ générés depuis l'icône du jeu |
| Publicités AdMob (bannière + interstitiel) | `src/services/ads.service.ts`, `src/config/ads.config.ts` | ✅ en mode **test** |
| Consentement RGPD des pubs (formulaire Google UMP) + ATT sur iPhone | `ads.service.ts` | ✅ (à configurer dans AdMob, voir §1) |
| Google Analytics (GA4 via Firebase), événements de jeu | `src/services/analytics.service.ts` | ✅ actif après consentement |
| Mentions légales mises à jour (pubs) | `legal-notice.component.ts` | ✅ |

Le **site web reste sans publicité** : AdMob ne fonctionne que dans les apps.

---

## 1. AdMob (les pubs)

1. Créer un compte sur <https://admob.google.com> (le relier à un compte AdSense pour être payé).
2. **Applications → Ajouter une application** : une fois pour Android, une fois pour iOS
   (on peut d'abord dire « pas encore publiée », puis la lier au store plus tard).
3. Pour chaque app, créer deux **blocs d'annonces** : *Bannière* et *Interstitiel*.
4. Reporter les identifiants :
   - **ID d'application** (`ca-app-pub-XXXX~YYYY`) :
     - Android : `android/app/src/main/res/values/strings.xml` → `admob_app_id`
     - iOS : `ios/App/App/Info.plist` → `GADApplicationIdentifier`
   - **ID de blocs** (`ca-app-pub-XXXX/YYYY`) : `src/config/ads.config.ts` → `PROD_UNITS`
5. Dans `src/config/ads.config.ts`, passer `USE_TEST_ADS` à `false`.
   ⚠️ Ne jamais cliquer sur ses propres pubs réelles : risque de suspension du compte.
6. **Confidentialité et messages** (menu AdMob) : créer un message **RGPD** (et, pour iOS,
   le message **IDFA / ATT**). Sans ce message, aucun formulaire de consentement ne s'affiche
   en Europe et les pubs y seront très limitées.
7. **app-ads.txt** : AdMob donne une ligne du type
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
   La mettre dans `src/app-ads.txt`, l'ajouter aux `assets` d'`angular.json`
   (comme `manifest.json`) et déclarer `https://pavat-game.web.app` comme site du développeur
   dans les deux stores.
8. iOS : compléter `SKAdNetworkItems` dans `Info.plist` avec la liste complète donnée par Google
   (<https://developers.google.com/admob/ios/quick-start#update_your_infoplist>).

Réglages de fréquence dans `src/config/ads.config.ts` :
- `INTERSTITIAL_EVERY_N_GAMES` (défaut 2) : un interstitiel au plus toutes les 2 parties ;
- `INTERSTITIAL_MIN_INTERVAL_MS` (défaut 3 min) : jamais deux interstitiels trop rapprochés.

L'interstitiel s'affiche quand le joueur appuie sur **Rejouer** après une fin de partie,
jamais en pleine partie. La bannière reste en bas, la grille se décale au-dessus.

## 2. Google Analytics

Déjà branché sur la propriété GA4 `G-G2206TMK5J` (projet Firebase `pavat-game`).
Les apps envoient dans le même flux que le site ; la propriété utilisateur `app_platform`
(`web` / `android` / `ios`) permet de les séparer.

Événements envoyés (seulement si le joueur a accepté la mesure d'audience) :

| Événement | Paramètres |
|---|---|
| `game_start` | — |
| `game_over` | `score`, `grid_size`, `best_score`, `duration_sec` |
| `new_best_score` | `score` |
| `grid_resize` | `from_size`, `to_size`, `score` |
| `bonus_chosen` / `bonus_used` | `bonus_type` (`clear`, `paint`, `bomb`) |
| `undo_used` | `score` |
| `tutorial_begin` / `tutorial_complete` | — |
| `share` | `method`, `score` |
| `ad_impression` (apps) | `ad_format`, `ad_source`, `value`, `currency` → revenus pub dans GA4 |

À faire dans GA4 (Admin → Définitions personnalisées) pour voir les paramètres dans les rapports :
créer les dimensions `app_platform` (portée **utilisateur**), `bonus_type`, et les métriques
`score`, `duration_sec`, `grid_size` (portée **événement**). Marquer `game_over` comme
« événement clé » si on veut suivre les parties terminées.

## 3. Construire les apps

```bash
npm install
npm run build:mobile        # build web + copie dans android/ et ios/
```

À refaire après chaque modification du jeu. Penser à augmenter le numéro de version :
- Android : `android/app/build.gradle` → `versionCode` (+1 à chaque envoi) et `versionName`
- iOS : dans Xcode, *General* → *Version* et *Build*

### Android → Google Play

Prérequis : Android Studio, compte Google Play Console (25 $ une fois).

1. Créer la clé de signature (une seule fois, **à sauvegarder précieusement**) :
   ```bash
   keytool -genkey -v -keystore android/pavat-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pavat
   ```
2. Créer `android/keystore.properties` (ignoré par git) :
   ```properties
   storeFile=../pavat-release.jks
   storePassword=...
   keyAlias=pavat
   keyPassword=...
   ```
3. Générer le paquet : `cd android && ./gradlew bundleRelease`
   → `android/app/build/outputs/bundle/release/app-release.aab`
4. Play Console → Créer l'application → envoyer l'`.aab` en **test interne** d'abord.
5. Fiche à remplir :
   - **Contient des annonces : Oui**
   - **Sécurité des données** : données collectées = identifiant publicitaire, données
     d'utilisation et de diagnostic (AdMob + Analytics) ; partagées avec Google ;
     finalités publicité et analyse.
   - **Règles de confidentialité (URL)** : `https://pavat-game.web.app` (les mentions
     légales sont dans le jeu ; une page dédiée est encore mieux).
   - Public cible : 13 ans et plus (sinon les règles « Familles » imposent d'autres réglages pub).
   - Nouveau compte développeur personnel : Google exige un **test fermé avec 12 testeurs
     pendant 14 jours** avant la mise en production.

### iOS → App Store

Prérequis : un Mac avec Xcode, compte Apple Developer (99 $/an).

1. `npm run build:mobile` puis `npx cap open ios`.
2. Dans Xcode : *Signing & Capabilities* → choisir son équipe. Identifiant : `com.pavat.app`.
3. *Product → Archive* puis *Distribute App → App Store Connect*.
4. Dans App Store Connect :
   - **Confidentialité de l'app** : « Données utilisées pour vous suivre » = identifiant
     de l'appareil (pub) ; « Données liées » = données d'utilisation, diagnostics ; tiers : Google.
   - URL de politique de confidentialité (comme pour Android).
   - Âge : 4+ possible, mais les pubs doivent rester adaptées (filtrer les catégories dans AdMob).
5. Tester via **TestFlight**, puis soumettre à la validation.

## 4. Vérifier les pubs en test

Avec `USE_TEST_ADS = true`, des bannières « Test Ad » de Google s'affichent dans l'app.
Pour tester le formulaire de consentement européen hors d'Europe, voir
`node_modules/@capacitor-community/admob/docs/consent.md` (option `debugGeography`).
