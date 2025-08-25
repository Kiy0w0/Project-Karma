const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'userinfo',
    description: 'Menampilkan informasi tentang user',
    usage: 'userinfo [@user]',
    category: 'general',
    aliases: ['ui', 'user', 'whois'],
    cooldown: 3,
    
    async execute(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild?.members.cache.get(user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`👤 User Information: ${user.username}`)
            .setColor(config.colors.info)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'Discriminator', value: `#${user.discriminator}`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Account Created', value: `<t:${parseInt(user.createdTimestamp / 1000)}:F>`, inline: true }
            );
        
        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `<t:${parseInt(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: 'Status', value: member.presence?.status || 'offline', inline: true },
                { name: 'Highest Role', value: member.roles.highest.name, inline: true },
                { name: 'Role Count', value: member.roles.cache.size.toString(), inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true }
            );
            
            // Add boost info if applicable
            if (member.premiumSince) {
                embed.addFields({ 
                    name: 'Server Booster Since', 
                    value: `<t:${parseInt(member.premiumSinceTimestamp / 1000)}:F>`, 
                    inline: true 
                });
            }
        } else {
            embed.addFields({ name: 'Server Member', value: 'No', inline: true });
        }
        
        // Add badges
        const badges = [];
        if (user.bot) badges.push('🤖 Bot');
        if (user.system) badges.push('🔧 System');
        if (member?.permissions.has('Administrator')) badges.push('👑 Admin');
        
        if (badges.length > 0) {
            embed.addFields({ name: 'Badges', value: badges.join(' '), inline: false });
        }
        
        embed.setTimestamp()
            .setFooter({ text: 'Karma Bot', iconURL: client.user.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};
