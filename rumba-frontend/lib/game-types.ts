export enum CellValue {
  EMPTY = 0,
  X = 1,
  O = 2
}

export type GameBoard = CellValue[][];

export interface GameState {
  board: GameBoard;
  size: number;
  isComplete: boolean;
  isValid: boolean;
  errors: string[];
}

export interface Position {
  row: number;
  col: number;
}

export enum GameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}