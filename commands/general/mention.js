const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'mention',
    description: 'Merespon mention bot dengan informasi prefix',
    usage: 'mention',
    category: 'general',
    hidden: true, // Hide from help command
    cooldown: 3,
    
    async execute(message, args, client) {
        // Get guild-specific prefix
        let prefix = config.prefix;
        try {
            const { getGuildPrefix } = require('../utility/prefix');
            prefix = message.guild ? getGuildPrefix(message.guild.id) : config.prefix;
        } catch (error) {
            // Use default prefix if there's an error
        }
        
        const embed = new EmbedBuilder()
            .setTitle('👋 Halo!')
            .setColor(config.colors.primary)
            .setDescription(`Saya adalah **Karma Bot**! Siap membantu server ${message.guild ? `**${message.guild.name}**` : 'ini'}!`)
            .addFields(
                { name: '⚙️ Prefix', value: `\`${prefix}\``, inline: true },
                { name: '📋 Commands', value: `\`${prefix}help\``, inline: true },
                { name: '🔗 Invite', value: `\`${prefix}invite\``, inline: true }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Karma Bot - Multi-Server Ready!', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // Add server-specific info if in a guild
        if (message.guild) {
            embed.addFields({
                name: '🏠 Server Info',
                value: `Server: **${message.guild.name}**\nMembers: **${message.guild.memberCount.toLocaleString()}**\nPrefixnya: \`${prefix}\``,
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};
