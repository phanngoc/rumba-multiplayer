import { CellValue, GameBoard, GameDifficulty, PuzzleBoard, ImmutableBoard, PairConstraint, ConstraintType } from './game-types';
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
    
    // Generate pair constraints for the simple puzzle
    const constraints = this.generatePairConstraints(board, size, GameDifficulty.MEDIUM);
    
    return {
      values: board,
      immutable,
      constraints
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
    
    // Generate pair constraints for adjacent cells
    const constraints = this.generatePairConstraints(solution, size, difficulty);
    
    return {
      values: puzzle,
      immutable,
      constraints
    };
  }

  private static generatePairConstraints(solution: GameBoard, size: number, difficulty: GameDifficulty = GameDifficulty.MEDIUM): PairConstraint[] {
    const constraints: PairConstraint[] = [];
    let constraintId = 0;
    
    // Đếm số cell cố định trong solution
    const fixedCells = this.countFixedCells(solution);
    const totalCells = size * size;
    const fixedRatio = fixedCells / totalCells;
    
    // Tính toán số lượng constraints dựa trên size board và số cell cố định
    const totalAdjacentPairs = (size - 1) * size * 2; // (size-1)*size horizontal + (size-1)*size vertical
    
    // Điều chỉnh constraint rate dựa trên số cell cố định
    // Nhiều cell cố định = ít constraints cần thiết
    const baseConstraintRates = {
      [GameDifficulty.EASY]: 0.25,   // 25% of adjacent pairs
      [GameDifficulty.MEDIUM]: 0.4,  // 40% of adjacent pairs  
      [GameDifficulty.HARD]: 0.6     // 60% of adjacent pairs
    };
    
    // Giảm constraint rate nếu có nhiều cell cố định
    const adjustedRate = baseConstraintRates[difficulty] * (1 - fixedRatio * 0.3);
    const targetConstraints = Math.floor(totalAdjacentPairs * adjustedRate);
    
    // Đảm bảo có ít nhất một số constraints tối thiểu
    const minConstraints = Math.max(3, Math.floor(size * 0.5));
    const finalTargetConstraints = Math.max(minConstraints, targetConstraints);
    
    // Tạo danh sách tất cả các cặp cell kề nhau có thể tạo constraint
    const possibleConstraints: Array<{
      cell1: {row: number, col: number},
      cell2: {row: number, col: number},
      type: ConstraintType,
      priority: number
    }> = [];
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const currentValue = solution[row][col];
        
        // Kiểm tra cell bên phải (horizontal)
        if (col < size - 1) {
          const rightValue = solution[row][col + 1];
          const constraintType = this.determineConstraintType(currentValue, rightValue);
          
          if (constraintType) {
            const priority = this.calculateConstraintPriority(row, col, size, constraintType);
            possibleConstraints.push({
              cell1: { row, col },
              cell2: { row, col: col + 1 },
              type: constraintType,
              priority
            });
          }
        }
        
        // Kiểm tra cell bên dưới (vertical)
        if (row < size - 1) {
          const bottomValue = solution[row + 1][col];
          const constraintType = this.determineConstraintType(currentValue, bottomValue);
          
          if (constraintType) {
            const priority = this.calculateConstraintPriority(row, col, size, constraintType);
            possibleConstraints.push({
              cell1: { row, col },
              cell2: { row: row + 1, col },
              type: constraintType,
              priority
            });
          }
        }
      }
    }
    
    // Sắp xếp theo priority (cao hơn = quan trọng hơn)
    possibleConstraints.sort((a, b) => b.priority - a.priority);
    
    // Chọn constraints tốt nhất, đảm bảo cân bằng giữa EQ và NEQ
    const selectedConstraints = this.selectBalancedConstraints(possibleConstraints, finalTargetConstraints);
    
    // Tạo constraints cuối cùng
    for (const constraint of selectedConstraints) {
      constraints.push({
        id: `constraint_${constraintId++}`,
        type: constraint.type,
        cell1: constraint.cell1,
        cell2: constraint.cell2
      });
    }
    
    // Debug: Log constraint statistics
    if (process.env.NODE_ENV === 'development') {
      const eqCount = constraints.filter(c => c.type === ConstraintType.EQ).length;
      const neqCount = constraints.filter(c => c.type === ConstraintType.NEQ).length;
      console.log(`Generated ${constraints.length} constraints (EQ: ${eqCount}, NEQ: ${neqCount}) for ${size}x${size} board with ${fixedCells} fixed cells`);
    }
    
    return constraints;
  }

  private static determineConstraintType(value1: CellValue, value2: CellValue): ConstraintType | null {
    // Chỉ tạo constraint nếu cả hai cell đều không rỗng
    if (value1 === CellValue.EMPTY || value2 === CellValue.EMPTY) {
      return null;
    }
    
    // Tạo constraint dựa trên giá trị của cell
    if (value1 === value2) {
      return ConstraintType.EQ; // Hai cell giống nhau
    } else {
      return ConstraintType.NEQ; // Hai cell khác nhau
    }
  }

  private static calculateConstraintPriority(row: number, col: number, size: number, type: ConstraintType): number {
    let priority = 0;
    
    // Ưu tiên constraints ở vị trí trung tâm (quan trọng hơn)
    const centerDistance = Math.abs(row - (size - 1) / 2) + Math.abs(col - (size - 1) / 2);
    const maxDistance = size - 1;
    const centerPriority = (maxDistance - centerDistance) / maxDistance * 50;
    priority += centerPriority;
    
    // Ưu tiên constraints ở góc và cạnh (tạo điểm neo)
    if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
      priority += 30;
    }
    
    // Ưu tiên NEQ constraints hơn EQ (thường khó hơn)
    if (type === ConstraintType.NEQ) {
      priority += 20;
    } else {
      priority += 10;
    }
    
    // Thêm randomness để tạo sự đa dạng
    priority += Math.random() * 20;
    
    return priority;
  }

  private static selectBalancedConstraints(
    possibleConstraints: Array<{
      cell1: {row: number, col: number},
      cell2: {row: number, col: number},
      type: ConstraintType,
      priority: number
    }>,
    targetCount: number
  ): Array<{
    cell1: {row: number, col: number},
    cell2: {row: number, col: number},
    type: ConstraintType,
    priority: number
  }> {
    const selected: typeof possibleConstraints = [];
    const usedCells = new Set<string>();
    
    // Tách EQ và NEQ constraints
    const eqConstraints = possibleConstraints.filter(c => c.type === ConstraintType.EQ);
    const neqConstraints = possibleConstraints.filter(c => c.type === ConstraintType.NEQ);
    
    // Cân bằng tỷ lệ EQ:NEQ khoảng 40:60 (NEQ khó hơn nên nhiều hơn)
    const eqTarget = Math.floor(targetCount * 0.4);
    const neqTarget = targetCount - eqTarget;
    
    // Chọn EQ constraints
    let eqSelected = 0;
    for (const constraint of eqConstraints) {
      if (eqSelected >= eqTarget) break;
      
      const cell1Key = `${constraint.cell1.row},${constraint.cell1.col}`;
      const cell2Key = `${constraint.cell2.row},${constraint.cell2.col}`;
      
      // Tránh chọn constraints có cell đã được sử dụng
      if (!usedCells.has(cell1Key) && !usedCells.has(cell2Key)) {
        selected.push(constraint);
        usedCells.add(cell1Key);
        usedCells.add(cell2Key);
        eqSelected++;
      }
    }
    
    // Chọn NEQ constraints
    let neqSelected = 0;
    for (const constraint of neqConstraints) {
      if (neqSelected >= neqTarget) break;
      
      const cell1Key = `${constraint.cell1.row},${constraint.cell1.col}`;
      const cell2Key = `${constraint.cell2.row},${constraint.cell2.col}`;
      
      // Tránh chọn constraints có cell đã được sử dụng
      if (!usedCells.has(cell1Key) && !usedCells.has(cell2Key)) {
        selected.push(constraint);
        usedCells.add(cell1Key);
        usedCells.add(cell2Key);
        neqSelected++;
      }
    }
    
    // Nếu chưa đủ constraints, chọn thêm từ những cái còn lại
    if (selected.length < targetCount) {
      const remaining = possibleConstraints.filter(c => 
        !selected.includes(c) && 
        !usedCells.has(`${c.cell1.row},${c.cell1.col}`) &&
        !usedCells.has(`${c.cell2.row},${c.cell2.col}`)
      );
      
      for (const constraint of remaining) {
        if (selected.length >= targetCount) break;
        
        selected.push(constraint);
        usedCells.add(`${constraint.cell1.row},${constraint.cell1.col}`);
        usedCells.add(`${constraint.cell2.row},${constraint.cell2.col}`);
      }
    }
    
    return selected;
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

  // Helper method to count fixed cells in a board
  private static countFixedCells(board: GameBoard): number {
    let count = 0;
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] !== CellValue.EMPTY) {
          count++;
        }
      }
    }
    return count;
  }
}