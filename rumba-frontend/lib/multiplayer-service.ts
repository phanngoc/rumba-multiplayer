'use client';

import { io, Socket } from 'socket.io-client';
import { GameBoard, PairConstraint } from './game-types';
import { User } from './user-service';

const API_BASE_URL = 'http://localhost:3005';
const SOCKET_URL = 'http://localhost:3005/game';

export interface GameInfo {
  id: number;
  code: string;
  gameState: 'PLAYING' | 'COMPLETED' | 'ERROR';
  boardSize: number;
  puzzleJson: string;
  solutionJson: string;
  constraintsJson?: string | null;
  creator?: {
    userId: string;
    nickname: string;
  };
  createdAt: string;
}

export interface PlayerInfo {
  userId: string;
  nickname: string;
  remainingCells: number;
}

export interface MultiplayerEvents {
  onPlayerJoined: (data: {
    userId: string;
    nickname: string;
    players: string[];
    playerProgress: Record<string, number>;
  }) => void;
  onPlayerLeft: (data: {
    userId: string;
    remainingPlayers: string[];
    playerProgress: Record<string, number>;
  }) => void;
  onOpponentMove: (data: {
    userId: string;
    row: number;
    col: number;
    value: number;
    board: GameBoard;
    remainingCells: number;
    playerProgress: Record<string, number>;
  }) => void;
  onProgressUpdate: (data: {
    userId: string;
    remainingCells: number;
    playerProgress: Record<string, number>;
  }) => void;
  onGameWon: (data: {
    winnerId: string;
    winnerNickname: string;
    completionTime: string;
  }) => void;
  onError: (data: { message: string }) => void;
}

export class MultiplayerService {
  private socket: Socket | null = null;
  private events: Partial<MultiplayerEvents> = {};

  static async createGame(
    user: User, 
    boardSize: number, 
    puzzle: GameBoard, 
    solution: GameBoard,
    constraints?: PairConstraint[]
  ): Promise<GameInfo> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.userId,
        boardSize,
        puzzleJson: JSON.stringify(puzzle),
        solutionJson: JSON.stringify(solution),
        constraintsJson: constraints ? JSON.stringify(constraints) : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create game');
    }

    return result.data;
  }

  static async findGameByCode(code: string): Promise<GameInfo> {
    const response = await fetch(`${API_BASE_URL}/games/code/${code}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Game not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to find game');
    }

    return result.data;
  }

  static async createInvitation(user: User, gameCode: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/game-invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.userId,
        gameCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create invitation');
    }
  }

  connect(events: Partial<MultiplayerEvents> = {}): void {
    if (this.socket?.connected) {
      return;
    }

    this.events = events;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to multiplayer server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from multiplayer server');
    });

    this.socket.on('playerJoined', (data) => {
      this.events.onPlayerJoined?.(data);
    });

    this.socket.on('playerLeft', (data) => {
      this.events.onPlayerLeft?.(data);
    });

    this.socket.on('opponentMove', (data) => {
      this.events.onOpponentMove?.(data);
    });

    this.socket.on('progressUpdate', (data) => {
      this.events.onProgressUpdate?.(data);
    });

    this.socket.on('gameWon', (data) => {
      this.events.onGameWon?.(data);
    });

    this.socket.on('error', (data) => {
      this.events.onError?.(data);
    });

    this.socket.on('joinedGame', (data) => {
      console.log('Successfully joined game:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(user: User, gameCode: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to multiplayer server');
    }

    this.socket.emit('joinGame', {
      userId: user.userId,
      gameCode,
    });
  }

  leaveGame(user: User, gameCode: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leaveGame', {
      userId: user.userId,
      gameCode,
    });
  }

  sendMove(user: User, gameCode: string, row: number, col: number, value: number, board: GameBoard, remainingCells: number): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('gameMove', {
      userId: user.userId,
      gameCode,
      row,
      col,
      value,
      board,
      remainingCells,
    });
  }

  updateProgress(user: User, gameCode: string, remainingCells: number): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('updateProgress', {
      userId: user.userId,
      gameCode,
      remainingCells,
    });
  }

  completeGame(user: User, gameCode: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('gameCompleted', {
      userId: user.userId,
      gameCode,
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}