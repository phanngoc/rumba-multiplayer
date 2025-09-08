'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MultiplayerService, GameInfo, MultiplayerEvents } from '@/lib/multiplayer-service';
import { UserService, User } from '@/lib/user-service';
import { GameBoard } from '@/lib/game-types';

export interface UseMultiplayerOptions {
  onGameStart?: (gameInfo: GameInfo) => void;
  onPlayerJoined?: (playerInfo: any) => void;
  onPlayerLeft?: (playerInfo: any) => void;
  onOpponentMove?: (moveData: any) => void;
  onProgressUpdate?: (progressData: any) => void;
  onGameWon?: (winData: any) => void;
  onError?: (error: string) => void;
}

export interface PlayerProgress {
  userId: string;
  nickname: string;
  remainingCells: number;
  isConnected: boolean;
}

export function useMultiplayer(options: UseMultiplayerOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<GameInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<PlayerProgress[]>([]);
  const [winner, setWinner] = useState<{ userId: string; nickname: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const multiplayerService = useRef(new MultiplayerService());
  const userInfoCache = useRef<Map<string, { nickname: string }>>(new Map());

  // Initialize user on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userData = await UserService.getOrCreateUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        options.onError?.('Failed to initialize user');
      }
    };

    initializeUser();
  }, []);

  // Setup multiplayer events
  useEffect(() => {
    if (!user) return;

    const events: MultiplayerEvents = {
      onPlayerJoined: (data) => {
        console.log('Player joined:', data);
        // Update players list
        const newPlayers = data.players.map(userId => {
          const cached = userInfoCache.current.get(userId);
          return {
            userId,
            nickname: cached?.nickname || (userId === data.userId ? data.nickname : 'Player'),
            remainingCells: data.playerProgress[userId] || 0,
            isConnected: true,
          };
        });
        
        // Cache the new player's info
        userInfoCache.current.set(data.userId, { nickname: data.nickname });
        
        setPlayers(newPlayers);
        options.onPlayerJoined?.(data);
      },

      onPlayerLeft: (data) => {
        console.log('Player left:', data);
        setPlayers(prev => prev.map(p => 
          p.userId === data.userId ? { ...p, isConnected: false } : p
        ).filter(p => data.remainingPlayers.includes(p.userId) || p.userId === user.userId));
        options.onPlayerLeft?.(data);
      },

      onOpponentMove: (data) => {
        console.log('Opponent move:', data);
        // Update player progress
        setPlayers(prev => prev.map(p => ({
          ...p,
          remainingCells: data.playerProgress[p.userId] || p.remainingCells,
        })));
        options.onOpponentMove?.(data);
      },

      onProgressUpdate: (data) => {
        console.log('Progress update:', data);
        setPlayers(prev => prev.map(p => ({
          ...p,
          remainingCells: data.playerProgress[p.userId] || p.remainingCells,
        })));
        options.onProgressUpdate?.(data);
      },

      onGameWon: (data) => {
        console.log('Game won:', data);
        setWinner({ userId: data.winnerId, nickname: data.winnerNickname });
        options.onGameWon?.(data);
      },

      onError: (data) => {
        console.error('Multiplayer error:', data);
        options.onError?.(data.message);
      },
    };

    multiplayerService.current.connect(events);
    setIsConnected(true);

    return () => {
      multiplayerService.current.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  const createGame = useCallback(async (boardSize: number, puzzle: GameBoard, solution: GameBoard) => {
    if (!user) {
      throw new Error('User not initialized');
    }

    setIsLoading(true);
    try {
      const gameInfo = await MultiplayerService.createGame(user, boardSize, puzzle, solution);
      setCurrentGame(gameInfo);
      
      // Join the created game
      if (isConnected) {
        multiplayerService.current.joinGame(user, gameInfo.code);
      }
      
      options.onGameStart?.(gameInfo);
      return gameInfo;
    } catch (error: any) {
      const message = error.message || 'Failed to create game';
      options.onError?.(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  const joinGame = useCallback(async (gameInfo: GameInfo) => {
    if (!user) {
      throw new Error('User not initialized');
    }

    setIsLoading(true);
    try {
      setCurrentGame(gameInfo);
      
      if (isConnected) {
        multiplayerService.current.joinGame(user, gameInfo.code);
      }
      
      options.onGameStart?.(gameInfo);
      return gameInfo;
    } catch (error: any) {
      const message = error.message || 'Failed to join game';
      options.onError?.(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  const leaveGame = useCallback(() => {
    if (!user || !currentGame) return;

    if (isConnected) {
      multiplayerService.current.leaveGame(user, currentGame.code);
    }

    setCurrentGame(null);
    setPlayers([]);
    setWinner(null);
  }, [user, currentGame, isConnected]);

  const sendMove = useCallback((row: number, col: number, value: number, board: GameBoard, remainingCells: number) => {
    if (!user || !currentGame || !isConnected) return;

    multiplayerService.current.sendMove(user, currentGame.code, row, col, value, board, remainingCells);
    
    // Update current user's progress locally
    setPlayers(prev => prev.map(p => 
      p.userId === user.userId ? { ...p, remainingCells } : p
    ));
  }, [user, currentGame, isConnected]);

  const updateProgress = useCallback((remainingCells: number) => {
    if (!user || !currentGame || !isConnected) return;

    multiplayerService.current.updateProgress(user, currentGame.code, remainingCells);
    
    // Update current user's progress locally
    setPlayers(prev => prev.map(p => 
      p.userId === user.userId ? { ...p, remainingCells } : p
    ));
  }, [user, currentGame, isConnected]);

  const completeGame = useCallback(() => {
    if (!user || !currentGame || !isConnected) return;

    multiplayerService.current.completeGame(user, currentGame.code);
  }, [user, currentGame, isConnected]);

  return {
    user,
    currentGame,
    isConnected,
    players,
    winner,
    isLoading,
    createGame,
    joinGame,
    leaveGame,
    sendMove,
    updateProgress,
    completeGame,
  };
}