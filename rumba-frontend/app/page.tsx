'use client';

import { useState, useEffect } from 'react';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import InviteModal from '@/components/InviteModal';
import JoinModal from '@/components/JoinModal';
import MultiplayerStatus from '@/components/MultiplayerStatus';
import { useGame } from '@/hooks/useGame';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { PuzzleGenerator } from '@/lib/puzzle-generator';
import { GameLogic } from '@/lib/game-logic';

export default function Home() {
  const {
    size,
    difficulty,
    currentBoard,
    gameState,
    hintPosition,
    isLoading,
    isCompleted,
    showFireworks,
    moveCount,
    opponentMoves,
    completionTime,
    elapsedTime,
    handleCellClick: originalCellClick,
    handleCellRightClick: originalCellRightClick,
    checkBoard,
    getHint,
    resetBoard,
    showSolution,
    generateNewPuzzle,
    handleSizeChange,
    handleDifficultyChange,
    setOpponentMoves
  } = useGame();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');


  const {
    user,
    currentGame,
    isConnected,
    players,
    winner,
    createGame,
    joinGame,
    sendMove,
    updateProgress,
    completeGame,
  } = useMultiplayer({
    onGameStart: (gameInfo) => {
      console.log('Game started:', gameInfo);
      if (gameInfo.puzzleJson) {
        // Load the multiplayer puzzle
        const puzzle = JSON.parse(gameInfo.puzzleJson);
        // Set the puzzle in the game hook (this would need to be implemented in useGame)
      }
    },
    onOpponentMove: (moveData) => {
      console.log('Opponent moved:', moveData);
    },
    onProgressUpdate: (progressData) => {
      console.log('Progress updated:', progressData);
    },
    onGameWon: (winData) => {
      console.log('Game won:', winData);
    },
    onError: (error) => {
      console.error('Multiplayer error:', error);
    },
  });

  // Check for join code in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('join');
      if (codeFromUrl) {
        setJoinCode(codeFromUrl);
        setShowJoinModal(true);
      }
    }
  }, []);

  // Enhanced cell click handlers that send moves to multiplayer
  const handleCellClick = (row: number, col: number) => {
    const previousValue = currentBoard[row][col];
    originalCellClick(row, col);
    
    // If in multiplayer game, send the move
    if (currentGame && isConnected) {
      // Calculate the new value based on the original logic
      let newValue;
      switch (previousValue) {
        case 0: // EMPTY
          newValue = 1; // X
          break;
        case 1: // X
          newValue = 2; // O
          break;
        case 2: // O
          newValue = 0; // EMPTY
          break;
        default:
          newValue = 1;
      }
      
      // Calculate remaining cells
      const newBoard = [...currentBoard];
      newBoard[row] = [...newBoard[row]];
      newBoard[row][col] = newValue;
      const remainingCells = GameLogic.countEmptyCells(newBoard);
      
      sendMove(row, col, newValue, newBoard, remainingCells);
    }
  };

  const handleCellRightClick = (row: number, col: number) => {
    const previousValue = currentBoard[row][col];
    originalCellRightClick(row, col);
    
    // If in multiplayer game, send the move
    if (currentGame && isConnected) {
      // Calculate the new value based on the original right-click logic
      let newValue;
      switch (previousValue) {
        case 0: // EMPTY
          newValue = 2; // O
          break;
        case 2: // O
          newValue = 1; // X
          break;
        case 1: // X
          newValue = 0; // EMPTY
          break;
        default:
          newValue = 2;
      }
      
      // Calculate remaining cells
      const newBoard = [...currentBoard];
      newBoard[row] = [...newBoard[row]];
      newBoard[row][col] = newValue;
      const remainingCells = GameLogic.countEmptyCells(newBoard);
      
      sendMove(row, col, newValue, newBoard, remainingCells);
    }
  };

  // Update opponent moves when receiving multiplayer data
  useEffect(() => {
    if (currentGame && players.length > 1) {
      const otherPlayers = players.filter(p => p.userId !== user?.userId);
      if (otherPlayers.length > 0) {
        const opponent = otherPlayers[0];
        if (opponent.remainingCells !== undefined) {
          // Calculate opponent's move count based on remaining cells
          const totalCells = size * size;
          const opponentMoveCount = totalCells - opponent.remainingCells;
          setOpponentMoves(opponentMoveCount);
        }
      }
    } else {
      setOpponentMoves(null);
    }
  }, [currentGame, players, user?.userId, size, setOpponentMoves]);

  // Multiplayer event handlers
  const handleInvitePlayer = async () => {
    if (currentGame) {
      // If already in a game, just show the invite modal
      setShowInviteModal(true);
    } else {
      try {
        // Create a new multiplayer game
        const puzzleBoard = PuzzleGenerator.generatePuzzle(size, difficulty);
        const solution = GameLogic.solve(puzzleBoard.values);
        if (solution) {
          const gameInfo = await createGame(size, puzzleBoard.values, solution);
          setShowInviteModal(true);
        }
      } catch (error) {
        console.error('Failed to create multiplayer game:', error);
      }
    }
  };

  const handleJoinGame = () => {
    setShowJoinModal(true);
  };

  const handleJoinGameConfirm = async (gameInfo: any) => {
    try {
      await joinGame(gameInfo);
      setShowJoinModal(false);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleCopyCode = () => {
    console.log('Code copied!');
  };

  // Check if game is complete and notify multiplayer
  useEffect(() => {
    if (gameState.isComplete && gameState.isValid && currentGame && isConnected) {
      completeGame();
    }
  }, [gameState.isComplete, gameState.isValid, currentGame, isConnected, completeGame]);

  // Convert players data for MultiplayerStatus component
  const multiplayerPlayers = players.map(p => ({
    userId: p.userId,
    nickname: p.nickname,
    remainingCells: p.remainingCells,
    isConnected: p.isConnected,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 font-medium">🧩 Creating puzzle...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 items-start justify-center max-w-7xl mx-auto">
          {/* Game Area - Center */}
          <div className="flex-1 flex flex-col items-center space-y-6">
            {/* Game Board */}
            <div className="flex justify-center">
              <GameBoard
                board={currentBoard}
                onCellClick={handleCellClick}
                onCellRightClick={handleCellRightClick}
                errors={gameState.errors}
                hintPosition={hintPosition}
                constraints={gameState.constraints}
                isCompleted={isCompleted}
                showFireworks={showFireworks}
                completionTime={completionTime}
                moveCount={moveCount}
                opponentMoves={opponentMoves}
                isMultiplayer={!!currentGame}
                difficulty={difficulty}
                size={size}
                onCompletionModalClose={() => {
                  // Handle completion modal close if needed
                }}
              />
            </div>

            
            {/* Game Controls Below Board */}
            <div className="w-full max-w-md">
              <GameControls
                size={size}
                difficulty={difficulty}
                isComplete={gameState.isComplete}
                isValid={gameState.isValid}
                onSizeChange={handleSizeChange}
                onDifficultyChange={handleDifficultyChange}
                onCheck={checkBoard}
                onHint={getHint}
                onReset={resetBoard}
                onSolution={showSolution}
                onNewGame={generateNewPuzzle}
                onInvitePlayer={handleInvitePlayer}
                onJoinGame={handleJoinGame}
                multiplayerEnabled={true}
                currentGameCode={currentGame?.code}
              />
            </div>
          </div>

          {/* Multiplayer Status - Right Side */}
          {currentGame && (
            <div className="w-80 sticky top-8">
              <MultiplayerStatus
                currentUserId={user?.userId || ''}
                players={multiplayerPlayers}
                gameCode={currentGame.code}
                winner={winner}
                isVisible={players.length > 1}
              />
            </div>
          )}
        </div>
      </div>

      {/* PWA-like Bottom Safe Area for Mobile */}
      <div className="h-4 bg-white/50"></div>

      {/* Modals */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        gameCode={currentGame?.code || ''}
        onCopyCode={handleCopyCode}
        isCreatingGame={false}
      />

      <JoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinGame={handleJoinGameConfirm}
        initialCode={joinCode}
      />
    </div>
  );
}
