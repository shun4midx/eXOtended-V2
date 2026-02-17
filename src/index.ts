/********************************************
 * Copyright (c) 2026 Shun/翔海 (@shun4midx) *
 * Project: eXOtended-V2                    *
 * File Type: TS file                       *
 * File: index.ts                           *
 ****************************************** */

import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import { eXOtendedGame } from './game';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

type GameSession = {
    game: eXOtendedGame;
    player1: string;
    player2: string;
};

const games = new Map<string, GameSession>();

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
    client.user?.setActivity('eXOtended! while abused by Shun', {
        type: 0 // 0 = Playing
    });
});

// Additional button functions
function createBigBoardButtons(valid: number[]) {
    const rows = [];

    for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (let c = 0; c < 3; c++) {
            const index = r * 3 + c;

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`big_${index}`)
                    .setLabel(`${index + 1}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!valid.includes(index))
            );
        }

        rows.push(row);
    }

    return rows;
}

function createSmallBoardButtons(game: eXOtendedGame, big: number) {
    const rows = [];

    for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (let c = 0; c < 3; c++) {
            const big_board = game.board[big];
            if (!big_board) {
                return [];
            }

            const small_row = big_board[r];
            if (!small_row) {
                return [];
            }

            const cell = small_row[c];

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`move_${big}_${r}_${c}`)
                    .setLabel('O')
                    .setStyle(
                        cell === 0
                            ? ButtonStyle.Success // Green = empty
                            : cell === 1
                                ? ButtonStyle.Primary // Blue = player1
                                : ButtonStyle.Danger // Red = player2
                    )
                    .setDisabled(cell !== 0)
            );
        }

        rows.push(row);
    }

    return rows;
}

// Main code
client.on('interactionCreate', async interaction => {
    // Slash commands
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'new_game') {
            // Opponent
            const opponent = interaction.options.getUser('opponent', true);
    
            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: 'You cannot challenge yourself.',
                    ephemeral: true
                });
            }
    
            if (opponent.bot) {
                return interaction.reply({
                    content: 'You cannot challenge a bot.',
                    ephemeral: true
                });
            }        
    
            // Game
            const game = new eXOtendedGame();
            games.set(interaction.channelId, {
                game,
                player1: interaction.user.id,
                player2: opponent.id
            });
        
            // Big board reply
            await interaction.reply({
                content: `🟦 ${interaction.user} (${game.score[1]}) vs 🟥 ${opponent} (${game.score[2]})\n\n`
                        + `Current Turn: 🟦 ${interaction.user}\n\n` 
                        + game.renderBoard(undefined, game.getValidBigBoards())
                        + `\nClick the big grid you want to put your next move in:`,
                components: createBigBoardButtons(game.getValidBigBoards())
        });
        }
    
        if (interaction.commandName === 'import_game') {
            const data = interaction.options.getString('data', true);
            const { game, player1, player2 } = eXOtendedGame.deserialize(data);

            if (interaction.user.id !== player1 && interaction.user.id !== player2) {
                return interaction.reply({
                    content: 'You were not part of this game',
                    ephemeral: true
                });
            }

            games.set(interaction.channelId, {
                game,
                player1,
                player2
            });

            // Reply with the continued game
            return interaction.reply({
                content:
                    `🟦 <@${player1}> (${game.score[1]}) vs 🟥 <@${player2}> (${game.score[2]})\n\n`
                    + `Current Turn: ${
                        game.current_player === 1
                            ? `🟦 <@${player1}>`
                            : `🟥 <@${player2}>`
                    }\n\n`
                    + game.renderBoard(undefined, game.getValidBigBoards())
                    + `\nClick the big grid you want to put your next move in:`,
                components: createBigBoardButtons(game.getValidBigBoards())
            });
        }

        if (interaction.commandName === 'export_game') {
            const session = games.get(interaction.channelId);
            if (!session) {
                return;
            }

            await interaction.reply({
                content: `Copy this to restore later:\n\`\`\`\n${session.game.serialize(session.player1, session.player2)}\n\`\`\``,
                ephemeral: false
            });
        }
    }

    // Button clicks
    if (interaction.isButton()) {

        const session = games.get(interaction.channelId);
        if (!session) return;
    
        const { game, player1, player2 } = session;
    
        // Turn enforcement
        const currentPlayerId =
            game.current_player === 1 ? player1 : player2;
    
        if (interaction.user.id !== currentPlayerId) {
            return interaction.reply({
                content: 'Not your turn',
                ephemeral: true
            });
        }
    
        // Big board click
        if (interaction.customId.startsWith('big_')) {
            const big_idx = Number(interaction.customId.split('_')[1]);
    
            // Validate big board
            const valid = game.getValidBigBoards();
            if (!valid.includes(big_idx)) {
                return interaction.reply({
                    content: 'Invalid big board',
                    ephemeral: true
                });
            }
    
            // Show little grid buttons
            return interaction.update({
                content: `🟦 <@${player1}> (${game.score[1]}) vs 🟥 <@${player2}> (${game.score[2]})\n\n`
                        + `Current Turn: ${
                            game.current_player === 1
                                ? `🟦 <@${player1}>`
                                : `🟥 <@${player2}>`
                        }\n\n`
                        + game.renderBoard(big_idx)
                        + `\nSelect a square in big grid ${big_idx + 1}`,
                components: createSmallBoardButtons(game, big_idx)
            });
        }

        // Small board click
        if (interaction.customId.startsWith('move_')) {
            const parts = interaction.customId.split('_');
            const big = Number(parts[1]);
            const row = Number(parts[2]);
            const col = Number(parts[3]);
        
            const success = game.makeMove(big, row, col);
        
            if (!success) {
                return interaction.reply({
                    content: 'Invalid move',
                    ephemeral: true
                });
            }

            // Game ended
            if (game.ended) {

                const winner = game.getWinner();
            
                let resultText = "";
            
                if (winner === 1) {
                    resultText = `Game Over! 🟦 <@${player1}> won!`;
                } else if (winner === 2) {
                    resultText = `Game Over! 🟥 <@${player2}> won!`;
                } else {
                    resultText = `Game Over! It's a tie!`;
                }
            
                // Remove game session
                games.delete(interaction.channelId);
            
                return interaction.update({
                    content:
                        `🟦 <@${player1}> (${game.score[1]}) vs 🟥 <@${player2}> (${game.score[2]})\n\n`
                        + game.renderBoard()
                        + `\n\n${resultText}`,
                    components: [] // disable all buttons
                });
            }
        
            // Otherwise, game didn't end and is normal
            // Update message back to big board view
            return interaction.update({
                content:
                    `🟦 <@${player1}> (${game.score[1]}) vs 🟥 <@${player2}> (${game.score[2]})\n\n`
                    + `Current Turn: ${
                        game.current_player === 1
                            ? `🟦 <@${player1}>`
                            : `🟥 <@${player2}>`
                    }\n\n`
                    + game.renderBoard(undefined, game.getValidBigBoards())
                    + `\nClick the big grid you want to put your next move in:`,
                components: createBigBoardButtons(game.getValidBigBoards())
            });
        }
    }    
});

// Login client
client.login(process.env.BOT_TOKEN);