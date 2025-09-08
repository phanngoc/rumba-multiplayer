import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameInvitation } from '../entities/game-invitation.entity';
import { GameInvitationsController } from './game-invitations.controller';
import { GameInvitationsService } from './game-invitations.service';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameInvitation]),
    UsersModule,
    GamesModule,
  ],
  controllers: [GameInvitationsController],
  providers: [GameInvitationsService],
  exports: [GameInvitationsService],
})
export class GameInvitationsModule {}