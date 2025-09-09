import { CellValue, GameBoard, GameDifficulty, PuzzleBoard, ImmutableBoard } from './game-types';
import { GameLogic } from './game-logic';

export class PuzzleGenerator {
  static generatePuzzle(size: number, difficulty: GameDifficulty = GameDifficulty.MEDIUM): PuzzleBoard {
    // Try multiple times to generate a puzzle
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Generate a complete valid solution
        const solution = this.generateCompleteSolution(size);
        if (solution) {
          // Remove cells to create puzzle
          return this.createPuzzleFromSolution(solution, difficulty);
        }
      } catch (error) {
        console.warn(`Puzzle generation attempt ${attempt + 1} failed:`, error);
      }
    }
    
    // Fallback: return a simple puzzle pattern
    return this.generateSimplePuzzle(size);
  }

  private static generateCompleteSolution(size: number): GameBoard | null {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const board = GameLogic.createEmptyBoard(size);
      const solution = this.fillBoardRandomlyWithTimeout(board, 1000); // 1 second timeout
      if (solution) {
        return solution;
      }
    }
    
    return null;
  }

  private static fillBoardRandomlyWithTimeout(board: GameBoard, timeoutMs: number): GameBoard | null {
    const startTime = Date.now();
    
    const fillRecursive = (currentBoard: GameBoard): GameBoard | null => {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        return null;
      }
      
      const size = currentBoard.length;
      
      // Find first empty cell
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (currentBoard[row][col] === CellValue.EMPTY) {
            // Shuffle values to try
            const values = [CellValue.X, CellValue.O].sort(() => Math.random() - 0.5);
            
            for (const value of values) {
              if (GameLogic.canPlaceValue(currentBoard, row, col, value)) {
                const newBoard = GameLogic.copyBoard(currentBoard);
                newBoard[row][col] = value;
                
                // Apply constraint propagation
                const propagated = GameLogic.propagateConstraints(newBoard);
                
                if (GameLogic.validateBoard(propagated).isValid) {
                  const solution = fillRecursive(propagated);
                  if (solution) return solution;
                }
              }
            }
            return null; // No valid value found
          }
        }
      }
      
      // Board is complete, validate it
      const validation = GameLogic.validateBoard(currentBoard);
      return validation.isValid ? currentBoard : null;
    };
    
    return fillRecursive(board);
  }

  // Fallback simple puzzle generator
  private static generateSimplePuzzle(size: number): PuzzleBoard {
    const board = GameLogic.createEmptyBoard(size);
    const immutable = this.createEmptyImmutableBoard(size);
    
    // Create a simple alternating pattern for part of the board
    for (let row = 0; row < Math.min(2, size); row++) {
      for (let col = 0; col < size; col++) {
        if ((row + col) % 2 === 0) {
          board[row][col] = CellValue.X;
          immutable[row][col] = true;
        } else {
          board[row][col] = CellValue.O;
          immutable[row][col] = true;
        }
      }
    }
    
    // Add a few more strategic placements
    if (size >= 4) {
      board[size - 1][0] = CellValue.O;
      board[size - 1][1] = CellValue.X;
      immutable[size - 1][0] = true;
      immutable[size - 1][1] = true;
    }
    
    return {
      values: board,
      immutable
    };
  }

  private static createPuzzleFromSolution(solution: GameBoard, difficulty: GameDifficulty): PuzzleBoard {
    const puzzle = GameLogic.copyBoard(solution);
    const immutable = this.createEmptyImmutableBoard(solution.length);
    const size = solution.length;
    const totalCells = size * size;
    
    // Determine how many cells to remove based on difficulty
    const removalRates = {
      [GameDifficulty.EASY]: 0.3,
      [GameDifficulty.MEDIUM]: 0.5,
      [GameDifficulty.HARD]: 0.65
    };
    
    const cellsToRemove = Math.floor(totalCells * removalRates[difficulty]);
    
    // Create list of all positions
    const positions: Array<{row: number, col: number}> = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        positions.push({ row, col });
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Simple removal without unique solution checking (for better performance)
    let removed = 0;
    for (const pos of positions) {
      if (removed >= cellsToRemove) break;
      
      // Skip some cells randomly to make pattern less uniform
      if (Math.random() < 0.8) { // 80% chance to remove
        puzzle[pos.row][pos.col] = CellValue.EMPTY;
        removed++;
      }
    }
    
    // Mark remaining cells as immutable (disabled)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (puzzle[row][col] !== CellValue.EMPTY) {
          immutable[row][col] = true;
        }
      }
    }
    
    return {
      values: puzzle,
      immutable
    };
  }

  // Generate multiple puzzles for testing
  static generateMultiplePuzzles(size: number, count: number, difficulty: GameDifficulty = GameDifficulty.MEDIUM): PuzzleBoard[] {
    const puzzles: PuzzleBoard[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const puzzle = this.generatePuzzle(size, difficulty);
        puzzles.push(puzzle);
      } catch (error) {
        console.warn(`Failed to generate puzzle ${i + 1}:`, error);
        // Add a simple puzzle as fallback
        puzzles.push(this.generateSimplePuzzle(size));
      }
    }

    return puzzles;
  }

  // Helper method to create empty immutable board
  private static createEmptyImmutableBoard(size: number): ImmutableBoard {
    return Array(size).fill(null).map(() => Array(size).fill(false));
  }
}