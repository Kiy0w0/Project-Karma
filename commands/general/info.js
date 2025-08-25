const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');
const utils = require('../../utils/helpers');

module.exports = {
    name: 'info',
    description: 'Menampilkan informasi tentang bot',
    usage: 'info',
    category: 'general',
    aliases: ['botinfo', 'about'],
    cooldown: 5,
    
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Karma Bot Information')
            .setColor(config.colors.info)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { 
                    name: '📊 Statistics', 
                    value: `Servers: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}\nChannels: ${client.channels.cache.size}`, 
                    inline: true 
                },
                { 
                    name: '⚙️ Technical', 
                    value: `Node.js: ${process.version}\nDiscord.js: v14\nUptime: ${utils.formatUptime(client.uptime)}`, 
                    inline: true 
                },
                { 
                    name: '💻 System', 
                    value: `Memory: ${utils.formatBytes(process.memoryUsage().heapUsed)}\nPlatform: ${process.platform}\nCPU: ${process.arch}`, 
                    inline: true 
                },
                {
                    name: '🎯 Features',
                    value: '• Modular Command System\n• Rich Embeds\n• Cooldown System\n• Permission Checks\n• Error Handling',
                    inline: false
                }
            )
            .setDescription('Karma Bot adalah bot Discord yang kaya fitur dengan berbagai command utility, fun, dan moderation.')
            .setFooter({ text: 'Created with ❤️ using Discord.js', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};
