import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';

class SyncUserDto {
  userId: string;
  nickname: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('generate')
  async generateUser() {
    try {
      const user = await this.usersService.generateUser();
      return {
        success: true,
        data: user,
        message: 'User generated successfully'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  async syncUser(@Body() syncUserDto: SyncUserDto) {
    try {
      const { userId, nickname } = syncUserDto;
      
      if (!userId || !nickname) {
        throw new HttpException(
          'userId and nickname are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const user = await this.usersService.syncUser(userId, nickname);
      return {
        success: true,
        data: { userId: user.userId, nickname: user.nickname },
        message: 'User synchronized successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to sync user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.findByUserId(userId);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: { userId: user.userId, nickname: user.nickname },
        message: 'User retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}