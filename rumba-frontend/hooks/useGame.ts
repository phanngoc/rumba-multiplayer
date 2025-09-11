'use client';

import { useState, useCallback, useEffect } from 'react';
import { CellValue, GameBoard, GameDifficulty, GameState, Position, ImmutableBoard, PairConstraint } from '@/lib/game-types';
import { GameLogic } from '@/lib/game-logic';
import { PuzzleGenerator } from '@/lib/puzzle-generator';

export const useGame = (initialSize: number = 6, initialDifficulty: GameDifficulty = GameDifficulty.MEDIUM) => {
  const [size, setSize] = useState(initialSize);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [currentBoard, setCurrentBoard] = useState<GameBoard>(() => 
    GameLogic.createEmptyBoard(initialSize)
  );
  const [originalPuzzle, setOriginalPuzzle] = useState<GameBoard>(() => 
    GameLogic.createEmptyBoard(initialSize)
  );
  const [immutableCells, setImmutableCells] = useState<ImmutableBoard>(() =>
    Array(initialSize).fill(null).map(() => Array(initialSize).fill(false))
  );
  const [gameState, setGameState] = useState<GameState>({
    board: GameLogic.createEmptyBoard(initialSize),
    immutable: Array(initialSize).fill(null).map(() => Array(initialSize).fill(false)),
    size: initialSize,
    isComplete: false,
    isValid: true,
    errors: []
  });
  const [hintPosition, setHintPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update game state when board changes
  const updateGameState = useCallback((board: GameBoard, immutable?: ImmutableBoard, constraints?: PairConstraint[]) => {
    const validation = GameLogic.validateBoard(board);
    const isComplete = GameLogic.isComplete(board);
    
    setGameState(prevState => ({
      board,
      immutable: immutable || prevState.immutable,
      constraints: constraints || prevState.constraints,
      size: board.length,
      isComplete,
      isValid: validation.isValid,
      errors: validation.errors
    }));
  }, []);

  // Generate new puzzle
  const generateNewPuzzle = useCallback(async () => {
    setIsLoading(true);
    setHintPosition(null);
    
    try {
      // Use setTimeout to prevent blocking the UI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let puzzle: GameBoard;
      let immutable: ImmutableBoard;
      let constraints: PairConstraint[] = [];
      
      try {
        const puzzleBoard = PuzzleGenerator.generatePuzzle(size, difficulty);
        puzzle = puzzleBoard.values;
        immutable = puzzleBoard.immutable;
        constraints = puzzleBoard.constraints || [];
      } catch (generatorError) {
        console.warn('Puzzle generator failed, creating simple puzzle:', generatorError);
        // Create a simple puzzle as fallback
        puzzle = GameLogic.createEmptyBoard(size);
        immutable = Array(size).fill(null).map(() => Array(size).fill(false));
        
        // Add some initial values for a playable puzzle
        for (let i = 0; i < Math.min(4, size); i++) {
          if (i < size && i + 1 < size) {
            puzzle[0][i] = (i % 2 === 0) ? CellValue.X : CellValue.O;
            immutable[0][i] = true;
          }
        }
      }
      
      setOriginalPuzzle(puzzle);
      setImmutableCells(immutable);
      setCurrentBoard(GameLogic.copyBoard(puzzle));
      updateGameState(puzzle, immutable, constraints);
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      // Final fallback to empty board
      const emptyBoard = GameLogic.createEmptyBoard(size);
      const emptyImmutable = Array(size).fill(null).map(() => Array(size).fill(false));
      setOriginalPuzzle(emptyBoard);
      setImmutableCells(emptyImmutable);
      setCurrentBoard(emptyBoard);
      updateGameState(emptyBoard, emptyImmutable, []);
    } finally {
      setIsLoading(false);
    }
  }, [size, difficulty, updateGameState]);

  // Handle cell click (left click: Empty → X → O)
  const handleCellClick = useCallback((row: number, col: number) => {
    // Check if cell is immutable (cannot be edited)
    if (immutableCells[row][col]) {
      return; // Do nothing for immutable cells
    }
    
    setCurrentBoard(prevBoard => {
      const newBoard = GameLogic.copyBoard(prevBoard);
      const currentValue = newBoard[row][col];
      
      // Cycle through values: Empty → X → O → Empty
      switch (currentValue) {
        case CellValue.EMPTY:
          newBoard[row][col] = CellValue.X;
          break;
        case CellValue.X:
          newBoard[row][col] = CellValue.O;
          break;
        case CellValue.O:
          newBoard[row][col] = CellValue.EMPTY;
          break;
      }
      
      updateGameState(newBoard);
      setHintPosition(null); // Clear hint when user makes a move
      return newBoard;
    });
  }, [updateGameState, immutableCells]);

  // Handle right click (right click: Empty → O → X)
  const handleCellRightClick = useCallback((row: number, col: number) => {
    // Check if cell is immutable (cannot be edited)
    if (immutableCells[row][col]) {
      return; // Do nothing for immutable cells
    }
    
    setCurrentBoard(prevBoard => {
      const newBoard = GameLogic.copyBoard(prevBoard);
      const currentValue = newBoard[row][col];
      
      // Cycle through values: Empty → O → X → Empty
      switch (currentValue) {
        case CellValue.EMPTY:
          newBoard[row][col] = CellValue.O;
          break;
        case CellValue.O:
          newBoard[row][col] = CellValue.X;
          break;
        case CellValue.X:
          newBoard[row][col] = CellValue.EMPTY;
          break;
      }
      
      updateGameState(newBoard);
      setHintPosition(null); // Clear hint when user makes a move
      return newBoard;
    });
  }, [updateGameState, immutableCells]);

  // Check current board
  const checkBoard = useCallback(() => {
    updateGameState(currentBoard);
  }, [currentBoard, updateGameState]);

  // Get hint
  const getHint = useCallback(() => {
    const hint = GameLogic.getHint(currentBoard);
    setHintPosition(hint);
    
    if (!hint) {
      // If no obvious hint, try to find any valid move
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (currentBoard[row][col] === CellValue.EMPTY) {
            if (GameLogic.canPlaceValue(currentBoard, row, col, CellValue.X) ||
                GameLogic.canPlaceValue(currentBoard, row, col, CellValue.O)) {
              setHintPosition({ row, col });
              return;
            }
          }
        }
      }
    }
  }, [currentBoard, size]);

  // Reset to original puzzle
  const resetBoard = useCallback(() => {
    setCurrentBoard(GameLogic.copyBoard(originalPuzzle));
    updateGameState(originalPuzzle);
    setHintPosition(null);
  }, [originalPuzzle, updateGameState]);

  // Show solution
  const showSolution = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use setTimeout to prevent blocking the UI
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const solution = GameLogic.solve(originalPuzzle);
      if (solution) {
        setCurrentBoard(solution);
        updateGameState(solution);
      } else {
        console.error('No solution found for current puzzle');
      }
    } finally {
      setIsLoading(false);
    }
    setHintPosition(null);
  }, [originalPuzzle, updateGameState]);

  // Handle size change
  const handleSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setHintPosition(null);
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDifficulty: GameDifficulty) => {
    setDifficulty(newDifficulty);
    setHintPosition(null);
  }, []);

  // Generate new puzzle when size or difficulty changes
  useEffect(() => {
    generateNewPuzzle();
  }, [generateNewPuzzle]);

  return {
    // State
    size,
    difficulty,
    currentBoard,
    immutableCells,
    gameState,
    hintPosition,
    isLoading,
    
    // Actions
    handleCellClick,
    handleCellRightClick,
    checkBoard,
    getHint,
    resetBoard,
    showSolution,
    generateNewPuzzle,
    handleSizeChange,
    handleDifficultyChange
  };
};