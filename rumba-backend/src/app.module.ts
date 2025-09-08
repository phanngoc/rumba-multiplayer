import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Game } from './entities/game.entity';
import { GameInvitation } from './entities/game-invitation.entity';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { GameInvitationsModule } from './game-invitations/game-invitations.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'rumba-game.db',
      entities: [User, Game, GameInvitation],
      synchronize: true, // Only for development - use migrations in production
      logging: true,
    }),
    UsersModule,
    GamesModule,
    GameInvitationsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
