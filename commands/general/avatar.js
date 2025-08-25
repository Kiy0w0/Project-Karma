const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'avatar',
    description: 'Menampilkan avatar user',
    usage: 'avatar [@user]',
    category: 'general',
    aliases: ['av', 'pfp'],
    cooldown: 3,
    
    async execute(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        
        const embed = new EmbedBuilder()
            .setTitle(`🖼️ Avatar ${user.username}`)
            .setColor(config.colors.primary)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`[Download Avatar](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`)
            .addFields(
                { name: 'User', value: `${user.tag}`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Format', value: user.avatar?.startsWith('a_') ? 'GIF' : 'PNG', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Karma Bot', iconURL: client.user.displayAvatarURL() });
        
        await message.reply({ embeds: [embed] });
    }
};
