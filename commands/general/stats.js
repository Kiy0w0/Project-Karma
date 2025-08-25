const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');
const utils = require('../../utils/helpers');

module.exports = {
    name: 'stats',
    description: 'Menampilkan statistik bot di semua server',
    usage: 'stats',
    category: 'general',
    aliases: ['statistics', 'botstat'],
    cooldown: 10,
    
    async execute(message, args, client) {
        // Calculate various statistics
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;
        const channels = client.channels.cache.size;
        
        // Calculate total members across all guilds
        let totalMembers = 0;
        let totalOnline = 0;
        
        client.guilds.cache.forEach(guild => {
            totalMembers += guild.memberCount;
            // Count online members if presence intent is available
            totalOnline += guild.members.cache.filter(member => 
                member.presence?.status === 'online' || 
                member.presence?.status === 'idle' || 
                member.presence?.status === 'dnd'
            ).size;
        });
        
        // Get memory usage
        const memUsage = process.memoryUsage();
        
        // Calculate uptime
        const uptime = utils.formatUptime(client.uptime);
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Karma Bot - Global Statistics')
            .setColor(config.colors.info)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🌐 Server Statistics',
                    value: `**Servers:** ${guilds.toLocaleString()}\n**Total Members:** ${totalMembers.toLocaleString()}\n**Cached Users:** ${users.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📡 Channel Statistics', 
                    value: `**Total Channels:** ${channels.toLocaleString()}\n**Commands:** ${client.commands.size}\n**Ping:** ${client.ws.ping}ms`,
                    inline: true
                },
                {
                    name: '💻 System Info',
                    value: `**Memory:** ${utils.formatBytes(memUsage.heapUsed)}\n**Uptime:** ${uptime}\n**Node.js:** ${process.version}`,
                    inline: true
                },
                {
                    name: '🔧 Technical Details',
                    value: `**Discord.js:** v14\n**Platform:** ${process.platform}\n**Architecture:** ${process.arch}`,
                    inline: true
                },
                {
                    name: '📈 Performance',
                    value: `**CPU Usage:** ${(process.cpuUsage().system / 1000000).toFixed(2)}%\n**Heap Total:** ${utils.formatBytes(memUsage.heapTotal)}\n**External:** ${utils.formatBytes(memUsage.external)}`,
                    inline: true
                },
                {
                    name: '🎯 Bot Features',
                    value: `**Multi-Server Ready**\n**Modular Commands**\n**Rich Embeds**\n**Error Handling**\n**Permission System**`,
                    inline: true
                }
            )
            .setDescription(`Karma Bot melayani **${guilds.toLocaleString()}** server dengan **${totalMembers.toLocaleString()}** total members!`)
            .setFooter({ text: `Requested by ${message.author.tag} | Bot ID: ${client.user.id}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        // Add server list if less than 10 servers (for privacy)
        if (guilds <= 10) {
            const serverList = client.guilds.cache.map(guild => 
                `**${guild.name}** (${guild.memberCount} members)`
            ).join('\n');
            
            if (serverList.length <= 1024) {
                embed.addFields({
                    name: '🏠 Server List',
                    value: serverList,
                    inline: false
                });
            }
        }
        
        await message.reply({ embeds: [embed] });
    }
};
