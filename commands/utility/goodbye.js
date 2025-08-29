/**
 * Goodbye Messages Command
 * Allows customization of goodbye messages with templates
 */

const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

module.exports = {
    name: 'goodbye',
    description: 'Mengatur pesan goodbye untuk member yang meninggalkan server',
    usage: 'goodbye <action> [options]',
    aliases: ['farewell', 'leave', 'bye'],
    category: 'utility',
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    
    async execute(message, args, client) {
        if (!message.guild) {
            return message.reply('❌ Command ini hanya bisa digunakan di server!');
        }

        const action = args[0]?.toLowerCase();
        
        if (!action) {
            return this.showHelp(message);
        }

        switch (action) {
            case 'setup':
            case 'config':
                return this.showConfig(message);
                
            case 'channel':
                return this.setChannel(message, args.slice(1));
                
            case 'message':
            case 'set':
                return this.setGoodbyeMessage(message, args.slice(1));
                
            case 'toggle':
                return this.toggleGoodbye(message, args.slice(1));
                
            case 'test':
                return this.testMessage(message);
                
            case 'reset':
                return this.resetSettings(message);
                
            case 'templates':
            case 'variables':
                return this.showTemplates(message);
                
            case 'preview':
                return this.previewMessage(message);
                
            case 'embed':
                return this.toggleEmbed(message, args.slice(1));
                
            case 'color':
                return this.setEmbedColor(message, args.slice(1));
                
            case 'ping':
                return this.togglePing(message, args.slice(1));
                
            case 'delete':
            case 'autodelete':
                return this.setAutoDelete(message, args.slice(1));
                
            default:
                return this.showHelp(message);
        }
    },

    async showHelp(message) {
        const prefix = await this.getPrefix(message.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('👋 Goodbye Messages System')
            .setDescription('Sistem pesan goodbye untuk member yang meninggalkan server')
            .addFields(
                {
                    name: '⚙️ Setup Commands',
                    value: '```\n' +
                        `${prefix}goodbye config           - Lihat konfigurasi saat ini\n` +
                        `${prefix}goodbye channel #channel - Set channel untuk pesan\n` +
                        `${prefix}goodbye toggle <on/off>  - Aktifkan/nonaktifkan\n` +
                        '```',
                    inline: false
                },
                {
                    name: '📝 Message Commands',
                    value: '```\n' +
                        `${prefix}goodbye message <text>   - Set pesan goodbye\n` +
                        `${prefix}goodbye preview          - Preview pesan\n` +
                        `${prefix}goodbye test             - Test pesan\n` +
                        '```',
                    inline: false
                },
                {
                    name: '🎨 Customization',
                    value: '```\n' +
                        `${prefix}goodbye embed <on/off>   - Toggle embed mode\n` +
                        `${prefix}goodbye color <hex>      - Set embed color\n` +
                        `${prefix}goodbye ping <on/off>    - Toggle user ping\n` +
                        `${prefix}goodbye delete <seconds> - Auto-delete time\n` +
                        '```',
                    inline: false
                },
                {
                    name: '🎯 Utility Commands',
                    value: '```\n' +
                        `${prefix}goodbye templates - Lihat template variables\n` +
                        `${prefix}goodbye reset    - Reset semua pengaturan\n` +
                        '```',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Goodbye System • Manage Guild Permission Required', 
                iconURL: message.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async showConfig(message) {
        const settings = this.getWelcomeSettings(message.guild.id);
        const prefix = await this.getPrefix(message.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(`👋 Goodbye Configuration - ${message.guild.name}`)
            .addFields(
                {
                    name: '📊 Status',
                    value: `**System Enabled:** ${settings.enabled ? '✅ Yes' : '❌ No'}\n**Goodbye Enabled:** ${settings.goodbye_enabled ? '✅ Yes' : '❌ No'}\n**Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '❌ Not Set'}\n**Embed Mode:** ${settings.embed_enabled !== false ? '✅ On' : '❌ Off'}`,
                    inline: true
                },
                {
                    name: '🎨 Appearance',
                    value: `**Embed Color:** ${settings.embed_color || '#FAA61A'}\n**Ping User:** ${settings.ping_user !== false ? '✅ Yes' : '❌ No'}\n**Auto Delete:** ${settings.delete_after > 0 ? `${settings.delete_after}s` : '❌ Disabled'}`,
                    inline: true
                },
                {
                    name: '📈 Statistics',
                    value: `**Members Farewelled:** ${settings.goodbye_count || 0}\n**Last Updated:** ${settings.updated_at ? `<t:${Math.floor(new Date(settings.updated_at).getTime() / 1000)}:R>` : 'Never'}`,
                    inline: false
                }
            )
            .setTimestamp();

        // Show goodbye message preview
        if (settings.goodbye_message) {
            embed.addFields({
                name: '👋 Current Goodbye Message',
                value: '```\n' + (settings.goodbye_message.length > 300 ? settings.goodbye_message.substring(0, 300) + '...' : settings.goodbye_message) + '\n```',
                inline: false
            });
        } else {
            embed.addFields({
                name: '👋 Default Goodbye Message',
                value: '```\n{username} telah meninggalkan server **{server}**. 😢\nSampai jumpa! Total members sekarang: {membercount}\n```',
                inline: false
            });
        }

        embed.addFields({
            name: '🔧 Quick Setup',
            value: `Use \`${prefix}goodbye channel #channel\` to set channel\nUse \`${prefix}goodbye message <text>\` to set custom message\nUse \`${prefix}goodbye templates\` to see available variables`,
            inline: false
        });

        return message.reply({ embeds: [embed] });
    },

    async setChannel(message, args) {
        if (!args[0]) {
            return message.reply('❌ Mention channel yang ingin digunakan!\nContoh: `!goodbye channel #general`');
        }

        const channel = message.mentions.channels.first() || 
                       message.guild.channels.cache.get(args[0]);

        if (!channel) {
            return message.reply('❌ Channel tidak ditemukan!');
        }

        if (channel.type !== ChannelType.GuildText) {
            return message.reply('❌ Hanya text channel yang bisa digunakan!');
        }

        // Check bot permissions
        const botMember = message.guild.members.me;
        if (!channel.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
            return message.reply('❌ Bot tidak memiliki permission untuk mengirim pesan di channel tersebut!');
        }

        // Update database
        this.updateWelcomeSettings(message.guild.id, { channelId: channel.id });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Goodbye Channel Updated')
            .setDescription(`Goodbye channel berhasil diset ke ${channel}`)
            .addFields({
                name: '📋 Next Steps',
                value: '• Set goodbye message dengan `!goodbye message <text>`\n• Aktifkan sistem dengan `!goodbye toggle on`\n• Test dengan `!goodbye test`',
                inline: false
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async setGoodbyeMessage(message, args) {
        if (!args.length) {
            return message.reply('❌ Masukkan pesan goodbye!\nContoh: `!goodbye message {user} telah meninggalkan server {server}. Sampai jumpa!`');
        }

        const goodbyeMessage = args.join(' ');
        
        if (goodbyeMessage.length > 2000) {
            return message.reply('❌ Pesan terlalu panjang! Maksimal 2000 karakter.');
        }

        // Update database
        this.updateWelcomeSettings(message.guild.id, { 
            goodbyeMessage: goodbyeMessage,
            goodbyeEnabled: true
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Goodbye Message Updated')
            .setDescription('Pesan goodbye berhasil diupdate!')
            .addFields({
                name: '📝 Preview Message',
                value: this.processTemplate(goodbyeMessage, message.member, message.guild),
                inline: false
            })
            .setFooter({ text: 'Use !goodbye test to test the message' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async toggleGoodbye(message, args) {
        const action = args[0]?.toLowerCase();
        
        if (!['on', 'off', 'enable', 'disable', 'true', 'false'].includes(action)) {
            return message.reply('❌ Gunakan: `on/off`, `enable/disable`, atau `true/false`');
        }

        const enabled = ['on', 'enable', 'true'].includes(action);
        
        // Check if channel is set
        const settings = this.getWelcomeSettings(message.guild.id);
        if (enabled && !settings.channel_id) {
            return message.reply('❌ Set channel terlebih dahulu dengan `!goodbye channel #channel`');
        }

        // Update database
        this.updateWelcomeSettings(message.guild.id, { 
            enabled: enabled,
            goodbyeEnabled: enabled 
        });

        const embed = new EmbedBuilder()
            .setColor(enabled ? config.colors.success : config.colors.warning)
            .setTitle(`${enabled ? '✅ Goodbye System Enabled' : '⏸️ Goodbye System Disabled'}`)
            .setDescription(`Goodbye system telah ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`)
            .setTimestamp();

        if (enabled) {
            embed.addFields({
                name: '👋 System Active',
                value: `• Channel: <#${settings.channel_id}>\n• Goodbye: ${enabled ? '✅' : '❌'}\n• Members farewelled: ${settings.goodbye_count || 0}`,
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
    },

    async testMessage(message) {
        const settings = this.getWelcomeSettings(message.guild.id);
        
        if (!settings.channel_id) {
            return message.reply('❌ Set channel terlebih dahulu dengan `!goodbye channel #channel`');
        }

        const channel = message.guild.channels.cache.get(settings.channel_id);
        if (!channel) {
            return message.reply('❌ Goodbye channel tidak ditemukan!');
        }

        const goodbyeMessage = settings.goodbye_message || 
            '{username} telah meninggalkan server **{server}**. 😢\nSampai jumpa! Total members sekarang: {membercount}';

        const processedMessage = this.processTemplate(goodbyeMessage, message.member, message.guild);
        
        // Send test message
        const testEmbed = new EmbedBuilder()
            .setColor(settings.embed_color || config.colors.warning)
            .setTitle('🧪 Test Goodbye Message')
            .setDescription(processedMessage)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'This is a test message' })
            .setTimestamp();

        await channel.send({ embeds: [testEmbed] });

        const confirmEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Test Message Sent')
            .setDescription(`Test goodbye message telah dikirim ke ${channel}`)
            .setTimestamp();

        return message.reply({ embeds: [confirmEmbed] });
    },

    async previewMessage(message) {
        const settings = this.getWelcomeSettings(message.guild.id);
        
        const goodbyeMessage = settings.goodbye_message || 
            '{username} telah meninggalkan server **{server}**. 😢\nSampai jumpa! Total members sekarang: {membercount}';

        const processedMessage = this.processTemplate(goodbyeMessage, message.member, message.guild);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('👀 Preview Goodbye Message')
            .addFields(
                {
                    name: '📝 Raw Template',
                    value: '```\n' + goodbyeMessage + '\n```',
                    inline: false
                },
                {
                    name: '🎨 Processed Result',
                    value: processedMessage,
                    inline: false
                }
            )
            .setFooter({ text: 'This is how the message will look' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async toggleEmbed(message, args) {
        const action = args[0]?.toLowerCase();
        
        if (!['on', 'off', 'enable', 'disable', 'true', 'false'].includes(action)) {
            return message.reply('❌ Gunakan: `on/off`, `enable/disable`, atau `true/false`');
        }

        const enabled = ['on', 'enable', 'true'].includes(action);
        
        this.updateWelcomeSettings(message.guild.id, { embedEnabled: enabled });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`✅ Embed Mode ${enabled ? 'Enabled' : 'Disabled'}`)
            .setDescription(`Goodbye messages akan ${enabled ? 'menggunakan embed' : 'dikirim sebagai text biasa'}`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async setEmbedColor(message, args) {
        if (!args[0]) {
            return message.reply('❌ Masukkan warna hex!\nContoh: `!goodbye color #FF0000` atau `!goodbye color red`');
        }

        const color = args[0];
        
        // Validate hex color
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const namedColors = {
            'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
            'yellow': '#FFFF00', 'purple': '#800080', 'orange': '#FFA500',
            'pink': '#FFC0CB', 'cyan': '#00FFFF', 'magenta': '#FF00FF'
        };
        
        let finalColor = color;
        if (namedColors[color.toLowerCase()]) {
            finalColor = namedColors[color.toLowerCase()];
        } else if (!hexRegex.test(color)) {
            return message.reply('❌ Format warna tidak valid! Gunakan hex (#FF0000) atau nama warna (red, blue, etc.)');
        }

        this.updateWelcomeSettings(message.guild.id, { embedColor: finalColor });

        const embed = new EmbedBuilder()
            .setColor(finalColor)
            .setTitle('✅ Embed Color Updated')
            .setDescription(`Warna embed goodbye berhasil diubah ke ${finalColor}`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async togglePing(message, args) {
        const action = args[0]?.toLowerCase();
        
        if (!['on', 'off', 'enable', 'disable', 'true', 'false'].includes(action)) {
            return message.reply('❌ Gunakan: `on/off`, `enable/disable`, atau `true/false`');
        }

        const enabled = ['on', 'enable', 'true'].includes(action);
        
        this.updateWelcomeSettings(message.guild.id, { pingUser: enabled });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`✅ User Ping ${enabled ? 'Enabled' : 'Disabled'}`)
            .setDescription(`User ${enabled ? 'akan' : 'tidak akan'} di-ping dalam goodbye message`)
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async setAutoDelete(message, args) {
        if (!args[0]) {
            return message.reply('❌ Masukkan waktu dalam detik!\nContoh: `!goodbye delete 30` (30 detik)\nGunakan `0` untuk disable');
        }

        const seconds = parseInt(args[0]);
        
        if (isNaN(seconds) || seconds < 0 || seconds > 3600) {
            return message.reply('❌ Waktu harus berupa angka antara 0-3600 detik (1 jam)');
        }

        this.updateWelcomeSettings(message.guild.id, { deleteAfter: seconds });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Auto Delete Updated')
            .setDescription(seconds > 0 ? 
                `Goodbye messages akan otomatis terhapus setelah ${seconds} detik` :
                'Auto delete telah dinonaktifkan'
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async showTemplates(message) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🎨 Goodbye Template Variables')
            .setDescription('Variables yang bisa digunakan dalam pesan goodbye:')
            .addFields(
                {
                    name: '👤 User Variables',
                    value: '```\n{user} - Mention user (@user)\n{username} - Username saja\n{displayname} - Display name\n{userid} - User ID\n{usertag} - Full user tag\n{avatar} - User avatar URL\n{accountage} - Account creation time ago```',
                    inline: false
                },
                {
                    name: '🏠 Server Variables', 
                    value: '```\n{server} - Server name\n{membercount} - Total members\n{servericon} - Server icon URL\n{serverid} - Server ID\n{owner} - Server owner mention\n{boostcount} - Boost count\n{boostlevel} - Boost level```',
                    inline: false
                },
                {
                    name: '📅 Date/Time Variables',
                    value: '```\n{date} - Current date\n{time} - Current time\n{timestamp} - Unix timestamp\n{joindate} - Member join date\n{joindate:relative} - Join time ago\n{dayofweek} - Day of the week```',
                    inline: false
                },
                {
                    name: '👥 Member Variables',
                    value: '```\n{roles} - User roles list\n{rolecount} - Number of roles\n{highestrole} - Highest role name```',
                    inline: false
                },
                {
                    name: '🎯 Special Variables',
                    value: '```\n{newline} - Line break\n{space} - Extra space\n{mention:role:rolename} - Mention role\n{mention:channel:channelname} - Mention channel\n{random:option1,option2,option3} - Random choice\n{emoji:emojiname} - Custom emoji```',
                    inline: false
                }
            )
            .addFields({
                name: '📋 Example Goodbye Messages',
                value: '**Simple:**\n```{username} telah meninggalkan {server}. Sampai jumpa! 👋```\n\n**Detailed:**\n```Selamat tinggal {user}! 😢\nBergabung: {joindate:relative}\nRoles: {rolecount}\nTotal members: {membercount}```\n\n**Fun:**\n```{random:Sampai jumpa,See you later,Goodbye} {username}!\n{server} akan merindukan mu! 💔```',
                inline: false
            })
            .setFooter({ 
                text: 'Template Variables • Case sensitive', 
                iconURL: message.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async resetSettings(message) {
        // Reset database settings
        this.updateWelcomeSettings(message.guild.id, {
            goodbyeEnabled: false,
            goodbyeMessage: null,
            embedEnabled: true,
            embedColor: '#FAA61A',
            pingUser: true,
            deleteAfter: 0
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🔄 Goodbye Settings Reset')
            .setDescription('Semua pengaturan goodbye telah direset ke default')
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    // Helper functions
    getWelcomeSettings(guildId) {
        try {
            return db.getWelcomeSettings(guildId) || {
                enabled: false,
                channel_id: null,
                goodbye_message: null,
                goodbye_enabled: false,
                goodbye_count: 0,
                embed_enabled: true,
                embed_color: '#FAA61A',
                ping_user: true,
                delete_after: 0,
                updated_at: null
            };
        } catch (error) {
            console.error('Error getting welcome settings:', error);
            return {
                enabled: false,
                channel_id: null,
                goodbye_message: null,
                goodbye_enabled: false,
                goodbye_count: 0,
                embed_enabled: true,
                embed_color: '#FAA61A',
                ping_user: true,
                delete_after: 0,
                updated_at: null
            };
        }
    },

    updateWelcomeSettings(guildId, settings) {
        try {
            return db.setWelcomeSettings(guildId, settings);
        } catch (error) {
            console.error('Error updating welcome settings:', error);
        }
    },

    async getPrefix(guildId) {
        try {
            const { getGuildPrefix } = require('./prefix');
            return getGuildPrefix(guildId);
        } catch (error) {
            return config.prefix;
        }
    },

    processTemplate(template, member, guild) {
        if (!template) return '';
        
        const now = new Date();
        const memberCount = guild.memberCount;
        
        // Helper function for time ago
        const getTimeAgo = (timestamp) => {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            
            let interval = Math.floor(seconds / 31536000);
            if (interval > 1) return `${interval} years ago`;
            if (interval === 1) return '1 year ago';
            
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) return `${interval} months ago`;
            if (interval === 1) return '1 month ago';
            
            interval = Math.floor(seconds / 86400);
            if (interval > 1) return `${interval} days ago`;
            if (interval === 1) return '1 day ago';
            
            interval = Math.floor(seconds / 3600);
            if (interval > 1) return `${interval} hours ago`;
            if (interval === 1) return '1 hour ago';
            
            interval = Math.floor(seconds / 60);
            if (interval > 1) return `${interval} minutes ago`;
            if (interval === 1) return '1 minute ago';
            
            return 'Just now';
        };

        // Replace variables (same as welcome handler)
        return template
            // User variables
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{displayname}/g, member.displayName)
            .replace(/{userid}/g, member.user.id)
            .replace(/{usertag}/g, member.user.tag)
            .replace(/{avatar}/g, member.user.displayAvatarURL({ dynamic: true }))
            .replace(/{accountage}/g, getTimeAgo(member.user.createdTimestamp))
            .replace(/{mention}/g, member.toString())
            
            // Server variables
            .replace(/{server}/g, guild.name)
            .replace(/{servername}/g, guild.name)
            .replace(/{membercount}/g, memberCount.toLocaleString())
            .replace(/{servericon}/g, guild.iconURL({ dynamic: true }) || '')
            .replace(/{serverid}/g, guild.id)
            .replace(/{owner}/g, guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown')
            .replace(/{boostcount}/g, guild.premiumSubscriptionCount || 0)
            .replace(/{boostlevel}/g, guild.premiumTier || 0)
            
            // Date/time variables
            .replace(/{date}/g, now.toLocaleDateString())
            .replace(/{time}/g, now.toLocaleTimeString())
            .replace(/{timestamp}/g, Math.floor(now.getTime() / 1000))
            .replace(/{joindate}/g, member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown')
            .replace(/{joindate:relative}/g, member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown')
            .replace(/{dayofweek}/g, now.toLocaleDateString('en-US', { weekday: 'long' }))
            .replace(/{month}/g, now.toLocaleDateString('en-US', { month: 'long' }))
            .replace(/{year}/g, now.getFullYear())
            
            // Member-specific variables
            .replace(/{roles}/g, member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'None')
            .replace(/{rolecount}/g, member.roles.cache.filter(r => r.name !== '@everyone').size)
            .replace(/{highestrole}/g, member.roles.highest.name !== '@everyone' ? member.roles.highest.name : 'None')
            
            // Special variables
            .replace(/{newline}/g, '\n')
            .replace(/{space}/g, ' ')
            .replace(/{tab}/g, '\t')
            
            // Random choices
            .replace(/{random:([^}]+)}/g, (match, options) => {
                const choices = options.split(',').map(s => s.trim());
                return choices[Math.floor(Math.random() * choices.length)];
            })
            
            // Role mentions
            .replace(/{mention:role:([^}]+)}/g, (match, roleName) => {
                const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                return role ? role.toString() : `@${roleName}`;
            })
            
            // Channel mentions
            .replace(/{mention:channel:([^}]+)}/g, (match, channelName) => {
                const channel = guild.channels.cache.find(c => c.name.toLowerCase() === channelName.toLowerCase());
                return channel ? channel.toString() : `#${channelName}`;
            })
            
            // Emojis
            .replace(/{emoji:([^}]+)}/g, (match, emojiName) => {
                const emoji = guild.emojis.cache.find(e => e.name === emojiName);
                return emoji ? emoji.toString() : `:${emojiName}:`;
            });
    }
};
