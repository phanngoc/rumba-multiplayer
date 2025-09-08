import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameState } from '../entities/game.entity';
import { UsersService } from '../users/users.service';

export interface CreateGameDto {
  userId: string;
  boardSize: number;
  puzzleJson: string;
  solutionJson: string;
}

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    private usersService: UsersService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const { userId, boardSize, puzzleJson, solutionJson } = createGameDto;

    // Verify user exists
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Generate unique 6-character code
    const code = await this.generateUniqueCode();

    const game = this.gamesRepository.create({
      userId,
      gameState: GameState.PLAYING,
      code,
      boardSize,
      puzzleJson,
      solutionJson,
    });

    return await this.gamesRepository.save(game);
  }

  async findGameByCode(code: string): Promise<Game | null> {
    return await this.gamesRepository.findOne({
      where: { code },
      relations: ['creator', 'invitations'],
    });
  }

  async updateGameState(gameId: number, gameState: GameState): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    game.gameState = gameState;
    return await this.gamesRepository.save(game);
  }

  async getUserGames(userId: string): Promise<Game[]> {
    return await this.gamesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGameById(gameId: number): Promise<Game | null> {
    return await this.gamesRepository.findOne({
      where: { id: gameId },
      relations: ['creator', 'invitations'],
    });
  }

  private async generateUniqueCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code already exists
      const existingGame = await this.gamesRepository.findOne({
        where: { code },
      });

      if (!existingGame) {
        return code;
      }

      attempts++;
    }

    throw new HttpException(
      'Failed to generate unique game code',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}