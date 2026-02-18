/********************************************
 * Copyright (c) 2026 Shun/翔海 (@shun4midx) *
 * Project: eXOtended-V2                    *
 * File Type: TS file                       *
 * File: ai_player.ts                       *
 ****************************************** */

/********************************************
 * Copyright (c) 2026 Shun/翔海 (@shun4midx) *
 * Project: eXOtended-V2                    *
 * File Type: TS file                       *
 * File: ai_player.ts                       *
 ****************************************** */

import { eXOtendedGame, Player } from "./game";

export type Move = {
    big: number;
    row: number;
    col: number;
};

export class AIPlayer {

    static findBestMove(game: eXOtendedGame, depth: number = 4): Move | null {
        const maximizingPlayer = game.current_player;
        const moves = game.getAllValidMoves();

        let bestScore = -Infinity;
        let bestMove: Move | null = null;

        for (const move of moves) {
            const clone = game.clone();
            clone.makeMove(move.big, move.row, move.col);

            const score = this.minimax(
                clone,
                depth - 1,
                -Infinity,
                Infinity,
                maximizingPlayer
            );

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private static minimax(
        game: eXOtendedGame,
        depth: number,
        alpha: number,
        beta: number,
        maximizingPlayer: Player
    ): number {

        if (depth === 0 || game.ended) {
            return this.evaluate(game, maximizingPlayer);
        }

        const moves = game.getAllValidMoves();

        if (game.current_player === maximizingPlayer) {

            let maxEval = -Infinity;

            for (const move of moves) {
                const clone = game.clone();
                clone.makeMove(move.big, move.row, move.col);

                const evalScore = this.minimax(
                    clone,
                    depth - 1,
                    alpha,
                    beta,
                    maximizingPlayer
                );

                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);

                if (beta <= alpha) break;
            }

            return maxEval;

        } else {

            let minEval = Infinity;

            for (const move of moves) {
                const clone = game.clone();
                clone.makeMove(move.big, move.row, move.col);

                const evalScore = this.minimax(
                    clone,
                    depth - 1,
                    alpha,
                    beta,
                    maximizingPlayer
                );

                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);

                if (beta <= alpha) break;
            }

            return minEval;
        }
    }

    private static evaluate(game: eXOtendedGame, maximizingPlayer: Player): number {
        const opponent = maximizingPlayer === 1 ? 2 : 1;

        return game.score[maximizingPlayer] - game.score[opponent];
    }
}