import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../entities/game.entity';
import { GameMove } from '../entities/game-move.entity';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameMovesService } from './game-moves.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameMove]),
    UsersModule,
  ],
  controllers: [GamesController],
  providers: [GamesService, GameMovesService],
  exports: [GamesService, GameMovesService],
})
export class GamesModule {}