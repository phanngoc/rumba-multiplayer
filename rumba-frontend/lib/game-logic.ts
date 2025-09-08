import { CellValue, GameBoard, Position } from './game-types';

export class GameLogic {
  static createEmptyBoard(size: number): GameBoard {
    return Array(size).fill(null).map(() => Array(size).fill(CellValue.EMPTY));
  }

  static copyBoard(board: GameBoard): GameBoard {
    return board.map(row => [...row]);
  }

  static validateBoard(board: GameBoard): { isValid: boolean; errors: string[] } {
    const size = board.length;
    const errors: string[] = [];
    let isValid = true;

    // Check rows
    for (let row = 0; row < size; row++) {
      const rowErrors = this.validateLine(board[row], `Row ${row + 1}`);
      errors.push(...rowErrors);
      if (rowErrors.length > 0) isValid = false;
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const column = board.map(row => row[col]);
      const colErrors = this.validateLine(column, `Column ${col + 1}`);
      errors.push(...colErrors);
      if (colErrors.length > 0) isValid = false;
    }

    // Check for duplicate rows
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        if (this.arraysEqual(board[i], board[j]) && !board[i].includes(CellValue.EMPTY)) {
          errors.push(`Rows ${i + 1} and ${j + 1} are identical`);
          isValid = false;
        }
      }
    }

    // Check for duplicate columns
    for (let i = 0; i < size; i++) {
      const col1 = board.map(row => row[i]);
      for (let j = i + 1; j < size; j++) {
        const col2 = board.map(row => row[j]);
        if (this.arraysEqual(col1, col2) && !col1.includes(CellValue.EMPTY)) {
          errors.push(`Columns ${i + 1} and ${j + 1} are identical`);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }

  private static validateLine(line: CellValue[], lineName: string): string[] {
    const errors: string[] = [];
    const size = line.length;
    const xCount = line.filter(cell => cell === CellValue.X).length;
    const oCount = line.filter(cell => cell === CellValue.O).length;
    const emptyCount = line.filter(cell => cell === CellValue.EMPTY).length;

    // Check for three consecutive identical values
    for (let i = 0; i < size - 2; i++) {
      if (line[i] !== CellValue.EMPTY && 
          line[i] === line[i + 1] && 
          line[i] === line[i + 2]) {
        errors.push(`${lineName}: Three consecutive ${line[i] === CellValue.X ? 'X' : 'O'}s at positions ${i + 1}-${i + 3}`);
      }
    }

    // Check count constraints (only if line is complete)
    if (emptyCount === 0) {
      if (xCount !== size / 2 || oCount !== size / 2) {
        errors.push(`${lineName}: Must have exactly ${size / 2} Xs and ${size / 2} Os`);
      }
    } else {
      // Check if we already have too many of one type
      if (xCount > size / 2) {
        errors.push(`${lineName}: Too many Xs (${xCount}/${size / 2})`);
      }
      if (oCount > size / 2) {
        errors.push(`${lineName}: Too many Os (${oCount}/${size / 2})`);
      }
    }

    return errors;
  }

  private static arraysEqual(a: CellValue[], b: CellValue[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  static isComplete(board: GameBoard): boolean {
    return board.every(row => row.every(cell => cell !== CellValue.EMPTY));
  }

  static canPlaceValue(board: GameBoard, row: number, col: number, value: CellValue): boolean {
    if (value === CellValue.EMPTY) return true;

    const newBoard = this.copyBoard(board);
    newBoard[row][col] = value;
    
    return this.validateBoard(newBoard).isValid;
  }

  // Constraint propagation - finds forced moves
  static propagateConstraints(board: GameBoard): GameBoard {
    const newBoard = this.copyBoard(board);
    const size = board.length;
    let changed = true;

    while (changed) {
      changed = false;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (newBoard[row][col] === CellValue.EMPTY) {
            const forcedValue = this.getForcedValue(newBoard, row, col);
            if (forcedValue !== CellValue.EMPTY) {
              newBoard[row][col] = forcedValue;
              changed = true;
            }
          }
        }
      }
    }

    return newBoard;
  }

  private static getForcedValue(board: GameBoard, row: number, col: number): CellValue {
    const size = board.length;
    
    // Check if placing X or O would violate constraints
    const canPlaceX = this.canPlaceValue(board, row, col, CellValue.X);
    const canPlaceO = this.canPlaceValue(board, row, col, CellValue.O);

    if (canPlaceX && !canPlaceO) return CellValue.X;
    if (!canPlaceX && canPlaceO) return CellValue.O;

    // Check patterns that force a value
    const rowLine = board[row];
    const colLine = board.map(r => r[col]);

    // Pattern XX? -> O or OO? -> X
    const forcedByRow = this.checkPatternForced(rowLine, col);
    if (forcedByRow !== CellValue.EMPTY) return forcedByRow;

    const forcedByCol = this.checkPatternForced(colLine, row);
    if (forcedByCol !== CellValue.EMPTY) return forcedByCol;

    // Check if row/column already has enough of one type
    const rowXCount = rowLine.filter(c => c === CellValue.X).length;
    const rowOCount = rowLine.filter(c => c === CellValue.O).length;
    
    if (rowXCount === size / 2) return CellValue.O;
    if (rowOCount === size / 2) return CellValue.X;

    const colXCount = colLine.filter(c => c === CellValue.X).length;
    const colOCount = colLine.filter(c => c === CellValue.O).length;
    
    if (colXCount === size / 2) return CellValue.O;
    if (colOCount === size / 2) return CellValue.X;

    return CellValue.EMPTY;
  }

  private static checkPatternForced(line: CellValue[], pos: number): CellValue {
    // Check XX? -> O pattern
    if (pos >= 2 && line[pos - 1] === CellValue.X && line[pos - 2] === CellValue.X) {
      return CellValue.O;
    }
    if (pos >= 1 && pos < line.length - 1 && line[pos - 1] === CellValue.X && line[pos + 1] === CellValue.X) {
      return CellValue.O;
    }
    if (pos < line.length - 2 && line[pos + 1] === CellValue.X && line[pos + 2] === CellValue.X) {
      return CellValue.O;
    }

    // Check OO? -> X pattern
    if (pos >= 2 && line[pos - 1] === CellValue.O && line[pos - 2] === CellValue.O) {
      return CellValue.X;
    }
    if (pos >= 1 && pos < line.length - 1 && line[pos - 1] === CellValue.O && line[pos + 1] === CellValue.O) {
      return CellValue.X;
    }
    if (pos < line.length - 2 && line[pos + 1] === CellValue.O && line[pos + 2] === CellValue.O) {
      return CellValue.X;
    }

    return CellValue.EMPTY;
  }

  // Simple solver using DFS with constraint propagation
  static solve(board: GameBoard): GameBoard | null {
    const propagated = this.propagateConstraints(board);
    
    if (!this.validateBoard(propagated).isValid) {
      return null;
    }

    if (this.isComplete(propagated)) {
      return propagated;
    }

    // Find first empty cell
    for (let row = 0; row < propagated.length; row++) {
      for (let col = 0; col < propagated.length; col++) {
        if (propagated[row][col] === CellValue.EMPTY) {
          // Try X first, then O
          for (const value of [CellValue.X, CellValue.O]) {
            if (this.canPlaceValue(propagated, row, col, value)) {
              const newBoard = this.copyBoard(propagated);
              newBoard[row][col] = value;
              const solution = this.solve(newBoard);
              if (solution) return solution;
            }
          }
          return null; // No valid placement found
        }
      }
    }

    return null;
  }

  // Get hint - finds a cell that can be filled with constraint propagation
  static getHint(board: GameBoard): Position | null {
    const propagated = this.propagateConstraints(board);
    
    // Find a cell that was filled by propagation
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board.length; col++) {
        if (board[row][col] === CellValue.EMPTY && propagated[row][col] !== CellValue.EMPTY) {
          return { row, col };
        }
      }
    }

    return null;
  }

  // Count empty cells in the board
  static countEmptyCells(board: GameBoard): number {
    let count = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board.length; col++) {
        if (board[row][col] === CellValue.EMPTY) {
          count++;
        }
      }
    }
    return count;
  }
}