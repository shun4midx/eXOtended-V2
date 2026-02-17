/********************************************
 * Copyright (c) 2026 Shun/翔海 (@shun4midx) *
 * Project: eXOtended-V2                    *
 * File Type: TS file                       *
 * File: deploy-commands.ts                 *
 ****************************************** */

import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName('new_game')
        .setDescription('Start a new eXOtended game')
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('Select the player you want to challenge')
                .setRequired(true)
        )
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

async function deploy() {
    try {
        console.log('Registering slash commands...');

        const guildIds = [
            process.env.GUILD_ID1!,
            process.env.GUILD_ID2!
        ];

        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID!,
                    guildId
                ),
                { body: commands }
            );
        }

        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error(error);
    }
}

deploy();