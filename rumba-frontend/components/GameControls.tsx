'use client';

import React, { useState } from 'react';
import { GameDifficulty } from '@/lib/game-types';

interface GameControlsProps {
  size: number;
  difficulty: GameDifficulty;
  isComplete: boolean;
  isValid: boolean;
  onSizeChange: (size: number) => void;
  onDifficultyChange: (difficulty: GameDifficulty) => void;
  onCheck: () => void;
  onHint: () => void;
  onReset: () => void;
  onSolution: () => void;
  onNewGame: () => void;
  onInvitePlayer?: () => void;
  onJoinGame?: () => void;
  multiplayerEnabled?: boolean;
  currentGameCode?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  size,
  difficulty,
  isComplete,
  isValid,
  onSizeChange,
  onDifficultyChange,
  onCheck,
  onHint,
  onReset,
  onSolution,
  onNewGame,
  onInvitePlayer,
  onJoinGame,
  multiplayerEnabled = true,
  currentGameCode,
}) => {
  const [showRules, setShowRules] = useState(false);
  
  const sizeOptions = [4, 6, 8];
  const difficultyOptions = [
    { value: GameDifficulty.EASY, label: '😊 Easy', icon: '🟢' },
    { value: GameDifficulty.MEDIUM, label: '😐 Medium', icon: '🟡' },
    { value: GameDifficulty.HARD, label: '😤 Hard', icon: '🔴' },
  ];

  const getCurrentDifficultyIcon = () => {
    const current = difficultyOptions.find(d => d.value === difficulty);
    return current?.icon || '🟡';
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-xl lg:rounded-xl lg:mb-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-1">🧩 Rumba Puzzle</h1>
          {isComplete && (
            <div className={`text-sm font-semibold ${isValid ? 'text-green-200' : 'text-red-200'}`}>
              {isValid ? '🎉 Perfect! Puzzle solved!' : '❌ Check for errors'}
            </div>
          )}
        </div>

        {/* Quick Settings Row */}
        <div className="flex items-center justify-between mt-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>📏</span>
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="bg-white/20 text-white rounded-lg px-2 py-1 text-sm border-0 focus:outline-none focus:bg-white/30"
            >
              {sizeOptions.map((s) => (
                <option key={s} value={s} className="text-gray-800">
                  {s}×{s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>{getCurrentDifficultyIcon()}</span>
            <select
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as GameDifficulty)}
              className="bg-white/20 text-white rounded-lg px-2 py-1 text-sm border-0 focus:outline-none focus:bg-white/30"
            >
              {difficultyOptions.map((d) => (
                <option key={d.value} value={d.value} className="text-gray-800">
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Game Actions - Mobile Optimized */}
      <div className="bg-white rounded-b-xl lg:rounded-xl shadow-lg p-4 space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCheck}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 font-medium shadow-md active:scale-95"
          >
            <span>✅</span>
            <span>Check</span>
          </button>
          
          <button
            onClick={onHint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 active:bg-yellow-700 transition-all duration-200 font-medium shadow-md active:scale-95"
          >
            <span>💡</span>
            <span>Hint</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-all duration-200 text-sm shadow-md active:scale-95"
          >
            <span>🔄</span>
            <span>Reset</span>
          </button>
          
          <button
            onClick={onSolution}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-all duration-200 text-sm shadow-md active:scale-95"
          >
            <span>🔍</span>
            <span>Solution</span>
          </button>
        </div>

        {/* New Game - Prominent */}
        <button
          onClick={onNewGame}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 transition-all duration-200 font-bold shadow-lg active:scale-95"
        >
          <span>🎮</span>
          <span>New Game</span>
        </button>

        {/* Multiplayer Actions */}
        {multiplayerEnabled && (
          <div className="space-y-3">
            <div className="text-center text-sm font-medium text-gray-600 flex items-center justify-center gap-2">
              <span>👥</span>
              <span>Multiplayer</span>
            </div>
            
            {currentGameCode ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    🎯 Playing: {currentGameCode}
                  </p>
                  <button
                    onClick={onInvitePlayer}
                    className="text-sm text-green-600 hover:text-green-700 underline"
                  >
                    Share with friends
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onInvitePlayer}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 text-sm shadow-md active:scale-95"
                >
                  <span>📤</span>
                  <span>Invite</span>
                </button>
                
                <button
                  onClick={onJoinGame}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-all duration-200 text-sm shadow-md active:scale-95"
                >
                  <span>📥</span>
                  <span>Join</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rules Toggle */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 text-sm"
        >
          <span>📖</span>
          <span>{showRules ? 'Hide Rules' : 'Show Rules'}</span>
          <span className={`transform transition-transform ${showRules ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Collapsible Rules */}
        {showRules && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2 border border-gray-200">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              <span>Game Rules:</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-start gap-2">
                <span>⚖️</span>
                <span>Each row/column: exactly {size/2} ❌ and {size/2} ⭕</span>
              </div>
              <div className="flex items-start gap-2">
                <span>🚫</span>
                <span>No 3 consecutive identical symbols</span>
              </div>
              <div className="flex items-start gap-2">
                <span>🔄</span>
                <span>No identical rows or columns</span>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-300">
                <div className="font-medium text-gray-800 mb-1">Controls:</div>
                <div className="sm:hidden space-y-1">
                  <div>👆 <strong>Tap:</strong> Empty → ❌ → ⭕</div>
                  <div>👆 <strong>Hold:</strong> Empty → ⭕ → ❌</div>
                </div>
                <div className="hidden sm:block space-y-1">
                  <div>🖱️ <strong>Left click:</strong> Empty → X → O</div>
                  <div>🖱️ <strong>Right click:</strong> Empty → O → X</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControls;