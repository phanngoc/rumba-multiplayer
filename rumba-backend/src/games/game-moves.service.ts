import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameMove } from '../entities/game-move.entity';

export interface CreateGameMoveDto {
  gameId: number;
  userId: string;
  row: number;
  col: number;
  value: number;
}

@Injectable()
export class GameMovesService {
  private readonly logger = new Logger(GameMovesService.name);

  constructor(
    @InjectRepository(GameMove)
    private gameMovesRepository: Repository<GameMove>,
  ) {}

  async saveMove(createMoveDto: CreateGameMoveDto): Promise<GameMove> {
    try {
      const { gameId, userId, row, col, value } = createMoveDto;

      const gameMove = this.gameMovesRepository.create({
        gameId,
        userId,
        r: row,
        c: col,
        value,
      });

      const savedMove = await this.gameMovesRepository.save(gameMove);
      
      this.logger.log(`Move saved: Game ${gameId}, User ${userId}, Position (${row},${col}), Value ${value}`);
      
      return savedMove;
    } catch (error) {
      this.logger.error(`Failed to save move:`, error);
      throw error;
    }
  }

  async getGameMoves(gameId: number): Promise<GameMove[]> {
    return await this.gameMovesRepository.find({
      where: { gameId },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }

  async getUserMovesInGame(gameId: number, userId: string): Promise<GameMove[]> {
    return await this.gameMovesRepository.find({
      where: { gameId, userId },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentMoves(gameId: number, limit: number = 10): Promise<GameMove[]> {
    return await this.gameMovesRepository.find({
      where: { gameId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getMoveCount(gameId: number): Promise<number> {
    return await this.gameMovesRepository.count({
      where: { gameId },
    });
  }

  async deleteGameMoves(gameId: number): Promise<void> {
    await this.gameMovesRepository.delete({ gameId });
    this.logger.log(`All moves deleted for game ${gameId}`);
  }
}