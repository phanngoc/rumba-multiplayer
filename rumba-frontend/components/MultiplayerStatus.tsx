'use client';

import { useState, useEffect } from 'react';
import { Users, Crown, Zap, Trophy, Circle } from 'lucide-react';

export interface PlayerProgress {
  userId: string;
  nickname: string;
  remainingCells: number;
  isConnected: boolean;
}

interface MultiplayerStatusProps {
  currentUserId: string;
  players: PlayerProgress[];
  gameCode?: string;
  winner?: {
    userId: string;
    nickname: string;
  } | null;
  isVisible: boolean;
}

export default function MultiplayerStatus({
  currentUserId,
  players,
  gameCode,
  winner,
  isVisible,
}: MultiplayerStatusProps) {
  const [animatedPlayers, setAnimatedPlayers] = useState<PlayerProgress[]>([]);

  useEffect(() => {
    setAnimatedPlayers(players);
  }, [players]);

  if (!isVisible || players.length <= 1) {
    return null;
  }

  const sortedPlayers = [...players].sort((a, b) => {
    // Current user first, then by remaining cells (ascending), then by nickname
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    if (a.remainingCells !== b.remainingCells) {
      return a.remainingCells - b.remainingCells;
    }
    return a.nickname.localeCompare(b.nickname);
  });

  const getPlayerRank = (player: PlayerProgress) => {
    const sortedByProgress = [...players].sort((a, b) => a.remainingCells - b.remainingCells);
    return sortedByProgress.findIndex(p => p.userId === player.userId) + 1;
  };

  const getProgressPercentage = (remainingCells: number, boardSize: number = 36) => {
    const totalCells = boardSize; // Assuming average board size, can be made dynamic
    const completed = Math.max(0, totalCells - remainingCells);
    return Math.min(100, (completed / totalCells) * 100);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">Multiplayer Race</h3>
          {gameCode && (
            <p className="text-xs text-gray-500">Game: {gameCode}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Circle className="w-2 h-2 text-green-500 fill-current" />
          {players.filter(p => p.isConnected).length} online
        </div>
      </div>

      {/* Winner Announcement */}
      {winner && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-800 text-sm">
                🎉 {winner.nickname} wins!
              </p>
              <p className="text-xs text-yellow-700">
                {winner.userId === currentUserId ? 'Congratulations!' : 'Better luck next time!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isCurrentUser = player.userId === currentUserId;
          const rank = getPlayerRank(player);
          const isLeading = rank === 1 && player.remainingCells < players.find(p => p.userId !== player.userId)?.remainingCells!;
          const progress = getProgressPercentage(player.remainingCells);

          return (
            <div
              key={player.userId}
              className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                isCurrentUser 
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                  : 'bg-gray-50 border-gray-200'
              } ${!player.isConnected ? 'opacity-60' : ''}`}
            >
              {/* Player Info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Rank/Status */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    isLeading ? 'bg-yellow-100 text-yellow-800' : 
                    isCurrentUser ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {isLeading ? <Crown className="w-3 h-3" /> : rank}
                  </div>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate text-sm ${
                      isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {player.nickname}
                      {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {player.remainingCells} cells left
                    </p>
                  </div>
                  
                  {/* Connection Status */}
                  <div className="flex items-center gap-1">
                    {!player.isConnected && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" title="Offline" />
                    )}
                    {player.isConnected && isLeading && (
                      <Zap className="w-3 h-3 text-yellow-500" title="Leading" />
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      isCurrentUser ? 'bg-blue-500' :
                      isLeading ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="absolute right-0 top-3 text-xs text-gray-500">
                  {Math.round(progress)}%
                </div>
              </div>

              {/* Leading indicator */}
              {isLeading && !winner && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                    LEADING
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          First to complete the puzzle wins! 🏁
        </p>
      </div>
    </div>
  );
}