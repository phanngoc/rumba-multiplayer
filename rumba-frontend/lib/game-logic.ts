import { CellValue, GameBoard, Position, PairConstraint, ConstraintType } from './game-types';

export class GameLogic {
  static createEmptyBoard(size: number): GameBoard {
    return Array(size).fill(null).map(() => Array(size).fill(CellValue.EMPTY));
  }

  static copyBoard(board: GameBoard): GameBoard {
    return board.map(row => [...row]);
  }

  static validateBoard(board: GameBoard, constraints?: PairConstraint[]): { isValid: boolean; errors: string[] } {
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

    // Check pair constraints
    if (constraints) {
      const constraintErrors = this.validateConstraints(board, constraints);
      errors.push(...constraintErrors);
      if (constraintErrors.length > 0) isValid = false;
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

  private static validateConstraints(board: GameBoard, constraints: PairConstraint[]): string[] {
    const errors: string[] = [];
    
    for (const constraint of constraints) {
      const { cell1, cell2, type } = constraint;
      const value1 = board[cell1.row][cell1.col];
      const value2 = board[cell2.row][cell2.col];
      
      // Skip validation if either cell is empty
      if (value1 === CellValue.EMPTY || value2 === CellValue.EMPTY) {
        continue;
      }
      
      const cellName1 = `(${cell1.row + 1},${cell1.col + 1})`;
      const cellName2 = `(${cell2.row + 1},${cell2.col + 1})`;
      
      if (type === ConstraintType.EQ) {
        if (value1 !== value2) {
          errors.push(`Constraint violation: ${cellName1} and ${cellName2} must be equal (=)`);
        }
      } else if (type === ConstraintType.NEQ) {
        if (value1 === value2) {
          errors.push(`Constraint violation: ${cellName1} and ${cellName2} must be different (⚡)`);
        }
      }
    }
    
    return errors;
  }

  static isComplete(board: GameBoard): boolean {
    return board.every(row => row.every(cell => cell !== CellValue.EMPTY));
  }

  static canPlaceValue(board: GameBoard, row: number, col: number, value: CellValue, constraints?: PairConstraint[]): boolean {
    if (value === CellValue.EMPTY) return true;

    const newBoard = this.copyBoard(board);
    newBoard[row][col] = value;
    
    return this.validateBoard(newBoard, constraints).isValid;
  }

  // Constraint propagation - finds forced moves
  static propagateConstraints(board: GameBoard, constraints?: PairConstraint[]): GameBoard {
    const newBoard = this.copyBoard(board);
    const size = board.length;
    let changed = true;

    while (changed) {
      changed = false;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (newBoard[row][col] === CellValue.EMPTY) {
            const forcedValue = this.getForcedValue(newBoard, row, col, constraints);
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

  private static getForcedValue(board: GameBoard, row: number, col: number, constraints?: PairConstraint[]): CellValue {
    const size = board.length;
    
    // Check if placing X or O would violate constraints
    const canPlaceX = this.canPlaceValue(board, row, col, CellValue.X, constraints);
    const canPlaceO = this.canPlaceValue(board, row, col, CellValue.O, constraints);

    if (canPlaceX && !canPlaceO) return CellValue.X;
    if (!canPlaceX && canPlaceO) return CellValue.O;

    // Check pair constraints for forced values
    if (constraints) {
      const constraintForced = this.checkConstraintForced(board, row, col, constraints);
      if (constraintForced !== CellValue.EMPTY) return constraintForced;
    }

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

  private static checkConstraintForced(board: GameBoard, row: number, col: number, constraints: PairConstraint[]): CellValue {
    for (const constraint of constraints) {
      const { cell1, cell2, type } = constraint;
      
      // Check if this cell is part of a constraint
      let thisCell: Position | null = null;
      let otherCell: Position | null = null;
      
      if (cell1.row === row && cell1.col === col) {
        thisCell = cell1;
        otherCell = cell2;
      } else if (cell2.row === row && cell2.col === col) {
        thisCell = cell2;
        otherCell = cell1;
      }
      
      if (thisCell && otherCell) {
        const otherValue = board[otherCell.row][otherCell.col];
        
        // If the other cell has a value, we can determine this cell's value
        if (otherValue !== CellValue.EMPTY) {
          if (type === ConstraintType.EQ) {
            return otherValue; // Must be the same
          } else if (type === ConstraintType.NEQ) {
            return otherValue === CellValue.X ? CellValue.O : CellValue.X; // Must be different
          }
        }
      }
    }
    
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
  static solve(board: GameBoard, constraints?: PairConstraint[]): GameBoard | null {
    const propagated = this.propagateConstraints(board, constraints);
    
    if (!this.validateBoard(propagated, constraints).isValid) {
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
            if (this.canPlaceValue(propagated, row, col, value, constraints)) {
              const newBoard = this.copyBoard(propagated);
              newBoard[row][col] = value;
              const solution = this.solve(newBoard, constraints);
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
  static getHint(board: GameBoard, constraints?: PairConstraint[]): Position | null {
    const propagated = this.propagateConstraints(board, constraints);
    
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

  // Generate random constraints for a solved board
  static generateConstraints(solvedBoard: GameBoard, numConstraints: number = 3): PairConstraint[] {
    const size = solvedBoard.length;
    const constraints: PairConstraint[] = [];
    const usedCells = new Set<string>();
    
    let attempts = 0;
    const maxAttempts = numConstraints * 10; // Prevent infinite loop
    
    while (constraints.length < numConstraints && attempts < maxAttempts) {
      attempts++;
      
      // Pick two random cells
      const row1 = Math.floor(Math.random() * size);
      const col1 = Math.floor(Math.random() * size);
      const row2 = Math.floor(Math.random() * size);
      const col2 = Math.floor(Math.random() * size);
      
      // Skip if same cell or cells already used
      if (row1 === row2 && col1 === col2) continue;
      
      const cell1Key = `${row1},${col1}`;
      const cell2Key = `${row2},${col2}`;
      
      if (usedCells.has(cell1Key) || usedCells.has(cell2Key)) continue;
      
      // Don't create constraints for cells that are too far apart
      const distance = Math.abs(row1 - row2) + Math.abs(col1 - col2);
      if (distance > size) continue;
      
      const value1 = solvedBoard[row1][col1];
      const value2 = solvedBoard[row2][col2];
      
      // Determine constraint type based on values
      const type = value1 === value2 ? ConstraintType.EQ : ConstraintType.NEQ;
      
      // Create constraint
      const constraint: PairConstraint = {
        id: `constraint_${constraints.length}`,
        type,
        cell1: { row: row1, col: col1 },
        cell2: { row: row2, col: col2 }
      };
      
      constraints.push(constraint);
      usedCells.add(cell1Key);
      usedCells.add(cell2Key);
    }
    
    return constraints;
  }
}