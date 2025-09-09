export enum CellValue {
  EMPTY = 0,
  X = 1,
  O = 2
}

export type GameBoard = CellValue[][];
export type ImmutableBoard = boolean[][];

export interface PuzzleBoard {
  values: GameBoard;
  immutable: ImmutableBoard;
}

export interface GameState {
  board: GameBoard;
  immutable?: ImmutableBoard;
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