/********************************************
 * Copyright (c) 2026 Shun/翔海 (@shun4midx) *
 * Project: eXOtended-V2                    *
 * File Type: TS file                       *
 * File: game.ts                            *
 ****************************************** */

export type Player = 1 | 2;
export type Cell = 0 | Player;

export class eXOtendedGame {
    board: Cell[][][]; // 9 big boards, each 3x3
    current_player: Player;
    next_big_index: number | null;
    ended: boolean;
    score: Record<Player, number>;
    claimed_lines: Set<string>;
    moves_played: number;

    constructor() {
        this.board = Array.from({ length: 9 }, () =>
            Array.from({ length: 3 }, () =>
                Array<Cell>(3).fill(0)
            )
        );

        this.current_player = 1;
        this.next_big_index = null;
        this.ended = false;

        this.score = { 1: 0, 2: 0 };
        this.claimed_lines = new Set();
        this.moves_played = 0;
    }

    makeMove(big: number, row: number, col: number): boolean {
        // Validity
        if (this.ended) {
            return false;
        }

        if (this.next_big_index !== null && big !== this.next_big_index && !this.isBigBoardFull(this.next_big_index)) { // Valid big square to put into
            return false;
        }

        if (big < 0 || big >= 9 || row < 0 || row >= 3 || col < 0 || col >= 3) { // Valid mini square
            return false;
        }        

        const big_board = this.board[big];
        if (!big_board) {
            return false;
        }

        const small_row = big_board[row];
        if (!small_row) {
            return false;
        }

        if (small_row[col] !== 0) { // Someone already put their piece there
            return false;
        }

        // Make move for this player
        small_row[col] = this.current_player;

        // Update scores
        this.checkNewLines(big);

        // Check end game
        if (++this.moves_played == 81) {
            this.ended = true;
        }

        // Switch players
        this.current_player = (this.current_player === 1 ? 2 : 1);
        this.next_big_index = row * 3 + col;

        return true;
    }

    private checkNewLines(big: number): void {
        const big_board = this.board[big];
        if (!big_board) {
            return;
        }
    
        const player = this.current_player;
    
        // Main check line in a big box
        const checkLine = (cells: [number, number][], id: string) => {
            if (this.claimed_lines.has(id)) return;
    
            for (const [r, c] of cells) {
                const small_row = big_board[r];
                if (!small_row) {
                    return;
                }

                if (small_row[c] !== player) {
                    return;
                }
            }
    
            this.claimed_lines.add(id);
            this.score[player]++;
        };
    
        // Calling checkLine()
        // Rows
        for (let i = 0; i < 3; ++i) {
            checkLine([[i, 0], [i, 1], [i, 2]], `${big}-row-${i}`);
        }
    
        // Columns
        for (let i = 0; i < 3; ++i) {
            checkLine([[0, i], [1, i], [2, i]], `${big}-col-${i}`);
        }
    
        // Diagonals
        checkLine([[0, 0], [1, 1], [2, 2]], `${big}-diag-0`);
        checkLine([[0, 2], [1, 1], [2, 0]], `${big}-diag-1`);
    }
    
    private isBigBoardFull(big: number): boolean {
        const big_board = this.board[big];
        if (!big_board) {
            return true;
        }
    
        for (let r = 0; r < 3; r++) {
            const small_row = big_board[r];
            if (!small_row) {
                return false;
            }

            for (let c = 0; c < 3; c++) {
                if (small_row[c] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    public getValidBigBoards(): number[] {
        if (this.ended) {
            return [];
        }
    
        // Normal next move
        if (this.next_big_index !== null && !this.isBigBoardFull(this.next_big_index)) {
            return [this.next_big_index];
        }
    
        const valid: number[] = [];
    
        // Full big squares next move
        for (let i = 0; i < 9; i++) {
            if (!this.isBigBoardFull(i)) {
                valid.push(i);
            }
        }
    
        return valid;
    }

    public getWinner(): Player | null | "tie" {
        if (!this.ended) {
            return null;
        }
    
        if (this.score[1] > this.score[2]) {
            return 1;
        } else if (this.score[2] > this.score[1]) {
            return 2;
        }

        return "tie"; // tie
    }

    public renderBoard(highlightBig?: number, validBigBoards?: number[]): string {
        let output = "";
    
        for (let big_row = 0; big_row < 3; ++big_row) {
            for (let small_row = 0; small_row < 3; ++small_row) {
                for (let big_col = 0; big_col < 3; ++big_col) {
                    const big_idx = big_row * 3 + big_col;
                    const big_board = this.board[big_idx];
                    if (!big_board) {
                        return "Invalid";
                    }

                    const row = big_board[small_row];
                    if (!row) {
                        return "Invalid";
                    }
    
                    output += row.map((cell) => {

                        // Occupied always wins
                        if (cell === 1) {
                            return "🟦";
                        }
                        
                        if (cell === 2) {
                            return "🟥";
                        }
                    
                        // Small-grid selection mode
                        if (highlightBig !== undefined) {
                            return big_idx === highlightBig ? "🟨" : "⬜";
                        }
                    
                        // Big-grid selection mode
                        if (validBigBoards !== undefined) {
                            return validBigBoards.includes(big_idx) ? "🟨" : "⬜";
                        }
                    
                        // Default
                        return "⬜";
                    
                    }).join("");                    
    
                    if (big_col != 2) {
                        output += "⬛";
                    }
                }
                output += "\n";
            }
            if (big_row != 2) {
                output += "⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛\n";
            }
        }

        return output;
    }    
}