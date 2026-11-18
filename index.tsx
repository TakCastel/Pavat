
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));

// Enregistrement du Service Worker pour la PWA (pas dans les apps natives :
// les fichiers y sont déjà embarqués, et un cache ferait rater les mises à jour)
const isNativeApp = (window as any).Capacitor?.isNativePlatform?.() === true;
if ('serviceWorker' in navigator && !isNativeApp) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Échec de l\'enregistrement du Service Worker:', error);
    });
  });
}

// Firebase Analytics : démarré uniquement après consentement (ConsentService)

// AI Studio always uses an `index.tsx` file for all project types.
