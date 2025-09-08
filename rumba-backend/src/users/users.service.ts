import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { nanoid } from 'nanoid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async generateUser(): Promise<{ userId: string; nickname: string }> {
    const userId = nanoid(10); // Generate 10-character user ID
    const nickname = this.generateNickname();

    // Create user in database
    const user = this.usersRepository.create({
      userId,
      nickname,
    });

    await this.usersRepository.save(user);

    return { userId, nickname };
  }

  async findByUserId(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { userId },
    });
  }

  async syncUser(userId: string, nickname: string): Promise<User> {
    let user = await this.findByUserId(userId);
    
    if (!user) {
      user = this.usersRepository.create({
        userId,
        nickname,
      });
    } else {
      user.nickname = nickname;
    }

    return await this.usersRepository.save(user);
  }

  private generateNickname(): string {
    const adjectives = [
      'Swift', 'Clever', 'Bright', 'Quick', 'Smart', 'Sharp', 'Fast', 'Wise', 
      'Bold', 'Cool', 'Epic', 'Super', 'Mega', 'Ultra', 'Pro', 'Master'
    ];
    
    const nouns = [
      'Player', 'Solver', 'Gamer', 'Wizard', 'Hero', 'Champion', 'Genius', 
      'Expert', 'Ninja', 'Warrior', 'King', 'Queen', 'Fox', 'Wolf', 'Eagle', 'Tiger'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    return `${adjective}${noun}${number}`;
  }
}