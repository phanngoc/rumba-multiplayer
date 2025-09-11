'use client';

import React from 'react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  completionTime: number | null;
  moveCount: number;
  opponentMoves: number | null;
  isMultiplayer: boolean;
  difficulty: string;
  size: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  completionTime,
  moveCount,
  opponentMoves,
  isMultiplayer,
  difficulty,
  size
}) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPerformanceRating = (time: number, moves: number, size: number) => {
    const expectedMoves = size * size * 0.3; // Rough estimate
    const expectedTime = size * 10; // Rough estimate in seconds
    
    const moveEfficiency = moves <= expectedMoves ? 1 : expectedMoves / moves;
    const timeEfficiency = time <= expectedTime ? 1 : expectedTime / time;
    const efficiency = (moveEfficiency + timeEfficiency) / 2;
    
    if (efficiency >= 0.9) return { rating: 'Xuất sắc!', emoji: '🏆', color: 'text-yellow-600' };
    if (efficiency >= 0.7) return { rating: 'Tốt!', emoji: '⭐', color: 'text-green-600' };
    if (efficiency >= 0.5) return { rating: 'Khá!', emoji: '👍', color: 'text-blue-600' };
    return { rating: 'Cần cải thiện', emoji: '💪', color: 'text-gray-600' };
  };

  const performance = completionTime ? getPerformanceRating(completionTime, moveCount, size) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="text-4xl sm:text-6xl mb-2">🎉</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Chúc mừng!</h2>
            <p className="text-purple-100 text-sm sm:text-base">Bạn đã hoàn thành puzzle!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Performance Rating */}
          {performance && (
            <div className="text-center">
              <div className={`text-3xl sm:text-4xl mb-2 ${performance.color}`}>
                {performance.emoji}
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${performance.color}`}>
                {performance.rating}
              </h3>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Time */}
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1">⏱️</div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Thời gian</div>
              <div className="text-lg sm:text-xl font-bold text-gray-800">
                {completionTime ? formatTime(completionTime) : '--'}
              </div>
            </div>

            {/* Moves */}
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl mb-1">🎯</div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Số bước</div>
              <div className="text-lg sm:text-xl font-bold text-gray-800">{moveCount}</div>
            </div>
          </div>

          {/* Multiplayer Info */}
          {isMultiplayer && opponentMoves !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-xl sm:text-2xl">👥</div>
                  <div>
                    <div className="text-xs sm:text-sm text-blue-600 font-medium">Đối thủ</div>
                    <div className="text-base sm:text-lg font-bold text-blue-800">
                      {opponentMoves} bước
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${
                  moveCount < opponentMoves 
                    ? 'bg-green-100 text-green-800' 
                    : moveCount > opponentMoves
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {moveCount < opponentMoves ? 'Thắng!' : moveCount > opponentMoves ? 'Thua' : 'Hòa'}
                </div>
              </div>
            </div>
          )}

          {/* Puzzle Info */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-xl sm:text-2xl">🧩</div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600">Puzzle</div>
                  <div className="text-base sm:text-lg font-bold text-gray-800">
                    {size}x{size} • {difficulty}
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
            >
              Chơi tiếp
            </button>
            <button
              onClick={() => {
                onClose();
                // This will be handled by parent component
                window.location.reload();
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base"
            >
              Puzzle mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
