import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Game } from './game.entity';
import { User } from './user.entity';

@Entity('game_moves')
@Index(['gameId'])
@Index(['userId'])
@Index(['createdAt'])
export class GameMove {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id', type: 'integer' })
  gameId: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'r', type: 'integer' })
  r: number;

  @Column({ name: 'c', type: 'integer' })
  c: number;

  @Column({ 
    name: 'value', 
    type: 'text',
    transformer: {
      to: (value: number) => {
        // Transform frontend values (0,1,2) to database chars (' ','X','O')
        switch (value) {
          case 0: return ' '; // EMPTY
          case 1: return 'X';
          case 2: return 'O';
          default: return ' ';
        }
      },
      from: (value: string) => {
        // Transform database chars to frontend values
        switch (value) {
          case ' ': return 0; // EMPTY
          case 'X': return 1;
          case 'O': return 2;
          default: return 0;
        }
      }
    }
  })
  value: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user: User;
}