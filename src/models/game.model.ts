export interface Cell {
  color: string | null;
  tileId: number | null;
  clearing?: boolean;
  shrinking?: boolean;
  validated?: boolean;
  blocked?: boolean;
}

export interface Tile {
  id: number;
  shape: number[][];
  color: string;
  width: number;
  height: number;
  barycenter: { r: number; c: number };
}

export interface GameState {
  grid: Cell[][];
  gridSize: number;
  score: number;
  currentTile: Tile | null;
  nextTile: Tile | null;
  isGameOver: boolean;
  lastPlacedTileId?: number | null;
  isShrinking?: boolean;
  changeDirectionIndex: number; // 0: BR, 1: BL, 2: TL, 3: TR
  isShrinkImminent?: boolean;
  undoCharges: number;
  undoProgressPoints: number;
  /** Nombre d'annulations débloquées depuis le début de la partie (fait monter le coût) */
  undoUnlocked?: number;
  /** Ancien compteur (un seul type de bonus): repris en "nettoyage" au chargement */
  bonusCharges?: number;
  /** Bonus en réserve, par type */
  bonusInventory?: BonusInventory;
  /** Paliers de score franchis depuis le début de la partie */
  bonusEarned?: number;
  /** Paliers franchis dont le bonus n'a pas encore été choisi */
  bonusPending?: number;
}

export type BonusType = 'clear' | 'paint' | 'bomb';
export type BonusInventory = Record<BonusType, number>;
