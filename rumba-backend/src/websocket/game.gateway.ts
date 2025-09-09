import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { GamesService } from '../games/games.service';
import { GameMovesService } from '../games/game-moves.service';
import { UsersService } from '../users/users.service';

interface GameRoom {
  gameId: number;
  players: Set<string>; // user IDs
  sockets: Map<string, Socket>; // userId -> socket
  gameState: any;
  playerProgress: Map<string, number>; // userId -> remaining empty cells count
}

interface JoinGamePayload {
  userId: string;
  gameCode: string;
}

interface GameMovePayload {
  userId: string;
  gameCode: string;
  row: number;
  col: number;
  value: number;
  board: any;
  remainingCells: number;
}

interface ProgressUpdatePayload {
  userId: string;
  gameCode: string;
  remainingCells: number;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private rooms: Map<string, GameRoom> = new Map(); // gameCode -> GameRoom

  constructor(
    private gamesService: GamesService,
    private gameMovesService: GameMovesService,
    private usersService: UsersService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all rooms
    for (const [gameCode, room] of this.rooms.entries()) {
      for (const [userId, socket] of room.sockets.entries()) {
        if (socket.id === client.id) {
          room.players.delete(userId);
          room.sockets.delete(userId);
          room.playerProgress.delete(userId);
          
          // Notify other players
          this.server.to(gameCode).emit('playerLeft', {
            userId,
            remainingPlayers: Array.from(room.players),
          });
          
          // Clean up empty rooms
          if (room.players.size === 0) {
            this.rooms.delete(gameCode);
          }
          break;
        }
      }
    }
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinGamePayload,
  ) {
    try {
      const { userId, gameCode } = payload;

      // Verify user exists
      const user = await this.usersService.findByUserId(userId);
      if (!user) {
        client.emit('error', { message: 'User not found' });
        return;
      }

      // Verify game exists
      const game = await this.gamesService.findGameByCode(gameCode);
      if (!game) {
        client.emit('error', { message: 'Game not found' });
        return;
      }

      // Get or create room
      if (!this.rooms.has(gameCode)) {
        this.rooms.set(gameCode, {
          gameId: game.id,
          players: new Set(),
          sockets: new Map(),
          gameState: null,
          playerProgress: new Map(),
        });
      }

      const room = this.rooms.get(gameCode)!;
      
      // Add player to room
      room.players.add(userId);
      room.sockets.set(userId, client);
      room.playerProgress.set(userId, 0); // Initialize progress
      
      // Join socket room
      client.join(gameCode);

      // Notify all players in the room
      this.server.to(gameCode).emit('playerJoined', {
        userId,
        nickname: user.nickname,
        players: Array.from(room.players),
        playerProgress: Object.fromEntries(room.playerProgress),
      });

      client.emit('joinedGame', {
        gameCode,
        gameId: game.id,
        players: Array.from(room.players),
        gameState: room.gameState,
        playerProgress: Object.fromEntries(room.playerProgress),
      });

      this.logger.log(`User ${userId} joined game ${gameCode}`);
    } catch (error) {
      this.logger.error('Error in joinGame:', error);
      client.emit('error', { message: 'Failed to join game' });
    }
  }

  @SubscribeMessage('gameMove')
  async handleGameMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GameMovePayload,
  ) {
    try {
      const { userId, gameCode, row, col, value, board, remainingCells } = payload;

      const room = this.rooms.get(gameCode);
      if (!room) {
        client.emit('error', { message: 'Game room not found' });
        return;
      }

      if (!room.players.has(userId)) {
        client.emit('error', { message: 'You are not in this game' });
        return;
      }

      // Save move to database
      try {
        await this.gameMovesService.saveMove({
          gameId: room.gameId,
          userId,
          row,
          col,
          value,
        });
      } catch (saveError) {
        this.logger.error('Failed to save move to database:', saveError);
        // Continue with the game flow even if database save fails
      }

      // Update room game state
      room.gameState = board;
      room.playerProgress.set(userId, remainingCells);

      // Broadcast move to all other players
      client.to(gameCode).emit('opponentMove', {
        userId,
        row,
        col,
        value,
        board,
        remainingCells,
        playerProgress: Object.fromEntries(room.playerProgress),
      });

      this.logger.log(`Game move in ${gameCode} by ${userId}: (${row},${col}) = ${value}`);
    } catch (error) {
      this.logger.error('Error in gameMove:', error);
      client.emit('error', { message: 'Failed to process move' });
    }
  }

  @SubscribeMessage('updateProgress')
  async handleProgressUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ProgressUpdatePayload,
  ) {
    try {
      const { userId, gameCode, remainingCells } = payload;

      const room = this.rooms.get(gameCode);
      if (!room) {
        client.emit('error', { message: 'Game room not found' });
        return;
      }

      if (!room.players.has(userId)) {
        client.emit('error', { message: 'You are not in this game' });
        return;
      }

      // Update player progress
      room.playerProgress.set(userId, remainingCells);

      // Broadcast progress to all players
      this.server.to(gameCode).emit('progressUpdate', {
        userId,
        remainingCells,
        playerProgress: Object.fromEntries(room.playerProgress),
      });

      this.logger.log(`Progress update in ${gameCode} by ${userId}: ${remainingCells} cells remaining`);
    } catch (error) {
      this.logger.error('Error in updateProgress:', error);
      client.emit('error', { message: 'Failed to update progress' });
    }
  }

  @SubscribeMessage('gameCompleted')
  async handleGameCompleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; gameCode: string },
  ) {
    try {
      const { userId, gameCode } = payload;

      const room = this.rooms.get(gameCode);
      if (!room) {
        client.emit('error', { message: 'Game room not found' });
        return;
      }

      // Get user info
      const user = await this.usersService.findByUserId(userId);

      // Broadcast game completion to all players
      this.server.to(gameCode).emit('gameWon', {
        winnerId: userId,
        winnerNickname: user?.nickname || 'Unknown Player',
        completionTime: new Date().toISOString(),
      });

      this.logger.log(`Game ${gameCode} completed by ${userId}`);
    } catch (error) {
      this.logger.error('Error in gameCompleted:', error);
      client.emit('error', { message: 'Failed to process game completion' });
    }
  }

  @SubscribeMessage('leaveGame')
  async handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; gameCode: string },
  ) {
    try {
      const { userId, gameCode } = payload;

      const room = this.rooms.get(gameCode);
      if (!room) {
        return;
      }

      // Remove player from room
      room.players.delete(userId);
      room.sockets.delete(userId);
      room.playerProgress.delete(userId);

      // Leave socket room
      client.leave(gameCode);

      // Notify other players
      this.server.to(gameCode).emit('playerLeft', {
        userId,
        remainingPlayers: Array.from(room.players),
        playerProgress: Object.fromEntries(room.playerProgress),
      });

      // Clean up empty rooms
      if (room.players.size === 0) {
        this.rooms.delete(gameCode);
      }

      this.logger.log(`User ${userId} left game ${gameCode}`);
    } catch (error) {
      this.logger.error('Error in leaveGame:', error);
    }
  }
}