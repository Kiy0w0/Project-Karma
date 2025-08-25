const config = require('../config/botConfig');
const utils = require('../utils/helpers');
const db = require('../database/database');

// Get guild-specific prefix
function getGuildPrefix(guildId) {
    try {
        const { getGuildPrefix } = require('../commands/utility/prefix');
        return getGuildPrefix(guildId);
    } catch (error) {
        return config.prefix;
    }
}

// Handle incoming messages
async function handleMessage(client, message) {
    // Ignore bots
    if (message.author.bot) return;
    
    // Get the appropriate prefix for this guild
    const prefix = message.guild ? getGuildPrefix(message.guild.id) : config.prefix;
    
    // Check if message starts with prefix or mentions the bot
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const prefixUsed = message.content.startsWith(prefix) ? prefix : 
                      mentionRegex.test(message.content) ? message.content.match(mentionRegex)[0] : null;
    
    if (!prefixUsed) return;
    
    // Parse command and arguments
    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Get command from collection
    const command = client.commands.get(commandName);
    
    if (!command) {
        const embed = utils.createEmbed(
            '❓ Command Not Found',
            `Command \`${prefix}${commandName}\` tidak ditemukan!\nGunakan \`${prefix}help\` untuk melihat semua command.`,
            config.colors.error,
            client
        );
        return message.reply({ embeds: [embed] });
    }
    
    // Check if command is owner only
    if (command.ownerOnly && message.author.id !== config.botOwner) {
        const embed = utils.createEmbed(
            '🚫 Access Denied',
            'Command ini hanya bisa digunakan oleh owner bot!',
            config.colors.error,
            client
        );
        return message.reply({ embeds: [embed] });
    }
    
    // Check if command requires permissions
    if (command.permissions && command.permissions.length > 0) {
        const member = message.guild?.members.cache.get(message.author.id);
        if (!member) {
            const embed = utils.createEmbed(
                '❌ Error',
                'Command ini hanya bisa digunakan di server!',
                config.colors.error,
                client
            );
            return message.reply({ embeds: [embed] });
        }
        
        const missingPermissions = command.permissions.filter(perm => !utils.hasPermission(member, perm));
        if (missingPermissions.length > 0) {
            const embed = utils.createEmbed(
                '🚫 Missing Permissions',
                `Kamu memerlukan permission berikut: \`${missingPermissions.join(', ')}\``,
                config.colors.error,
                client
            );
            return message.reply({ embeds: [embed] });
        }
    }
    
    // Cooldown system
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Map());
    }
    
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            const embed = utils.createEmbed(
                '⏰ Cooldown',
                `Tunggu ${timeLeft.toFixed(1)} detik sebelum menggunakan command \`${command.name}\` lagi.`,
                config.colors.warning,
                client
            );
            return message.reply({ embeds: [embed] });
        }
    }
    
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    
    // Execute command
    try {
        await command.execute(message, args, client);
        
        // Log command usage statistics
        try {
            db.updateUserData(message.author.id, message.author.username, message.author.discriminator);
            db.logCommandUsage(message.guild?.id || 'dm', message.author.id, command.name);
        } catch (dbError) {
            console.error('Error logging command usage:', dbError);
        }
        
    } catch (error) {
        console.error(`Error executing command ${command.name}:`, error);
        const embed = utils.createEmbed(
            '❌ Error',
            'Terjadi error saat menjalankan command!',
            config.colors.error,
            client
        );
        await message.reply({ embeds: [embed] });
    }
}

module.exports = { handleMessage };
