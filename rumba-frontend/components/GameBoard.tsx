'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CellValue, GameBoard as GameBoardType, PairConstraint, ConstraintType } from '@/lib/game-types';
import FireworksAnimation from './FireworksAnimation';
import CompletionModal from './CompletionModal';

interface GameBoardProps {
  board: GameBoardType;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  errors?: string[];
  hintPosition?: { row: number; col: number } | null;
  constraints?: PairConstraint[];
  isCompleted?: boolean;
  showFireworks?: boolean;
  completionTime?: number | null;
  moveCount?: number;
  opponentMoves?: number | null;
  isMultiplayer?: boolean;
  difficulty?: string;
  size?: number;
  onCompletionModalClose?: () => void;
  onPlayNext?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  onCellClick, 
  onCellRightClick, 
  errors = [],
  hintPosition,
  constraints = [],
  isCompleted = false,
  showFireworks = false,
  completionTime = null,
  moveCount = 0,
  opponentMoves = null,
  isMultiplayer = false,
  difficulty = 'Medium',
  size = 6,
  onCompletionModalClose,
  onPlayNext
}) => {
  const boardSize = board.length;
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

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

  // Show completion modal when puzzle is completed
  React.useEffect(() => {
    if (isCompleted && !showCompletionModal) {
      setShowCompletionModal(true);
    }
  }, [isCompleted, showCompletionModal]);

  // Get container size for accurate coordinate calculations
  useEffect(() => {
    const updateContainerSize = () => {
      if (boardContainerRef.current) {
        const rect = boardContainerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Initial measurement
    updateContainerSize();

    // Update on resize
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, [boardSize, size]);

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    onCompletionModalClose?.();
  };

  const countXO = (cells: CellValue[]) => {
    const xCount = cells.filter(cell => cell === CellValue.X).length;
    const oCount = cells.filter(cell => cell === CellValue.O).length;
    return { xCount, oCount };
  };

  const getRowCount = (rowIndex: number) => {
    return countXO(board[rowIndex]);
  };

  const getColumnCount = (colIndex: number) => {
    const column = board.map(row => row[colIndex]);
    return countXO(column);
  };

  const getCellStyles = (row: number, col: number, value: CellValue) => {
    // Responsive cell size based on screen size and board size
    const sizeClasses = {
      4: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24', // Larger for 4x4
      6: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20', // Medium for 6x6
      8: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16'  // Smaller for 8x8
    };

    const cellSize = sizeClasses[boardSize as keyof typeof sizeClasses] || 'w-12 h-12';
    
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
    const textSize = textSizes[boardSize as keyof typeof textSizes] || 'text-xl';

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


  // Create a matrix for cell positions and midpoints using vw/vh-based calculations
  const createCellMatrix = () => {
    if (!containerSize) {
      // Fallback to estimated values if container size not available yet
      const paddingPercentage = size === 8 ? 1.5 : size === 6 ? 2 : 2.5;
      const gapPercentage = size === 8 ? 0.3 : size === 6 ? 0.4 : 0.5;
      const totalGapSpace = gapPercentage * (boardSize - 1);
      const availableWidth = 100 - (paddingPercentage * 2);
      const availableHeight = 100 - (paddingPercentage * 2);
      const cellSizeX = (availableWidth - totalGapSpace) / boardSize;
      const cellSizeY = (availableHeight - totalGapSpace) / boardSize;
      
      return {
        cells: Array(boardSize).fill(null).map((_, row) =>
          Array(boardSize).fill(null).map((_, col) => ({
            x: paddingPercentage + (col * (cellSizeX + gapPercentage)) + (cellSizeX / 2),
            y: paddingPercentage + (row * (cellSizeY + gapPercentage)) + (cellSizeY / 2)
          }))
        ),
        cellSizeX: cellSizeX,
        cellSizeY: cellSizeY,
        gapPercentageX: gapPercentage,
        gapPercentageY: gapPercentage
      };
    }

    // Calculate padding and gap in vw/vh units
    // CSS: p-3 sm:p-4 (0.75rem to 1rem), gap-1 sm:gap-2 (0.25rem to 0.5rem)
    // Convert to vw/vh: assume base font size 16px, viewport width ~375px (mobile) to 1920px (desktop)
    // For responsive: use smaller vw on mobile, larger on desktop
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const isMobile = viewportWidth < 640; // sm breakpoint
    
    // Padding: p-3 = 0.75rem ≈ 12px, p-4 = 1rem = 16px
    // Convert to vw: 12px / viewportWidth * 100, 16px / viewportWidth * 100
    const paddingPx = isMobile ? 12 : 16; // p-3 : p-4
    const paddingVw = (paddingPx / viewportWidth) * 100;
    
    // Gap: gap-1 = 0.25rem ≈ 4px, gap-2 = 0.5rem = 8px
    const gapPx = isMobile ? 4 : 8; // gap-1 : gap-2
    const gapVw = (gapPx / viewportWidth) * 100;
    
    // Convert to percentage of container for SVG viewBox (0 0 100 100)
    // Calculate separately for X (width) and Y (height)
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;
    
    // Padding percentages - separate for X and Y
    const paddingPercentageX = (paddingPx / containerWidth) * 100;
    const paddingPercentageY = (paddingPx / containerHeight) * 100;
    
    // Gap percentages - separate for X and Y
    const gapPercentageX = (gapPx / containerWidth) * 100;
    const gapPercentageY = (gapPx / containerHeight) * 100;
    
    // Total gap space - separate for X and Y
    const totalGapSpaceX = gapPercentageX * (boardSize - 1);
    const totalGapSpaceY = gapPercentageY * (boardSize - 1);
    
    // Available space - separate for X and Y
    const availableWidth = 100 - (paddingPercentageX * 2);
    const availableHeight = 100 - (paddingPercentageY * 2);
    
    // Cell sizes - separate for X and Y
    const cellSizeX = (availableWidth - totalGapSpaceX) / boardSize;
    const cellSizeY = (availableHeight - totalGapSpaceY) / boardSize;
    
    console.log(`[DEBUG] size:`, size);
    console.log(`[DEBUG] containerSize:`, containerSize);
    console.log(`[DEBUG] viewportWidth:`, viewportWidth);
    console.log(`[DEBUG] paddingPx:`, paddingPx, `paddingVw:`, paddingVw);
    console.log(`[DEBUG] paddingPercentageX:`, paddingPercentageX, `paddingPercentageY:`, paddingPercentageY);
    console.log(`[DEBUG] gapPx:`, gapPx, `gapVw:`, gapVw);
    console.log(`[DEBUG] gapPercentageX:`, gapPercentageX, `gapPercentageY:`, gapPercentageY);
    console.log(`[DEBUG] cellSizeX:`, cellSizeX, `cellSizeY:`, cellSizeY);
    console.log(`[DEBUG] boardSize:`, boardSize);
    
    const matrix: {
      cells: { x: number; y: number }[][],
      cellSizeX: number,
      cellSizeY: number,
      gapPercentageX: number,
      gapPercentageY: number
    } = {
      cells: [],
      cellSizeX: cellSizeX,
      cellSizeY: cellSizeY,
      gapPercentageX: gapPercentageX,
      gapPercentageY: gapPercentageY
    };

    // Calculate cell centers with precise positioning including padding offset and gaps
    // Use separate calculations for X and Y
    for (let row = 0; row < boardSize; row++) {
      matrix.cells[row] = [];
      for (let col = 0; col < boardSize; col++) {
        // Calculate position: padding + (index * (cellSize + gap)) + cellSize/2
        matrix.cells[row][col] = {
          x: paddingPercentageX + (col * (cellSizeX + gapPercentageX)) + (cellSizeX / 2),
          y: paddingPercentageY + (row * (cellSizeY + gapPercentageY)) + (cellSizeY / 2)
        };
      }
    }

    return matrix;
  };

  const renderConstraintIndicators = () => {
    if (!constraints || constraints.length === 0) {
      return null;
    }
    
    const cellMatrix = createCellMatrix();
    const cellSizeX = cellMatrix.cellSizeX;
    const cellSizeY = cellMatrix.cellSizeY;
    const gapPercentageX = cellMatrix.gapPercentageX;
    const gapPercentageY = cellMatrix.gapPercentageY;
    
    return constraints.map(constraint => {
      const { cell1, cell2, type, id } = constraint;
      
      // Validate cell positions
      if (cell1.row < 0 || cell1.row >= boardSize || cell1.col < 0 || cell1.col >= boardSize ||
          cell2.row < 0 || cell2.row >= boardSize || cell2.col < 0 || cell2.col >= boardSize) {
        console.warn(`Invalid constraint cell positions: ${JSON.stringify(constraint)}`);
        return null;
      }
      
      // Get cell positions from matrix
      const cell1Pos = cellMatrix.cells[cell1.row][cell1.col];
      const cell2Pos = cellMatrix.cells[cell2.row][cell2.col];
      
      // Determine constraint direction (horizontal or vertical)
      const isHorizontal = cell1.row === cell2.row; // Same row, different columns
      const isVertical = cell1.col === cell2.col; // Same column, different rows
      
      // Calculate icon position based on constraint direction
      // Icon should be placed exactly in the middle of the gap between two adjacent cells
      let iconX: number;
      let iconY: number;
      
      if (isHorizontal) {
        // Horizontal constraint: place in the middle of vertical gap between cells
        // Right edge of cell1 + half of gap = cell1Pos.x + cellSizeX/2 + gapPercentageX/2
        iconX = cell1Pos.x + (cellSizeX / 2) + (gapPercentageX / 2);
        // Y position is the same for both cells (same row)
        iconY = cell1Pos.y;
      } else if (isVertical) {
        // Vertical constraint: place in the middle of horizontal gap between cells
        // X position is the same for both cells (same column)
        iconX = cell1Pos.x;
        // Bottom edge of cell1 + half of gap = cell1Pos.y + cellSizeY/2 + gapPercentageY/2
        iconY = cell1Pos.y + (cellSizeY / 2) + (gapPercentageY / 2);
      } else {
        // Fallback: diagonal constraint (shouldn't happen based on puzzle generator)
        // Use midpoint for both
        iconX = (cell1Pos.x + cell2Pos.x) / 2;
        iconY = (cell1Pos.y + cell2Pos.y) / 2;
      }
      
      // Debug logs for constraint positioning
      console.log(`[DEBUG Constraint ${id}]`, {
        type,
        direction: isHorizontal ? 'horizontal' : isVertical ? 'vertical' : 'diagonal',
        cell1: { row: cell1.row, col: cell1.col, pos: cell1Pos },
        cell2: { row: cell2.row, col: cell2.col, pos: cell2Pos },
        cellSizeX,
        cellSizeY,
        gapPercentageX,
        gapPercentageY,
        iconPosition: { iconX, iconY }
      });
      
      const icon = getConstraintIcon(type);
      const color = type === ConstraintType.EQ ? '#16a34a' : '#dc2626'; // Darker, more visible colors
      
      // Smaller, more subtle constraint indicators
      const baseRadius = boardSize === 8 ? 2.0 : boardSize === 6 ? 2.5 : 3.0;
      const baseFontSize = boardSize === 8 ? '4' : boardSize === 6 ? '5' : '6';
      
      // Calculate cell size for better proportional scaling
      const approximateCellSize = boardSize === 8 ? 12.5 : boardSize === 6 ? 16.67 : 20; // Approximate cell size in percentage
      const scaleFactor = Math.min(approximateCellSize / 20, 0.8); // Smaller scale factor
      
      const adjustedRadius = baseRadius * scaleFactor;
      const adjustedFontSize = (parseInt(baseFontSize) * scaleFactor).toString();
      
      return (
        <g key={id}>
          {/* Constraint icon background - smaller and more subtle */}
          <circle
            cx={iconX}
            cy={iconY}
            r={adjustedRadius}
            fill={color}
            opacity="0.6"
            stroke="white"
            strokeWidth="0.3"
            filter="drop-shadow(0 1px 1px rgba(0,0,0,0.2))"
          />
          {/* Constraint icon - smaller and more subtle */}
          <text
            x={iconX}
            y={iconY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={adjustedFontSize}
            fontWeight="600"
            fill="white"
            style={{ 
              userSelect: 'none',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)'
            }}
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
      {/* Game Board with Counters */}
      <div className="w-full flex justify-center px-2">
        <div className="relative">
          {/* Column counters (top) */}
          <div 
            className="flex justify-center mb-1"
            style={{ 
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              display: 'grid',
              gap: size === 8 ? '0.5vw' : size === 6 ? '1vw' : '1.5vw',
              paddingLeft: size === 8 ? '1.5vw' : size === 6 ? '2vw' : '2.5vw',
              paddingRight: size === 8 ? '1.5vw' : size === 6 ? '2vw' : '2.5vw'
            }}
          >
            {Array.from({ length: size }, (_, colIndex) => {
              const { xCount, oCount } = getColumnCount(colIndex);
              return (
                <div 
                  key={`col-${colIndex}`}
                  className={`text-center text-xs font-medium text-gray-600 ${
                    size === 8 ? 'text-xs' : size === 6 ? 'text-sm' : 'text-base'
                  }`}
                >
                  ({xCount}/{oCount})
                </div>
              );
            })}
          </div>

          <div className="flex items-center">
            {/* Row counters (left) */}
            <div className="flex flex-col justify-center mr-1">
              {board.map((_, rowIndex) => {
                const { xCount, oCount } = getRowCount(rowIndex);
                const cellHeight = size === 8 ? 'h-10 sm:h-12 md:h-16' : size === 6 ? 'h-12 sm:h-16 md:h-20' : 'h-16 sm:h-20 md:h-24';
                return (
                  <div 
                    key={`row-${rowIndex}`}
                    className={`flex items-center justify-center text-xs font-medium text-gray-600 ${cellHeight} ${
                      size === 8 ? 'text-xs' : size === 6 ? 'text-sm' : 'text-base'
                    }`}
                    style={{ 
                      marginBottom: rowIndex < board.length - 1 ? (size === 8 ? '0.5vw' : size === 6 ? '1vw' : '1.5vw') : '0'
                    }}
                  >
                    ({xCount}/{oCount})
                  </div>
                );
              })}
            </div>

            {/* Game Board */}
            <div 
              ref={boardContainerRef}
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

            {/* Row counters (right) */}
            <div className="flex flex-col justify-center ml-1">
              {board.map((_, rowIndex) => {
                const { xCount, oCount } = getRowCount(rowIndex);
                const cellHeight = size === 8 ? 'h-10 sm:h-12 md:h-16' : size === 6 ? 'h-12 sm:h-16 md:h-20' : 'h-16 sm:h-20 md:h-24';
                return (
                  <div 
                    key={`row-right-${rowIndex}`}
                    className={`flex items-center justify-center text-xs font-medium text-gray-600 ${cellHeight} ${
                      size === 8 ? 'text-xs' : size === 6 ? 'text-sm' : 'text-base'
                    }`}
                    style={{ 
                      marginBottom: rowIndex < board.length - 1 ? (size === 8 ? '0.5vw' : size === 6 ? '1vw' : '1.5vw') : '0'
                    }}
                  >
                    ({xCount}/{oCount})
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column counters (bottom) */}
          <div 
            className="flex justify-center mt-1"
            style={{ 
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              display: 'grid',
              gap: size === 8 ? '0.5vw' : size === 6 ? '1vw' : '1.5vw',
              paddingLeft: size === 8 ? '1.5vw' : size === 6 ? '2vw' : '2.5vw',
              paddingRight: size === 8 ? '1.5vw' : size === 6 ? '2vw' : '2.5vw'
            }}
          >
            {Array.from({ length: size }, (_, colIndex) => {
              const { xCount, oCount } = getColumnCount(colIndex);
              return (
                <div 
                  key={`col-bottom-${colIndex}`}
                  className={`text-center text-xs font-medium text-gray-600 ${
                    size === 8 ? 'text-xs' : size === 6 ? 'text-sm' : 'text-base'
                  }`}
                >
                  ({xCount}/{oCount})
                </div>
              );
            })}
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
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
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

      {/* Fireworks Animation */}
      <FireworksAnimation 
        isActive={showFireworks} 
        duration={3000}
        onComplete={() => {
          // Fireworks will auto-hide after duration
        }}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={handleCompletionModalClose}
        completionTime={completionTime}
        moveCount={moveCount}
        opponentMoves={opponentMoves}
        isMultiplayer={isMultiplayer}
        difficulty={difficulty}
        size={size}
        onPlayNext={onPlayNext}
      />
    </div>
  );
};

export default GameBoard;