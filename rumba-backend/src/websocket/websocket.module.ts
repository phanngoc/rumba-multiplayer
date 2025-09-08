import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [GamesModule, UsersModule],
  providers: [GameGateway],
})
export class WebsocketModule {}