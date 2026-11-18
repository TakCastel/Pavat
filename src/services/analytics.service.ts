import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { trackAnalyticsEvent } from '../firebase';

/**
 * Événements de jeu envoyés à Google Analytics (GA4, via Firebase).
 * Tout passe par ici ; rien ne part tant que le joueur n'a pas accepté la mesure d'audience.
 *
 * Événements envoyés (visibles dans GA4 > Rapports > Engagement > Événements) :
 *  - game_start            nouvelle partie
 *  - game_over             fin de partie { score, grid_size, best_score, duration_sec }
 *  - new_best_score        record battu { score }
 *  - level_up              la grille rétrécit { grid_size, score }
 *  - bonus_chosen          bonus choisi à un palier { bonus_type }
 *  - bonus_used            bonus utilisé { bonus_type }
 *  - undo_used             annulation utilisée
 *  - tutorial_begin / tutorial_complete
 *  - share                 partage du score { method, score }
 *  - ad_impression         publicité vue (apps) { ad_platform, ad_format, ad_unit_name, value, currency }
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  readonly platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

  track(name: string, params: Record<string, unknown> = {}): void {
    trackAnalyticsEvent(name, { app_platform: this.platform, ...params });
  }
}
