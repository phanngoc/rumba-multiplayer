'use client';

import React, { useState, useRef } from 'react';
import { CellValue, GameBoard as GameBoardType, PairConstraint, ConstraintType } from '@/lib/game-types';

interface GameBoardProps {
  board: GameBoardType;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  errors?: string[];
  hintPosition?: { row: number; col: number } | null;
  constraints?: PairConstraint[];
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  onCellClick, 
  onCellRightClick, 
  errors = [],
  hintPosition,
  constraints = []
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

  const getConstraintIcon = (type: ConstraintType) => {
    switch (type) {
      case ConstraintType.EQ:
        return '=';
      case ConstraintType.NEQ:
        return '⚡';
      default:
        return '';
    }
  };


  // Create a matrix for cell positions and midpoints
  const createCellMatrix = () => {
    const cellSize = 100 / size;
    const matrix: { 
      cells: { x: number; y: number }[][], 
      midpoints: { x: number; y: number }[][]
    } = {
      cells: [],
      midpoints: []
    };

    // Calculate cell centers with precise positioning
    for (let row = 0; row < size; row++) {
      matrix.cells[row] = [];
      for (let col = 0; col < size; col++) {
        matrix.cells[row][col] = {
          x: (col * cellSize) + (cellSize / 2),
          y: (row * cellSize) + (cellSize / 2)
        };
      }
    }

    // Calculate midpoints between cells for better constraint positioning
    for (let row = 0; row < size; row++) {
      matrix.midpoints[row] = [];
      for (let col = 0; col < size; col++) {
        // For each cell, calculate potential midpoints with adjacent cells
        const currentCell = matrix.cells[row][col];
        
        // Find the best midpoint based on available adjacent cells
        let bestMidpoint = currentCell; // fallback to current cell
        
        // Check horizontal right
        if (col < size - 1) {
          const rightCell = matrix.cells[row][col + 1];
          bestMidpoint = {
            x: (currentCell.x + rightCell.x) / 2,
            y: (currentCell.y + rightCell.y) / 2
          };
        }
        // Check vertical bottom
        else if (row < size - 1) {
          const bottomCell = matrix.cells[row + 1][col];
          bestMidpoint = {
            x: (currentCell.x + bottomCell.x) / 2,
            y: (currentCell.y + bottomCell.y) / 2
          };
        }
        // Check diagonal bottom-right
        else if (row < size - 1 && col < size - 1) {
          const diagonalCell = matrix.cells[row + 1][col + 1];
          bestMidpoint = {
            x: (currentCell.x + diagonalCell.x) / 2,
            y: (currentCell.y + diagonalCell.y) / 2
          };
        }

        matrix.midpoints[row][col] = bestMidpoint;
      }
    }

    return matrix;
  };

  const renderConstraintIndicators = () => {
    if (!constraints || constraints.length === 0) {
      return null;
    }
    
    const cellMatrix = createCellMatrix();
    
    return constraints.map(constraint => {
      const { cell1, cell2, type, id } = constraint;
      
      // Validate cell positions
      if (cell1.row < 0 || cell1.row >= size || cell1.col < 0 || cell1.col >= size ||
          cell2.row < 0 || cell2.row >= size || cell2.col < 0 || cell2.col >= size) {
        console.warn(`Invalid constraint cell positions: ${JSON.stringify(constraint)}`);
        return null;
      }
      
      // Get cell positions from matrix
      const cell1Pos = cellMatrix.cells[cell1.row][cell1.col];
      const cell2Pos = cellMatrix.cells[cell2.row][cell2.col];
      
      // Calculate midpoint for constraint icon
      const midX = (cell1Pos.x + cell2Pos.x) / 2;
      const midY = (cell1Pos.y + cell2Pos.y) / 2;
      
      const icon = getConstraintIcon(type);
      const color = type === ConstraintType.EQ ? '#22c55e' : '#ef4444'; // Lighter colors
      
      // Check if cells are adjacent (horizontally, vertically, or diagonally)
      const rowDiff = Math.abs(cell2.row - cell1.row);
      const colDiff = Math.abs(cell2.col - cell1.col);
      const isAdjacent = (rowDiff <= 1 && colDiff <= 1) && (rowDiff + colDiff > 0);
      
      // Scale radius based on board size - much smaller
      const radius = size === 8 ? 2.5 : size === 6 ? 3 : 4;
      const fontSize = size === 8 ? '4' : size === 6 ? '5' : '6';
      
      // Adjust icon size based on distance for better visibility
      const adjustedRadius = isAdjacent ? radius : radius * 1.2;
      const adjustedFontSize = isAdjacent ? fontSize : (parseInt(fontSize) + 1).toString();
      
      // Always use the calculated midpoint for constraint icons
      const iconX = midX;
      const iconY = midY;
      
      return (
        <g key={id}>
          {/* Constraint icon background - smaller and lighter */}
          <circle
            cx={iconX}
            cy={iconY}
            r={adjustedRadius * 0.7}
            fill={color}
            opacity="0.6"
            stroke="white"
            strokeWidth="0.3"
          />
          {/* Constraint icon */}
          <text
            x={iconX}
            y={iconY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={adjustedFontSize}
            fontWeight="bold"
            fill="white"
            style={{ userSelect: 'none' }}
          >
            {icon}
          </text>
        </g>
      );
    }).filter(Boolean); // Remove null entries
  };

  const handleClick = (row: number, col: number) => {
    onCellClick(row, col);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-full">
      {/* Game Board */}
      <div className="w-full flex justify-center px-2">
        <div className="relative">
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
          
          {/* Constraint indicators overlay */}
          {constraints && constraints.length > 0 && (
            <div
              id="constraint-indicators-overlay"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <svg
                id="constraint-indicators-svg"
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
              >
                {renderConstraintIndicators()}
              </svg>
            </div>
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