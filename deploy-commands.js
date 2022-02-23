/* eslint-disable indent */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { ClientId, guildId, token } = require('./config.json');

const commands = [
    new SlashCommandBuilder().setName('YEP').setDescription('Yep reply'),
]
    .map(command => command.toJSON());

