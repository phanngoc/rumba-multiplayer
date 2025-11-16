import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { GameInvitation } from './game-invitation.entity';

export enum GameState {
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

@Entity('games')
@Index(['code'])
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'text',
    name: 'game_state',
    enum: GameState,
    default: GameState.PLAYING,
  })
  gameState: GameState;

  @Column({ unique: true, length: 6 })
  code: string;

  @Column({ name: 'board_size', type: 'integer' })
  boardSize: number;

  @Column({ name: 'puzzle_json', type: 'text' })
  puzzleJson: string;

  @Column({ name: 'solution_json', type: 'text' })
  solutionJson: string;

  @Column({ name: 'constraints_json', type: 'text', nullable: true })
  constraintsJson: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.createdGames)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  creator: User;

  @OneToMany(() => GameInvitation, (invitation) => invitation.game)
  invitations: GameInvitation[];
}