import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GameInvitationsService } from './game-invitations.service';
import type { CreateInvitationDto } from './game-invitations.service';

@Controller('game-invitations')
export class GameInvitationsController {
  constructor(private readonly gameInvitationsService: GameInvitationsService) {}

  @Post()
  async createInvitation(@Body() createInvitationDto: CreateInvitationDto) {
    try {
      const { userId, gameCode } = createInvitationDto;

      if (!userId || !gameCode) {
        throw new HttpException(
          'userId and gameCode are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const invitation = await this.gameInvitationsService.createInvitation(createInvitationDto);

      return {
        success: true,
        data: {
          id: invitation.id,
          userId: invitation.userId,
          gameId: invitation.gameId,
          createdAt: invitation.createdAt,
        },
        message: 'Invitation created successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create invitation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getUserInvitations(@Param('userId') userId: string) {
    try {
      const invitations = await this.gameInvitationsService.getUserInvitations(userId);

      return {
        success: true,
        data: invitations.map(invitation => ({
          id: invitation.id,
          gameId: invitation.gameId,
          game: invitation.game ? {
            code: invitation.game.code,
            gameState: invitation.game.gameState,
            boardSize: invitation.game.boardSize,
            creator: invitation.game.creator ? {
              userId: invitation.game.creator.userId,
              nickname: invitation.game.creator.nickname,
            } : null,
          } : null,
          createdAt: invitation.createdAt,
        })),
        message: 'User invitations retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve user invitations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('game/:gameId')
  async getGameInvitations(@Param('gameId') gameId: number) {
    try {
      const invitations = await this.gameInvitationsService.getGameInvitations(gameId);

      return {
        success: true,
        data: invitations.map(invitation => ({
          id: invitation.id,
          userId: invitation.userId,
          user: invitation.user ? {
            userId: invitation.user.userId,
            nickname: invitation.user.nickname,
          } : null,
          createdAt: invitation.createdAt,
        })),
        message: 'Game invitations retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve game invitations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':invitationId/accept')
  async acceptInvitation(@Param('invitationId') invitationId: number) {
    try {
      const invitation = await this.gameInvitationsService.acceptInvitation(invitationId);

      return {
        success: true,
        data: {
          id: invitation.id,
          gameId: invitation.gameId,
          message: 'Invitation accepted - you can now join the game'
        },
        message: 'Invitation accepted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to accept invitation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':invitationId')
  async removeInvitation(@Param('invitationId') invitationId: number) {
    try {
      await this.gameInvitationsService.removeInvitation(invitationId);

      return {
        success: true,
        message: 'Invitation removed successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to remove invitation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}