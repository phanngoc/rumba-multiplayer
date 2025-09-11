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
  constraints?: PairConstraint[];
}

export interface Position {
  row: number;
  col: number;
}

export enum ConstraintType {
  EQ = 'EQ',   // Equal (=)
  NEQ = 'NEQ'  // Not Equal (⚡)
}

export interface PairConstraint {
  id: string;
  type: ConstraintType;
  cell1: Position;
  cell2: Position;
}

export interface GameState {
  board: GameBoard;
  immutable?: ImmutableBoard;
  constraints?: PairConstraint[];
  size: number;
  isComplete: boolean;
  isValid: boolean;
  errors: string[];
}

export enum GameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}