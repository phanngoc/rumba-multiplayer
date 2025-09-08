'use client';

import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const {
    size,
    difficulty,
    currentBoard,
    gameState,
    hintPosition,
    isLoading,
    handleCellClick,
    handleCellRightClick,
    checkBoard,
    getHint,
    resetBoard,
    showSolution,
    generateNewPuzzle,
    handleSizeChange,
    handleDifficultyChange
  } = useGame();

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
      {/* Mobile-First Layout */}
      <div className="lg:hidden">
        {/* Mobile: Controls at top, board below */}
        <div className="p-4 space-y-6">
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
          />
          
          <GameBoard
            board={currentBoard}
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
            errors={gameState.errors}
            hintPosition={hintPosition}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8 items-start justify-center max-w-7xl mx-auto">
            {/* Game Controls - Left Side */}
            <div className="w-80 sticky top-8">
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
              />
            </div>

            {/* Game Board - Center */}
            <div className="flex-1 flex justify-center">
              <GameBoard
                board={currentBoard}
                onCellClick={handleCellClick}
                onCellRightClick={handleCellRightClick}
                errors={gameState.errors}
                hintPosition={hintPosition}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PWA-like Bottom Safe Area for Mobile */}
      <div className="lg:hidden h-4 bg-white/50"></div>
    </div>
  );
}
