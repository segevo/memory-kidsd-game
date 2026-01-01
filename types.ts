export interface Character {
  name: string;
  source: string; // e.g., "Super Mario Bros", "Cocomelon"
  description: string;
}

export interface CardData {
  id: string;
  pairId: string;
  image: string;
  character: Character;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  cards: CardData[];
  isGameWon: boolean;
  loading: boolean;
  error: string | null;
  loadingStep: string;
  // New multiplayer state
  scores: [number, number]; // [Player 1 score, Player 2 score]
  currentPlayer: 0 | 1;     // Index of current player
}
