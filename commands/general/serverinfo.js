const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'serverinfo',
    description: 'Menampilkan informasi tentang server',
    usage: 'serverinfo',
    category: 'general',
    aliases: ['si', 'server', 'guildinfo'],
    cooldown: 5,
    
    async execute(message, args, client) {
        if (!message.guild) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Command ini hanya bisa digunakan di server!')
                .setColor(config.colors.error)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        const guild = message.guild;
        
        // Get various counts
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        
        // Get member statistics (safely handle large servers)
        const members = guild.memberCount;
        let bots = 0;
        let humans = members;
        
        // Only count bots if cache is reasonably sized (avoid rate limits)
        if (guild.members.cache.size > 0 && guild.members.cache.size < 1000) {
            bots = guild.members.cache.filter(member => member.user.bot).size;
            humans = members - bots;
        }
        
        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`🏠 Server Information: ${guild.name}`)
            .setColor(config.colors.info)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '👥 Members', value: guild.members.cache.size < 1000 ? `${members} total\n${humans} humans\n${bots} bots` : `${members} total`, inline: true },
                { name: '📝 Channels', value: `${guild.channels.cache.size} total\n${textChannels} text\n${voiceChannels} voice\n${categories} categories`, inline: true },
                { name: '🎭 Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: '😀 Emojis', value: guild.emojis.cache.size.toString(), inline: true },
                { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} boosts\nLevel ${guild.premiumTier}`, inline: true },
                { name: '🔒 Verification', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true }
            );
        
        // Add server features if any
        if (guild.features.length > 0) {
            const features = guild.features.map(feature => 
                feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            ).join(', ');
            embed.addFields({ name: '✨ Features', value: features, inline: false });
        }
        
        if (guild.banner) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }
        
        embed.setTimestamp()
            .setFooter({ text: 'Karma Bot', iconURL: client.user.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};
