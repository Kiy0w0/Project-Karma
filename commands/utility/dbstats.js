const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

module.exports = {
    name: 'dbstats',
    description: 'Menampilkan statistik database bot',
    usage: 'dbstats [guild]',
    category: 'utility',
    aliases: ['databasestats', 'sqlstats'],
    permissions: ['ManageGuild'],
    cooldown: 10,
    
    async execute(message, args, client) {
        try {
            const showGuild = args[0]?.toLowerCase() === 'guild' && message.guild;
            
            // Get global database statistics
            const globalStats = db.getStats();
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Database Statistics')
                .setColor(config.colors.info)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '🏠 Total Guilds', value: globalStats.guilds.toLocaleString(), inline: true },
                    { name: '👥 Total Users', value: globalStats.users.toLocaleString(), inline: true },
                    { name: '📝 Command Uses', value: globalStats.commands.toLocaleString(), inline: true },
                    { name: '💬 Message Logs', value: globalStats.messages.toLocaleString(), inline: true }
                )
                .setTimestamp();
            
            if (showGuild) {
                // Get guild-specific command statistics
                const guildCommandStats = db.getCommandStats(message.guild.id, 10);
                
                if (guildCommandStats.length > 0) {
                    const commandList = guildCommandStats.map((stat, index) => 
                        `${index + 1}. **${stat.command_name}** - ${stat.usage_count} uses`
                    ).join('\n');
                    
                    embed.addFields({
                        name: `🏠 ${message.guild.name} - Top Commands`,
                        value: commandList,
                        inline: false
                    });
                }
                
                // Get guild settings
                const guildSettings = db.getGuildSettings(message.guild.id);
                const loggingSettings = db.getLoggingSettings(message.guild.id);
                
                embed.addFields(
                    { name: '⚙️ Guild Prefix', value: `\`${guildSettings.prefix}\``, inline: true },
                    { name: '📝 Logging Status', value: loggingSettings.enabled ? '✅ Enabled' : '❌ Disabled', inline: true }
                );
                
            } else {
                // Get global command statistics
                const globalCommandStats = db.getCommandStats(null, 10);
                
                if (globalCommandStats.length > 0) {
                    const commandList = globalCommandStats.map((stat, index) => 
                        `${index + 1}. **${stat.command_name}** - ${stat.usage_count} uses`
                    ).join('\n');
                    
                    embed.addFields({
                        name: '🌐 Global - Top Commands',
                        value: commandList,
                        inline: false
                    });
                }
            }
            
            // Database health info
            embed.addFields(
                { 
                    name: '💾 Database Info', 
                    value: '**Type:** SQLite\n**Location:** `./database/karma_bot.db`\n**Status:** 🟢 Connected', 
                    inline: false 
                },
                { 
                    name: '🔧 Options', 
                    value: `Use \`${config.prefix}dbstats guild\` for server-specific stats`, 
                    inline: false 
                }
            );
            
            embed.setFooter({ 
                text: `Database query time: ${Date.now() - message.createdTimestamp}ms`, 
                iconURL: client.user.displayAvatarURL() 
            });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error getting database stats:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Database Error')
                .setDescription('Terjadi error saat mengambil statistik database.')
                .setColor(config.colors.error)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }
    }
};
