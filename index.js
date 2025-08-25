const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import handlers and utilities
const { loadCommands } = require('./handlers/commandHandler');
const { handleMessage } = require('./handlers/messageHandler');
const config = require('./config/botConfig');
const loggingHandler = require('./handlers/loggingHandler');
const db = require('./database/database');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands
loadCommands(client);

// Event: Bot is ready
client.once('ready', () => {
    console.log(`🚀 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Watching over ${client.users.cache.size} users`);
    
    // Set bot status with server count
    const serverCount = client.guilds.cache.size;
    client.user.setActivity(`${config.prefix}help | ${serverCount} servers`, { type: 'WATCHING' });
    
    // Update status every 30 minutes
    setInterval(() => {
        const currentServerCount = client.guilds.cache.size;
        client.user.setActivity(`${config.prefix}help | ${currentServerCount} servers`, { type: 'WATCHING' });
    }, 30 * 60 * 1000);
});

// Event: Message received
client.on('messageCreate', async (message) => {
    await handleMessage(client, message);
});

// Event: Bot joins a new guild
client.on('guildCreate', (guild) => {
    console.log(`🎉 Joined new server: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
    
    // Try to send welcome message to system channel or first available text channel
    const welcomeChannel = guild.systemChannel || 
                          guild.channels.cache.find(channel => 
                              channel.type === 0 && 
                              channel.permissionsFor(guild.members.me).has('SendMessages')
                          );
    
    if (welcomeChannel) {
        const { EmbedBuilder } = require('discord.js');
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🤖 Terima kasih telah mengundang Karma Bot!')
            .setColor(config.colors.success)
            .setDescription(`Halo! Saya adalah Karma Bot, siap membantu server **${guild.name}**!`)
            .addFields(
                { name: '🎯 Cara Memulai', value: `Ketik \`${config.prefix}help\` untuk melihat semua command`, inline: false },
                { name: '⚙️ Prefix', value: `Default prefix: \`${config.prefix}\``, inline: true },
                { name: '📋 Commands', value: `${client.commands.size}+ commands tersedia`, inline: true },
                { name: '🔗 Links', value: `[Invite Bot](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot) | [Support](https://discord.gg/support)`, inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Karma Bot - Ready to serve!' })
            .setTimestamp();
        
        welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(console.error);
    }
});

// Event: Bot leaves a guild
client.on('guildDelete', (guild) => {
    console.log(`😢 Left server: ${guild.name} (${guild.id})`);
});

// Logging Events
client.on('messageDelete', loggingHandler.handleMessageDelete);
client.on('messageUpdate', loggingHandler.handleMessageUpdate);
client.on('guildMemberAdd', loggingHandler.handleMemberJoin);
client.on('guildMemberRemove', loggingHandler.handleMemberRemove);
client.on('channelCreate', loggingHandler.handleChannelCreate);
client.on('channelDelete', loggingHandler.handleChannelDelete);
client.on('roleCreate', loggingHandler.handleRoleCreate);
client.on('roleDelete', loggingHandler.handleRoleDelete);

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    db.cleanup();
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Shutting down gracefully...');
    db.cleanup();
    db.close();
    process.exit(0);
});

// Database cleanup every 24 hours
setInterval(() => {
    console.log('🧹 Running database cleanup...');
    db.cleanup();
}, 24 * 60 * 60 * 1000);

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
