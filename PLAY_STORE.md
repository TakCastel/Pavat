# Publier Pavat sur le Play Store

Package : `com.pavat.app` (définitif une fois publié). Capacitor 8, targetSdk 36.

## 1. Clé de signature (une seule fois)

```bash
"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" -genkeypair -v \
  -keystore ~/keys/pavat-upload.jks -alias pavat -keyalg RSA -keysize 2048 -validity 10000
```

Puis créer `android/keystore.properties` (non versionné) :

```
storeFile=/Users/takcastel/keys/pavat-upload.jks
storePassword=...
keyAlias=pavat
keyPassword=...
```

Sauvegarder le .jks et le mot de passe dans un gestionnaire de mots de passe. Avec Play App Signing
(activé par défaut), une clé d'upload perdue peut être réinitialisée via le support Google.

## 2. Build

```bash
npm run build && npx cap sync android
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab
```

À chaque nouvelle version : incrémenter `versionCode` (et `versionName`) dans `android/app/build.gradle`.

## 3. AdMob (avant la prod)

1. Créer l'app sur admob.google.com, puis 3 blocs : Bannière, Interstitiel, Avec récompense.
2. Remplacer les ID dans `src/monetization.config.ts` et passer `testing: false`.
3. Remplacer `APPLICATION_ID` dans `android/app/src/main/AndroidManifest.xml`.
4. AdMob > Confidentialité et messages : créer le message RGPD (sinon pas de formulaire de consentement en Europe).
5. Publier `https://<ton-domaine>/app-ads.txt` avec la ligne donnée par AdMob.

## 4. Achat « Retirer les pubs »

Play Console > Monétiser > Produits intégrés : créer le produit **`remove_ads`** (achat unique), l'activer.
Il n'apparaît dans l'app qu'une fois la build uploadée sur une piste (test interne suffit).
Ajouter ton compte Google comme testeur de licence pour tester sans payer.

## 5. AdSense (site web)

Une fois le site accepté par AdSense : renseigner `ADSENSE.client` et `ADSENSE.gameOverSlot` dans
`src/monetization.config.ts`. Attention : en Europe, Google exige une CMP certifiée pour les pubs
AdSense ; le bandeau maison ne l'est pas. Utiliser le message RGPD d'AdSense (Confidentialité et messages).

## 6. Play Console

- Compte développeur (25 $), créer l'app « Pavat », jeu, gratuit, contient des pubs : **oui**.
- Comptes perso créés après nov. 2023 : test fermé obligatoire (12 testeurs pendant 14 jours) avant la prod.
- Fiche : icône 512×512, bannière 1024×500, au moins 2 captures téléphone, descriptions.
- Politique de confidentialité : URL publique (la page de mentions légales du site).
- Sécurité des données : Identifiant publicitaire + données d'interaction (AdMob), stats (Firebase
  Analytics), achats (Play). Pas de compte, pas de données vendues.
- Classification du contenu, public cible (pas « enfants » sinon règles de pub spécifiques), déclaration ID publicitaire : oui.
