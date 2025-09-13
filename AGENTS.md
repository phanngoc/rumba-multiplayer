# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rumba is a puzzle game MVP similar to Takuzu/Binairo with the following core rules:
- Each row and column must have equal numbers of X and O (N/2 each)
- No three consecutive identical symbols in any row or column
- No two rows or columns can be identical
- Supports realtime multiplayer with time-based scoring

## Architecture

The project is designed as a full-stack application with:

**Frontend**: React.js + Next.js + TailwindCSS
- Game board canvas with interactive cells
- Size options: 4×4, 6×6, 8×8
- Controls: Check, Hint, Reset, Solution buttons
- Cell interaction: Click to cycle Empty → X → O, Right-click for Empty → O → X

**Backend**: NestJS + TypeORM + Sqlite
- WebSocket-based realtime multiplayer
- JWT authentication
- Game logic and validation
- User session management
- Use docker compose for setup sqlite database

**Database**: Sqlite
- Game state persistence
- User authentication data
- Multiplayer session management

## Core Game Logic Algorithms

1. **Local Constraints**: Validates no 3 consecutive symbols, max N/2 per type per row/column, uniqueness
2. **Constraint Propagation**: Automatic deduction (XX? → O, full row/column completion)
3. **Solver**: DFS with pruning for solution validation and unique solution checking
4. **Solution Generation**: Backtracking with constraints to create valid complete boards
5. **Puzzle Generation**: Remove cells from complete solution while maintaining unique solvability

## Development Commands

Since the project is not yet implemented, standard commands will depend on the chosen stack:
- Frontend: `npm run dev`, `npm run build`, `npm run lint`
- Backend: `npm run start:dev`, `npm run build`, `npm run test`
- Database: TypeORM migrations and seeding

## Key Implementation Notes

- Game validation must be performed both client-side (UX) and server-side (security)
- WebSocket events should handle game moves, player joins/leaves, timer synchronization
- Puzzle difficulty should be balanced between hint density and solution uniqueness
- Realtime multiplayer requires careful state synchronization and conflict resolution