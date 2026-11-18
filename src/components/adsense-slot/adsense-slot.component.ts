import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ADSENSE } from '../../monetization.config';
import { ConsentService } from '../../services/consent.service';

let scriptRequested = false;

/** Charge le script AdSense une seule fois, et seulement après consentement. */
function loadAdSenseScript(client: string): void {
  if (scriptRequested) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(script);
}

/**
 * Emplacement de pub AdSense (site web uniquement). Ne rend rien dans l'app native
 * (AdMob prend le relais), tant que l'ID AdSense n'est pas renseigné, ou sans consentement.
 */
@Component({
  selector: 'app-adsense-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enabled()) {
      <ins class="adsbygoogle"
        style="display:block;min-height:100px"
        [attr.data-ad-client]="client"
        [attr.data-ad-slot]="slot"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    }
  `,
})
export class AdSenseSlotComponent {
  private consent = inject(ConsentService);
  private host = inject(ElementRef<HTMLElement>);
  protected readonly client = ADSENSE.client;
  protected readonly slot = ADSENSE.gameOverSlot;

  protected enabled = computed(
    () => !Capacitor.isNativePlatform() && !!this.client && !!this.slot && this.consent.choice() === 'accepted',
  );

  constructor() {
    afterNextRender(() => {
      if (!this.enabled()) return;
      loadAdSenseScript(this.client);
      try {
        const w = window as unknown as { adsbygoogle: unknown[] };
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch {
        // bloqueur de pub : on laisse l'emplacement vide
      }
    });
  }
}
