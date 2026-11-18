# Guide de configuration mobile pour Pavat

> **Publication sur les stores, pubs AdMob et Google Analytics : voir [STORE_RELEASE.md](STORE_RELEASE.md).**
> Les projets `android/` et `ios/` sont maintenant générés et versionnés (Capacitor 8) : inutile de relancer `cap add`.

Ce guide vous explique comment transformer Pavat en application mobile pour iOS et Android tout en conservant le site web.

## 🎯 Vue d'ensemble

Pavat est maintenant configuré comme une **Progressive Web App (PWA)** qui peut être installée sur mobile, et peut également être compilée en applications natives iOS et Android via **Capacitor**.

## 📱 Fonctionnalités PWA

L'application peut maintenant être installée sur mobile directement depuis le navigateur :
- Mode hors ligne (via Service Worker)
- Installation sur l'écran d'accueil
- Expérience native-like
- Fonctionne sur iOS et Android

## 🚀 Installation des dépendances

```bash
npm install
```

Cela installera :
- `@capacitor/core` - Core Capacitor
- `@capacitor/cli` - CLI Capacitor
- `@capacitor/app` - Gestion de l'application
- `@capacitor/haptics` - Retour haptique
- `@capacitor/keyboard` - Gestion du clavier
- `@capacitor/status-bar` - Barre de statut
- `@capacitor/splash-screen` - Écran de démarrage

## 🎨 Génération des icônes

Avant de déployer, vous devez créer les icônes de l'application :

1. **Option 1 : Service en ligne (recommandé)**
   - Allez sur https://realfavicongenerator.net/
   - Uploadez une image de 512x512px
   - Téléchargez et extrayez les icônes dans `src/assets/icons/`

2. **Option 2 : Script manuel**
   ```bash
   node generate-icons.js
   ```
   (Suivez les instructions affichées)

3. **Option 3 : ImageMagick**
   ```bash
   for size in 72 96 128 144 152 192 384 512; do
     convert src/assets/icon-source.png -resize ${size}x${size} src/assets/icons/icon-${size}x${size}.png
   done
   ```

Les icônes doivent être placées dans `src/assets/icons/` avec les noms :
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## 🌐 Déploiement PWA (Site web)

1. **Construire l'application**
   ```bash
   npm run build
   ```

2. **Déployer sur Netlify/Vercel/etc.**
   - Le site fonctionnera comme une PWA
   - Les utilisateurs pourront l'installer depuis leur navigateur mobile
   - Fonctionne en mode hors ligne

## 📲 Configuration pour applications natives (iOS/Android)

### Initialisation Capacitor

```bash
# Initialiser Capacitor (déjà fait, mais au cas où)
npx cap init

# Ajouter les plateformes
npm run cap:add:ios
npm run cap:add:android
```

### Synchronisation

Après chaque build, synchronisez avec Capacitor :

```bash
# 1. Construire l'application
npm run build

# 2. Copier les fichiers dans les projets natifs
npm run cap:copy

# 3. Synchroniser les plugins
npm run cap:sync
```

### iOS

**Prérequis :**
- macOS
- Xcode installé
- Compte développeur Apple (gratuit pour tester)

**Développement :**
```bash
npm run cap:open:ios
```

Cela ouvrira Xcode où vous pourrez :
- Configurer les certificats de signature
- Tester dans le simulateur
- Créer un build pour l'App Store

**Configuration iOS :**
- Les icônes et splash screens sont dans `ios/App/App/Assets.xcassets/`
- La configuration est dans `ios/App/App/Info.plist`

### Android

**Prérequis :**
- Android Studio installé
- JDK installé

**Développement :**
```bash
npm run cap:open:android
```

Cela ouvrira Android Studio où vous pourrez :
- Tester dans l'émulateur
- Créer un APK pour tester
- Créer un AAB pour Google Play Store

**Configuration Android :**
- Les icônes sont dans `android/app/src/main/res/`
- La configuration est dans `android/app/src/main/AndroidManifest.xml`

## 🔧 Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run cap:sync` - Synchroniser avec les projets natifs
- `npm run cap:copy` - Copier les fichiers web
- `npm run cap:open:ios` - Ouvrir le projet iOS dans Xcode
- `npm run cap:open:android` - Ouvrir le projet Android dans Android Studio

## 📝 Notes importantes

1. **Service Worker** : Le service worker est automatiquement enregistré au chargement de l'application
2. **Manifest** : Le manifest PWA est dans `src/manifest.json`
3. **Configuration Capacitor** : `capacitor.config.ts`
4. **Base URL** : Assurez-vous que `baseHref` dans `angular.json` correspond à votre déploiement

## 🐛 Dépannage

**Le service worker ne se charge pas :**
- Vérifiez que vous servez via HTTPS (ou localhost)
- Vérifiez la console du navigateur pour les erreurs

**Les icônes ne s'affichent pas :**
- Vérifiez que les fichiers sont dans `src/assets/icons/`
- Vérifiez les chemins dans `manifest.json`
- Assurez-vous que les icônes sont copiées lors du build

**Capacitor ne synchronise pas :**
- Exécutez `npm run build` avant `npm run cap:sync`
- Vérifiez que `webDir` dans `capacitor.config.ts` pointe vers `dist`

## 🎉 Résultat

Vous avez maintenant :
- ✅ Un site web fonctionnel (PWA)
- ✅ Une application installable sur mobile (PWA)
- ✅ Des projets natifs iOS et Android prêts à être compilés
- ✅ Mode hors ligne fonctionnel

L'application fonctionne sur :
- 🌐 Navigateurs web (desktop et mobile)
- 📱 iOS (via App Store ou installation directe)
- 🤖 Android (via Play Store ou APK)
