'use client';

import React, { useState, useRef } from 'react';
import { CellValue, GameBoard as GameBoardType } from '@/lib/game-types';

interface GameBoardProps {
  board: GameBoardType;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  errors?: string[];
  hintPosition?: { row: number; col: number } | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  onCellClick, 
  onCellRightClick, 
  errors = [],
  hintPosition
}) => {
  const size = board.length;
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const getCellContent = (value: CellValue) => {
    switch (value) {
      case CellValue.X:
        return 'X';
      case CellValue.O:
        return 'O';
      default:
        return '';
    }
  };

  const getCellIcon = (value: CellValue) => {
    switch (value) {
      case CellValue.X:
        return '❌';
      case CellValue.O:
        return '⭕';
      default:
        return '';
    }
  };

  const getCellStyles = (row: number, col: number, value: CellValue) => {
    // Responsive cell size based on screen size and board size
    const sizeClasses = {
      4: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24', // Larger for 4x4
      6: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20', // Medium for 6x6
      8: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16'  // Smaller for 8x8
    };

    const cellSize = sizeClasses[size as keyof typeof sizeClasses] || 'w-12 h-12';
    
    const baseStyles = `
      ${cellSize} border-2 border-gray-400 flex items-center justify-center 
      font-bold cursor-pointer transition-all duration-200
      select-none rounded-lg shadow-sm active:scale-95
      touch-manipulation
    `;

    // Text size based on board size
    const textSizes = {
      4: 'text-2xl sm:text-3xl md:text-4xl',
      6: 'text-xl sm:text-2xl md:text-3xl',
      8: 'text-lg sm:text-xl md:text-2xl'
    };
    const textSize = textSizes[size as keyof typeof textSizes] || 'text-xl';

    let colorStyles = '';
    switch (value) {
      case CellValue.X:
        colorStyles = 'text-blue-600 bg-blue-100 border-blue-300 hover:bg-blue-200 active:bg-blue-300';
        break;
      case CellValue.O:
        colorStyles = 'text-red-600 bg-red-100 border-red-300 hover:bg-red-200 active:bg-red-300';
        break;
      default:
        colorStyles = 'bg-white hover:bg-gray-100 active:bg-gray-200 border-gray-300';
    }

    let hintStyles = '';
    if (hintPosition && hintPosition.row === row && hintPosition.col === col) {
      hintStyles = 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse bg-yellow-100';
    }

    return `${baseStyles} ${colorStyles} ${textSize} ${hintStyles}`;
  };

  // Handle touch events for mobile
  const handleTouchStart = (row: number, col: number) => {
    const startTime = Date.now();
    setTouchStartTime(startTime);
    
    // Set up long press detection (500ms)
    touchTimer.current = setTimeout(() => {
      // Long press detected - trigger right click
      onCellRightClick(row, col);
    }, 500);
  };

  const handleTouchEnd = (row: number, col: number) => {
    const touchDuration = Date.now() - touchStartTime;
    
    // Clear the long press timer
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
    
    // If it was a short touch (less than 500ms), trigger normal click
    if (touchDuration < 500) {
      onCellClick(row, col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    onCellRightClick(row, col);
  };

  const handleClick = (row: number, col: number) => {
    onCellClick(row, col);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-full">
      {/* Game Board */}
      <div className="w-full flex justify-center px-2">
        <div 
          className={`
            game-board inline-grid gap-1 sm:gap-2 p-3 sm:p-4 
            bg-gradient-to-br from-gray-50 to-gray-100 
            rounded-xl shadow-lg border border-gray-200
            max-w-full overflow-hidden
          `}
          style={{ 
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            maxWidth: size === 8 ? '90vw' : size === 6 ? '85vw' : '80vw'
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`game-cell ${getCellStyles(rowIndex, colIndex, cell)}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleContextMenu(e, rowIndex, colIndex)}
                onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                onTouchEnd={() => handleTouchEnd(rowIndex, colIndex)}
                onTouchCancel={() => {
                  if (touchTimer.current) {
                    clearTimeout(touchTimer.current);
                    touchTimer.current = null;
                  }
                }}
                type="button"
                aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}: ${getCellContent(cell) || 'Empty'}`}
              >
                <span className="flex items-center justify-center w-full h-full">
                  {/* Show icons on mobile, text on desktop */}
                  <span className="hidden sm:inline">{getCellContent(cell)}</span>
                  <span className="sm:hidden text-2xl">{getCellIcon(cell) || '⬜'}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Mobile Touch Instructions */}
      <div className="text-center text-xs text-gray-600 px-4 sm:hidden">
        <p>👆 Tap: Empty → X → O</p>
        <p>👆 Hold: Empty → O → X</p>
      </div>

      {/* Desktop Instructions */}
      <div className="hidden sm:block text-center text-xs text-gray-600">
        <p>Left click: Empty → X → O | Right click: Empty → O → X</p>
      </div>

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold mb-2 text-sm">⚠️ Errors:</h4>
          <ul className="text-red-700 text-xs space-y-1">
            {errors.slice(0, 3).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {errors.length > 3 && (
              <li className="text-red-600">... and {errors.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameBoard;