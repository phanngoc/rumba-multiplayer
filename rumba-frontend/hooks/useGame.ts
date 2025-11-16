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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [opponentMoves, setOpponentMoves] = useState<number | null>(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);

  // Update game state when board changes
  const updateGameState = useCallback((board: GameBoard, immutable?: ImmutableBoard, newConstraints?: PairConstraint[]) => {
    setGameState(prevState => {
      const currentConstraints = newConstraints || prevState.constraints || [];
      const validation = GameLogic.validateBoard(board, currentConstraints);
      const isComplete = GameLogic.isComplete(board);
      
      // Check if puzzle is completed for the first time
      if (isComplete && !prevState.isComplete && !isCompleted) {
        const currentTime = Date.now();
        setCompletionTime(currentTime);
        setIsCompleted(true);
        setShowFireworks(true);
        
        // Auto-hide fireworks after 3 seconds
        setTimeout(() => {
          setShowFireworks(false);
        }, 3000);
      }
      
      return {
        board,
        immutable: immutable || prevState.immutable,
        constraints: currentConstraints,
        size: board.length,
        isComplete,
        isValid: validation.isValid,
        errors: validation.errors
      };
    });
    
  }, [isCompleted]);


  // Handle cell click (left click: Empty → X → O)
  const handleCellClick = useCallback((row: number, col: number) => {
    // Check if cell is immutable (cannot be edited)
    if (immutableCells[row][col]) {
      return; // Do nothing for immutable cells
    }
    
    // Start timer if not started
    if (startTime === null) {
      setStartTime(Date.now());
    }
    
    setCurrentBoard(prevBoard => {
      const newBoard = GameLogic.copyBoard(prevBoard);
      const currentValue = newBoard[row][col];
      
      // Cycle through values: Empty → X → O → Empty
      let newValue = currentValue;
      switch (currentValue) {
        case CellValue.EMPTY:
          newValue = CellValue.X;
          break;
        case CellValue.X:
          newValue = CellValue.O;
          break;
        case CellValue.O:
          newValue = CellValue.EMPTY;
          break;
      }
      
      newBoard[row][col] = newValue;
      updateGameState(newBoard);
      setHintPosition(null); // Clear hint when user makes a move
      
      // Increment move count
      setMoveCount(prev => prev + 1);
      
      return newBoard;
    });
  }, [updateGameState, immutableCells, startTime]);

  // Handle right click (right click: Empty → O → X)
  const handleCellRightClick = useCallback((row: number, col: number) => {
    // Check if cell is immutable (cannot be edited)
    if (immutableCells[row][col]) {
      return; // Do nothing for immutable cells
    }
    
    // Start timer if not started
    if (startTime === null) {
      setStartTime(Date.now());
    }
    
    setCurrentBoard(prevBoard => {
      const newBoard = GameLogic.copyBoard(prevBoard);
      const currentValue = newBoard[row][col];
      
      // Cycle through values: Empty → O → X → Empty
      let newValue = currentValue;
      switch (currentValue) {
        case CellValue.EMPTY:
          newValue = CellValue.O;
          break;
        case CellValue.O:
          newValue = CellValue.X;
          break;
        case CellValue.X:
          newValue = CellValue.EMPTY;
          break;
      }
      
      newBoard[row][col] = newValue;
      updateGameState(newBoard);
      setHintPosition(null); // Clear hint when user makes a move
      
      // Increment move count
      setMoveCount(prev => prev + 1);
      
      return newBoard;
    });
  }, [updateGameState, immutableCells, startTime]);

  // Check current board
  const checkBoard = useCallback(() => {
    updateGameState(currentBoard);
  }, [currentBoard, updateGameState]);

  // Get hint
  const getHint = useCallback(() => {
    setGameState(prevState => {
      const currentConstraints = prevState.constraints || [];
      const hint = GameLogic.getHint(currentBoard, currentConstraints);
      setHintPosition(hint);
      
      if (!hint) {
        // If no obvious hint, try to find any valid move
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (currentBoard[row][col] === CellValue.EMPTY) {
              if (GameLogic.canPlaceValue(currentBoard, row, col, CellValue.X, currentConstraints) ||
                  GameLogic.canPlaceValue(currentBoard, row, col, CellValue.O, currentConstraints)) {
                setHintPosition({ row, col });
                return prevState;
              }
            }
          }
        }
      }
      return prevState;
    });
  }, [currentBoard, size]);

  // Reset to original puzzle
  const resetBoard = useCallback(() => {
    setCurrentBoard(GameLogic.copyBoard(originalPuzzle));
    updateGameState(originalPuzzle);
    setHintPosition(null);
    setStartTime(null);
    setCompletionTime(null);
    setIsCompleted(false);
    setShowFireworks(false);
    setMoveCount(0);
  }, [originalPuzzle, updateGameState]);

  // Show solution
  const showSolution = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use setTimeout to prevent blocking the UI
      await new Promise(resolve => setTimeout(resolve, 10));
      
      setGameState(prevState => {
        const currentConstraints = prevState.constraints || [];
        const solution = GameLogic.solve(originalPuzzle, currentConstraints);
        if (solution) {
          setCurrentBoard(solution);
          updateGameState(solution);
        } else {
          console.error('No solution found for current puzzle');
        }
        return prevState;
      });
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

  // Generate new puzzle manually
  const generateNewPuzzle = useCallback(() => {
    // Trigger useEffect by changing size temporarily
    setSize(prevSize => prevSize);
  }, []);

  // Play next puzzle - create new puzzle with same size and difficulty
  const playNext = useCallback(() => {
    // Reset game state
    setHintPosition(null);
    setStartTime(null);
    setCompletionTime(null);
    setIsCompleted(false);
    setShowFireworks(false);
    setMoveCount(0);
    // Increment puzzleKey to trigger useEffect
    setPuzzleKey(prev => prev + 1);
  }, []);

  // Load multiplayer board from puzzleJson
  const loadMultiplayerBoard = useCallback((puzzle: GameBoard, boardSize: number, constraints?: PairConstraint[]) => {
    setIsLoading(true);

    // CRITICAL: Mark as multiplayer game FIRST to prevent auto-generation race condition
    setIsMultiplayerGame(true);

    try {
      // Set size
      setSize(boardSize);

      // Set original puzzle (deep copy to prevent reference issues)
      const puzzleCopy = GameLogic.copyBoard(puzzle);
      setOriginalPuzzle(puzzleCopy);

      // Set current board to puzzle (start from beginning with deep copy)
      setCurrentBoard(GameLogic.copyBoard(puzzleCopy));

      // Set immutable cells based on initial puzzle values
      // Cells with initial values (non-empty) are immutable
      const immutable: ImmutableBoard = puzzle.map(row =>
        row.map(cell => cell !== CellValue.EMPTY)
      );
      setImmutableCells(immutable);

      // Reset game state
      setHintPosition(null);
      setStartTime(null);
      setCompletionTime(null);
      setIsCompleted(false);
      setShowFireworks(false);
      setMoveCount(0);

      // Update game state with puzzle and constraints
      const validation = GameLogic.validateBoard(puzzleCopy, constraints);
      const isComplete = GameLogic.isComplete(puzzleCopy);

      setGameState({
        board: puzzleCopy,
        immutable,
        constraints: constraints || [],
        size: boardSize,
        isComplete,
        isValid: validation.isValid,
        errors: validation.errors
      });

      console.log('[loadMultiplayerBoard] Board loaded successfully:', {
        boardSize,
        hasConstraints: !!constraints,
        constraintsCount: constraints?.length || 0,
        puzzleHash: JSON.stringify(puzzleCopy).substring(0, 50) // Debug hash
      });
    } catch (error) {
      console.error('Failed to load multiplayer board:', error);
      // Reset multiplayer flag on error
      setIsMultiplayerGame(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new puzzle when size or difficulty changes
  // Skip if this is a multiplayer game (puzzle loaded from server)
  useEffect(() => {
    if (isMultiplayerGame) {
      return; // Don't auto-generate puzzle for multiplayer games
    }
    
    const generatePuzzle = async () => {
      setIsLoading(true);
      setHintPosition(null);
      
      // Reset completion state
      setStartTime(null);
      setCompletionTime(null);
      setIsCompleted(false);
      setShowFireworks(false);
      setMoveCount(0);
      
      try {
        // Use setTimeout to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let puzzle: GameBoard;
        let immutable: ImmutableBoard;
        let newConstraints: PairConstraint[] = [];
        
        try {
          const puzzleBoard = PuzzleGenerator.generatePuzzle(size, difficulty);
          puzzle = puzzleBoard.values;
          immutable = puzzleBoard.immutable;
          newConstraints = puzzleBoard.constraints || [];
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
        
        // Update game state with new constraints
        const validation = GameLogic.validateBoard(puzzle, newConstraints);
        const isComplete = GameLogic.isComplete(puzzle);
        
        setGameState({
          board: puzzle,
          immutable,
          constraints: newConstraints,
          size: puzzle.length,
          isComplete,
          isValid: validation.isValid,
          errors: validation.errors
        });
      } catch (error) {
        console.error('Failed to generate puzzle:', error);
        // Final fallback to empty board
        const emptyBoard = GameLogic.createEmptyBoard(size);
        const emptyImmutable = Array(size).fill(null).map(() => Array(size).fill(false));
        setOriginalPuzzle(emptyBoard);
        setImmutableCells(emptyImmutable);
        setCurrentBoard(emptyBoard);
        
        // Update game state with empty board
        const validation = GameLogic.validateBoard(emptyBoard, []);
        const isComplete = GameLogic.isComplete(emptyBoard);
        
        setGameState({
          board: emptyBoard,
          immutable: emptyImmutable,
          constraints: [],
          size: emptyBoard.length,
          isComplete,
          isValid: validation.isValid,
          errors: validation.errors
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    generatePuzzle();
  }, [size, difficulty, puzzleKey, isMultiplayerGame]);

  // Calculate completion time
  const getCompletionTime = useCallback(() => {
    if (startTime && completionTime) {
      return Math.round((completionTime - startTime) / 1000);
    }
    return null;
  }, [startTime, completionTime]);

  // Get current elapsed time
  const getElapsedTime = useCallback(() => {
    if (startTime && !completionTime) {
      return Math.round((Date.now() - startTime) / 1000);
    }
    return getCompletionTime();
  }, [startTime, completionTime, getCompletionTime]);

  return {
    // State
    size,
    difficulty,
    currentBoard,
    immutableCells,
    gameState,
    hintPosition,
    isLoading,
    isCompleted,
    showFireworks,
    moveCount,
    opponentMoves,
    completionTime: getCompletionTime(),
    elapsedTime: getElapsedTime(),
    
    // Actions
    handleCellClick,
    handleCellRightClick,
    checkBoard,
    getHint,
    resetBoard,
    showSolution,
    generateNewPuzzle,
    playNext,
    handleSizeChange,
    handleDifficultyChange,
    setOpponentMoves,
    loadMultiplayerBoard
  };
};