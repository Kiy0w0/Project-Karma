const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'logs',
    description: 'Lihat dan kelola log audit server',
    usage: 'logs [type] [limit]',
    category: 'utility',
    aliases: ['auditlog', 'history'],
    permissions: ['ViewAuditLog'],
    cooldown: 10,
    
    async execute(message, args, client) {
        if (!message.guild) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Command ini hanya bisa digunakan di server!')
                .setColor(config.colors.error)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        const type = args[0]?.toLowerCase();
        const limit = Math.min(parseInt(args[1]) || 10, 50); // Max 50 entries
        
        // Show available types if no type specified
        if (!type) {
            const embed = new EmbedBuilder()
                .setTitle('📋 Audit Log Types')
                .setColor(config.colors.info)
                .setDescription('Pilih jenis audit log yang ingin dilihat:')
                .addFields(
                    { 
                        name: '📝 Available Types', 
                        value: `\`${config.prefix}logs messages\` - Message events\n\`${config.prefix}logs members\` - Member events\n\`${config.prefix}logs channels\` - Channel events\n\`${config.prefix}logs roles\` - Role events\n\`${config.prefix}logs bans\` - Ban/Unban events\n\`${config.prefix}logs all\` - All recent events`, 
                        inline: false 
                    },
                    { 
                        name: '⚙️ Options', 
                        value: `Add limit: \`${config.prefix}logs messages 20\`\nMax limit: 50`, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Requires View Audit Log permission', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        try {
            let auditLogs;
            let title;
            let description;
            
            switch (type) {
                case 'messages':
                case 'msg':
                    auditLogs = await message.guild.fetchAuditLogs({
                        type: 72, // MESSAGE_DELETE
                        limit: limit
                    });
                    title = '📝 Message Audit Logs';
                    description = 'Recent message deletion events';
                    break;
                    
                case 'members':
                case 'member':
                    auditLogs = await message.guild.fetchAuditLogs({
                        type: 20, // MEMBER_KICK
                        limit: limit
                    });
                    title = '👥 Member Audit Logs';
                    description = 'Recent member kick events';
                    break;
                    
                case 'channels':
                case 'channel':
                    auditLogs = await message.guild.fetchAuditLogs({
                        type: 12, // CHANNEL_DELETE
                        limit: limit
                    });
                    title = '📝 Channel Audit Logs';
                    description = 'Recent channel deletion events';
                    break;
                    
                case 'roles':
                case 'role':
                    auditLogs = await message.guild.fetchAuditLogs({
                        type: 32, // ROLE_DELETE
                        limit: limit
                    });
                    title = '🏷️ Role Audit Logs';
                    description = 'Recent role deletion events';
                    break;
                    
                case 'bans':
                case 'ban':
                    auditLogs = await message.guild.fetchAuditLogs({
                        type: 22, // MEMBER_BAN_ADD
                        limit: limit
                    });
                    title = '🔨 Ban Audit Logs';
                    description = 'Recent ban events';
                    break;
                    
                case 'all':
                default:
                    auditLogs = await message.guild.fetchAuditLogs({
                        limit: limit
                    });
                    title = '📋 All Audit Logs';
                    description = 'Recent audit log events';
                    break;
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(config.colors.info)
                .setDescription(description)
                .setTimestamp();
            
            if (auditLogs.entries.size === 0) {
                embed.addFields({ name: '📭 No Entries', value: 'Tidak ada audit log ditemukan untuk kategori ini.', inline: false });
            } else {
                const entries = auditLogs.entries.first(10); // Show max 10 in embed
                let logText = '';
                
                entries.forEach((entry, index) => {
                    const executor = entry.executor ? entry.executor.tag : 'Unknown';
                    const target = entry.target ? (entry.target.tag || entry.target.name || entry.target.id) : 'Unknown';
                    const action = entry.action || 'Unknown Action';
                    const time = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;
                    
                    logText += `**${index + 1}.** ${executor} → ${target}\n`;
                    logText += `Action: ${action} | ${time}\n`;
                    if (entry.reason) logText += `Reason: ${entry.reason}\n`;
                    logText += '\n';
                });
                
                if (logText.length > 4096) {
                    logText = logText.substring(0, 4000) + '\n... (truncated)';
                }
                
                embed.setDescription(description + '\n\n' + logText);
            }
            
            embed.addFields(
                { name: '📊 Total Entries', value: auditLogs.entries.size.toString(), inline: true },
                { name: '🔍 Showing', value: Math.min(auditLogs.entries.size, 10).toString(), inline: true },
                { name: '⏱️ Updated', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            );
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Audit log fetch error:', error);
            
            const embed = new EmbedBuilder()
                .setTitle('❌ Error Fetching Logs')
                .setDescription('Tidak dapat mengambil audit logs. Pastikan bot memiliki permission **View Audit Log**.')
                .setColor(config.colors.error)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }
    }
};
