'use client';

import { useState } from 'react';
import { X, Users, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { MultiplayerService, GameInfo } from '@/lib/multiplayer-service';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameInfo: GameInfo) => void;
  initialCode?: string;
}

export default function JoinModal({
  isOpen,
  onClose,
  onJoinGame,
  initialCode = '',
}: JoinModalProps) {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

  if (!isOpen) return null;

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(upperValue);
    setError('');
    setGameInfo(null);
  };

  const handleFindGame = async () => {
    if (code.length !== 6) {
      setError('Game code must be 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const foundGame = await MultiplayerService.findGameByCode(code);
      setGameInfo(foundGame);
    } catch (error: any) {
      setError(error.message || 'Failed to find game');
      setGameInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (gameInfo) {
      onJoinGame(gameInfo);
    }
  };

  const handleClose = () => {
    setCode(initialCode);
    setError('');
    setGameInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Join Game</h2>
              <p className="text-sm text-gray-500">Enter a game code to join</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Game Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Game Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Enter 6-digit code"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-center font-mono text-lg tracking-wider uppercase focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              maxLength={6}
              autoComplete="off"
            />
            <button
              onClick={handleFindGame}
              disabled={code.length !== 6 || isLoading}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium min-w-[80px]"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Find'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ask your friend for the 6-character game code
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Game Info */}
        {gameInfo && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-800 mb-2">Game Found!</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Board Size:</span> {gameInfo.boardSize}×{gameInfo.boardSize}</p>
                  <p><span className="font-medium">Created by:</span> {gameInfo.creator?.nickname || 'Unknown'}</p>
                  <p><span className="font-medium">Status:</span> {gameInfo.gameState}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!gameInfo && !error && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">How to join a game:</p>
                <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Get the 6-character game code from your friend</li>
                  <li>Enter the code above and click "Find"</li>
                  <li>Click "Join Game" to start playing together</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          {gameInfo && (
            <button
              onClick={handleJoinGame}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
            >
              Join Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}