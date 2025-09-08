import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameInvitation } from '../entities/game-invitation.entity';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';

export interface CreateInvitationDto {
  userId: string;
  gameCode: string;
}

@Injectable()
export class GameInvitationsService {
  constructor(
    @InjectRepository(GameInvitation)
    private gameInvitationsRepository: Repository<GameInvitation>,
    private usersService: UsersService,
    private gamesService: GamesService,
  ) {}

  async createInvitation(createInvitationDto: CreateInvitationDto): Promise<GameInvitation> {
    const { userId, gameCode } = createInvitationDto;

    // Verify user exists
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Verify game exists
    const game = await this.gamesService.findGameByCode(gameCode);
    if (!game) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    // Check if invitation already exists
    const existingInvitation = await this.gameInvitationsRepository.findOne({
      where: { userId, gameId: game.id },
    });

    if (existingInvitation) {
      throw new HttpException(
        'User already invited to this game',
        HttpStatus.CONFLICT
      );
    }

    // Check if user is the game creator
    if (game.userId === userId) {
      throw new HttpException(
        'Cannot invite yourself to your own game',
        HttpStatus.BAD_REQUEST
      );
    }

    const invitation = this.gameInvitationsRepository.create({
      userId,
      gameId: game.id,
    });

    return await this.gameInvitationsRepository.save(invitation);
  }

  async getUserInvitations(userId: string): Promise<GameInvitation[]> {
    return await this.gameInvitationsRepository.find({
      where: { userId },
      relations: ['game', 'game.creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getGameInvitations(gameId: number): Promise<GameInvitation[]> {
    return await this.gameInvitationsRepository.find({
      where: { gameId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInvitation(invitationId: number): Promise<GameInvitation> {
    const invitation = await this.gameInvitationsRepository.findOne({
      where: { id: invitationId },
      relations: ['game'],
    });

    if (!invitation) {
      throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
    }

    // For now, we just return the invitation
    // In a full implementation, this would update game state to include the player
    return invitation;
  }

  async removeInvitation(invitationId: number): Promise<void> {
    const invitation = await this.gameInvitationsRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
    }

    await this.gameInvitationsRepository.remove(invitation);
  }

  async isUserInvitedToGame(userId: string, gameId: number): Promise<boolean> {
    const invitation = await this.gameInvitationsRepository.findOne({
      where: { userId, gameId },
    });

    return !!invitation;
  }
}