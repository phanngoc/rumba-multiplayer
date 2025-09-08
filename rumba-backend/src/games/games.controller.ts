import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GamesService } from './games.service';
import type { CreateGameDto } from './games.service';
import { GameState } from '../entities/game.entity';

class UpdateGameStateDto {
  gameState: GameState;
}

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  async createGame(@Body() createGameDto: CreateGameDto) {
    try {
      const { userId, boardSize, puzzleJson, solutionJson } = createGameDto;

      if (!userId || !boardSize || !puzzleJson || !solutionJson) {
        throw new HttpException(
          'userId, boardSize, puzzleJson, and solutionJson are required',
          HttpStatus.BAD_REQUEST
        );
      }

      if (![4, 6, 8].includes(boardSize)) {
        throw new HttpException(
          'Board size must be 4, 6, or 8',
          HttpStatus.BAD_REQUEST
        );
      }

      const game = await this.gamesService.createGame(createGameDto);

      return {
        success: true,
        data: {
          id: game.id,
          code: game.code,
          gameState: game.gameState,
          boardSize: game.boardSize,
          createdAt: game.createdAt,
        },
        message: 'Game created successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create game',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('code/:code')
  async getGameByCode(@Param('code') code: string) {
    try {
      if (code.length !== 6) {
        throw new HttpException(
          'Game code must be 6 characters',
          HttpStatus.BAD_REQUEST
        );
      }

      const game = await this.gamesService.findGameByCode(code);

      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          id: game.id,
          code: game.code,
          gameState: game.gameState,
          boardSize: game.boardSize,
          puzzleJson: game.puzzleJson,
          solutionJson: game.solutionJson,
          creator: game.creator ? {
            userId: game.creator.userId,
            nickname: game.creator.nickname,
          } : null,
          createdAt: game.createdAt,
        },
        message: 'Game retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve game',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getUserGames(@Param('userId') userId: string) {
    try {
      const games = await this.gamesService.getUserGames(userId);

      return {
        success: true,
        data: games.map(game => ({
          id: game.id,
          code: game.code,
          gameState: game.gameState,
          boardSize: game.boardSize,
          createdAt: game.createdAt,
        })),
        message: 'User games retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve user games',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':gameId/state')
  async updateGameState(
    @Param('gameId') gameId: number,
    @Body() updateGameStateDto: UpdateGameStateDto
  ) {
    try {
      const { gameState } = updateGameStateDto;

      if (!Object.values(GameState).includes(gameState)) {
        throw new HttpException(
          'Invalid game state',
          HttpStatus.BAD_REQUEST
        );
      }

      const game = await this.gamesService.updateGameState(gameId, gameState);

      return {
        success: true,
        data: {
          id: game.id,
          gameState: game.gameState,
          updatedAt: game.updatedAt,
        },
        message: 'Game state updated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update game state',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':gameId')
  async getGameById(@Param('gameId') gameId: number) {
    try {
      const game = await this.gamesService.getGameById(gameId);

      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          id: game.id,
          code: game.code,
          gameState: game.gameState,
          boardSize: game.boardSize,
          puzzleJson: game.puzzleJson,
          solutionJson: game.solutionJson,
          creator: game.creator ? {
            userId: game.creator.userId,
            nickname: game.creator.nickname,
          } : null,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        },
        message: 'Game retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve game',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}