import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Game } from './game.entity';
import { GameInvitation } from './game-invitation.entity';

@Entity('users')
@Index(['userId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column()
  nickname: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Game, (game) => game.creator)
  createdGames: Game[];

  @OneToMany(() => GameInvitation, (invitation) => invitation.user)
  gameInvitations: GameInvitation[];
}