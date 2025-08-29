/**
 * Welcome & Goodbye Messages Command
 * Allows customization of welcome and goodbye messages with templates
 */

const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

module.exports = {
    name: 'welcome',
    description: 'Mengatur pesan welcome untuk member baru yang bergabung ke server',
    usage: 'welcome <action> [options]',
    aliases: ['greet', 'join'],
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
                return this.setWelcomeMessage(message, args.slice(1));
                
            case 'toggle':
                return this.toggleWelcome(message, args.slice(1));
                
            case 'test':
                return this.testMessage(message);
                
            case 'reset':
                return this.resetSettings(message);
                
            case 'templates':
            case 'variables':
                return this.showTemplates(message);
                
            case 'preview':
                return this.previewMessage(message);
                
            case 'panel':
            case 'buttons':
                return this.showControlPanel(message);
                
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
            .setColor(config.colors.success)
            .setTitle('🎉 Welcome Messages System')
            .setDescription('Sistem pesan welcome untuk member baru yang bergabung ke server')
            .addFields(
                {
                    name: '⚙️ Setup Commands',
                    value: '```\n' +
                        `${prefix}welcome config          - Lihat konfigurasi saat ini\n` +
                        `${prefix}welcome channel #channel - Set channel untuk pesan\n` +
                        `${prefix}welcome toggle <on/off>  - Aktifkan/nonaktifkan\n` +
                        '```',
                    inline: false
                },
                {
                    name: '📝 Message Commands',
                    value: '```\n' +
                        `${prefix}welcome message <text>   - Set pesan welcome\n` +
                        `${prefix}welcome preview          - Preview pesan\n` +
                        `${prefix}welcome test             - Test pesan\n` +
                        '```',
                    inline: false
                },
                {
                    name: '🎨 Customization',
                    value: '```\n' +
                        `${prefix}welcome embed <on/off>   - Toggle embed mode\n` +
                        `${prefix}welcome color <hex>      - Set embed color\n` +
                        `${prefix}welcome ping <on/off>    - Toggle user ping\n` +
                        `${prefix}welcome delete <seconds> - Auto-delete time\n` +
                        '```',
                    inline: false
                },
                {
                    name: '🎯 Utility Commands',
                    value: '```\n' +
                        `${prefix}welcome panel     - Interactive control panel\n` +
                        `${prefix}welcome templates - Lihat template variables\n` +
                        `${prefix}welcome reset    - Reset semua pengaturan\n` +
                        '```',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'Welcome System • Manage Guild Permission Required', 
                iconURL: message.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async showConfig(message) {
        const settings = this.getWelcomeSettings(message.guild.id);
        const prefix = await this.getPrefix(message.guild.id);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`🎉 Welcome Configuration - ${message.guild.name}`)
            .addFields(
                {
                    name: '📊 Status',
                    value: `**Enabled:** ${settings.enabled ? '✅ Yes' : '❌ No'}\n**Channel:** ${settings.channelId ? `<#${settings.channelId}>` : '❌ Not Set'}\n**Welcome:** ${settings.welcomeEnabled ? '✅ On' : '❌ Off'}\n**Goodbye:** ${settings.goodbyeEnabled ? '✅ On' : '❌ Off'}`,
                    inline: true
                },
                {
                    name: '📈 Statistics',
                    value: `**Members Welcomed:** ${settings.welcomeCount || 0}\n**Members Farewelled:** ${settings.goodbyeCount || 0}\n**Last Updated:** ${settings.lastUpdated ? `<t:${Math.floor(settings.lastUpdated / 1000)}:R>` : 'Never'}`,
                    inline: true
                }
            )
            .setTimestamp();

        // Show welcome message preview
        if (settings.welcomeMessage) {
            embed.addFields({
                name: '👋 Welcome Message',
                value: '```\n' + (settings.welcomeMessage.length > 200 ? settings.welcomeMessage.substring(0, 200) + '...' : settings.welcomeMessage) + '\n```',
                inline: false
            });
        }

        // Show goodbye message preview
        if (settings.goodbyeMessage) {
            embed.addFields({
                name: '👋 Goodbye Message',
                value: '```\n' + (settings.goodbyeMessage.length > 200 ? settings.goodbyeMessage.substring(0, 200) + '...' : settings.goodbyeMessage) + '\n```',
                inline: false
            });
        }

        embed.addFields({
            name: '🔧 Quick Setup',
            value: `Use \`${prefix}welcome channel #channel\` to set channel\nUse \`${prefix}welcome templates\` to see available variables`,
            inline: false
        });

        return message.reply({ embeds: [embed] });
    },

    async setChannel(message, args) {
        if (!args[0]) {
            return message.reply('❌ Mention channel yang ingin digunakan!\nContoh: `!welcome channel #general`');
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
            .setTitle('✅ Welcome Channel Updated')
            .setDescription(`Welcome channel berhasil diset ke ${channel}`)
            .addFields({
                name: '📋 Next Steps',
                value: '• Set welcome message dengan `!welcome welcome <message>`\n• Set goodbye message dengan `!welcome goodbye <message>`\n• Aktifkan sistem dengan `!welcome toggle on`',
                inline: false
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async setWelcomeMessage(message, args) {
        if (!args.length) {
            return message.reply('❌ Masukkan pesan welcome!\nContoh: `!welcome welcome Selamat datang {user} di server {server}!`');
        }

        const welcomeMessage = args.join(' ');
        
        if (welcomeMessage.length > 2000) {
            return message.reply('❌ Pesan terlalu panjang! Maksimal 2000 karakter.');
        }

        // Update database
        this.updateWelcomeSettings(message.guild.id, { 
            welcomeMessage: welcomeMessage,
            welcomeEnabled: true
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Welcome Message Updated')
            .setDescription('Pesan welcome berhasil diupdate!')
            .addFields({
                name: '📝 Preview Message',
                value: this.processTemplate(welcomeMessage, message.member, message.guild),
                inline: false
            })
            .setFooter({ text: 'Use !welcome test welcome to test the message' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async setGoodbyeMessage(message, args) {
        if (!args.length) {
            return message.reply('❌ Masukkan pesan goodbye!\nContoh: `!welcome goodbye {user} telah meninggalkan server. Sampai jumpa!`');
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
            .setFooter({ text: 'Use !welcome test goodbye to test the message' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async toggleWelcome(message, args) {
        const action = args[0]?.toLowerCase();
        
        if (!['on', 'off', 'enable', 'disable', 'true', 'false'].includes(action)) {
            return message.reply('❌ Gunakan: `on/off`, `enable/disable`, atau `true/false`');
        }

        const enabled = ['on', 'enable', 'true'].includes(action);
        
        // Check if channel is set
        const settings = this.getWelcomeSettings(message.guild.id);
        if (enabled && !settings.channelId) {
            return message.reply('❌ Set channel terlebih dahulu dengan `!welcome channel #channel`');
        }

        // Update database
        this.updateWelcomeSettings(message.guild.id, { enabled: enabled });

        const embed = new EmbedBuilder()
            .setColor(enabled ? config.colors.success : config.colors.warning)
            .setTitle(`${enabled ? '✅ Welcome System Enabled' : '⏸️ Welcome System Disabled'}`)
            .setDescription(`Welcome system telah ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`)
            .setTimestamp();

        if (enabled) {
            embed.addFields({
                name: '🎉 System Active',
                value: `• Channel: <#${settings.channelId}>\n• Welcome: ${settings.welcomeEnabled ? '✅' : '❌'}\n• Goodbye: ${settings.goodbyeEnabled ? '✅' : '❌'}`,
                inline: false
            });
        }

        return message.reply({ embeds: [embed] });
    },

    async testMessages(message, args) {
        const type = args[0]?.toLowerCase();
        
        if (!['welcome', 'goodbye'].includes(type)) {
            return message.reply('❌ Gunakan: `!welcome test welcome` atau `!welcome test goodbye`');
        }

        const settings = this.getWelcomeSettings(message.guild.id);
        
        if (!settings.channelId) {
            return message.reply('❌ Set channel terlebih dahulu dengan `!welcome channel #channel`');
        }

        const channel = message.guild.channels.cache.get(settings.channelId);
        if (!channel) {
            return message.reply('❌ Welcome channel tidak ditemukan!');
        }

        let messageContent;
        if (type === 'welcome') {
            messageContent = settings.welcomeMessage || 'Selamat datang {user} di server {server}!';
        } else {
            messageContent = settings.goodbyeMessage || '{user} telah meninggalkan server. Sampai jumpa!';
        }

        const processedMessage = this.processTemplate(messageContent, message.member, message.guild);
        
        // Send test message
        const testEmbed = new EmbedBuilder()
            .setColor(type === 'welcome' ? config.colors.success : config.colors.warning)
            .setTitle(`🧪 Test ${type.charAt(0).toUpperCase() + type.slice(1)} Message`)
            .setDescription(processedMessage)
            .setFooter({ text: 'This is a test message' })
            .setTimestamp();

        await channel.send({ embeds: [testEmbed] });

        const confirmEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Test Message Sent')
            .setDescription(`Test ${type} message telah dikirim ke ${channel}`)
            .setTimestamp();

        return message.reply({ embeds: [confirmEmbed] });
    },

    async showTemplates(message) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎨 Template Variables')
            .setDescription('Variables yang bisa digunakan dalam pesan welcome/goodbye:')
            .addFields(
                {
                    name: '👤 User Variables',
                    value: '```\n{user} - Mention user (@user)\n{username} - Username saja\n{displayname} - Display name\n{userid} - User ID\n{avatar} - User avatar URL\n{accountage} - Account creation date```',
                    inline: false
                },
                {
                    name: '🏠 Server Variables', 
                    value: '```\n{server} - Server name\n{membercount} - Total members\n{membercount:ordinal} - Member count (1st, 2nd, etc)\n{servericon} - Server icon URL\n{serverid} - Server ID\n{owner} - Server owner```',
                    inline: false
                },
                {
                    name: '📅 Date/Time Variables',
                    value: '```\n{date} - Current date\n{time} - Current time\n{timestamp} - Unix timestamp\n{joindate} - Member join date\n{dayofweek} - Day of the week```',
                    inline: false
                },
                {
                    name: '🎯 Special Variables',
                    value: '```\n{newline} - Line break\n{space} - Extra space\n{mention:role:rolename} - Mention role\n{random:option1,option2,option3} - Random choice```',
                    inline: false
                }
            )
            .addFields({
                name: '📋 Example Messages',
                value: '**Welcome:**\n```Selamat datang {user} di {server}! 🎉\nKamu adalah member ke-{membercount:ordinal}.\nAkun dibuat: {accountage}```\n\n**Goodbye:**\n```{username} telah meninggalkan {server}. 😢\nTotal members sekarang: {membercount}```',
                inline: false
            })
            .setFooter({ 
                text: 'Template Variables • Case sensitive', 
                iconURL: message.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async previewMessage(message, args) {
        const type = args[0]?.toLowerCase();
        
        if (!['welcome', 'goodbye'].includes(type)) {
            return message.reply('❌ Gunakan: `!welcome preview welcome` atau `!welcome preview goodbye`');
        }

        const settings = this.getWelcomeSettings(message.guild.id);
        
        let messageContent;
        if (type === 'welcome') {
            messageContent = settings.welcomeMessage || 'Selamat datang {user} di server {server}!';
        } else {
            messageContent = settings.goodbyeMessage || '{user} telah meninggalkan server. Sampai jumpa!';
        }

        const processedMessage = this.processTemplate(messageContent, message.member, message.guild);
        
        const embed = new EmbedBuilder()
            .setColor(type === 'welcome' ? config.colors.success : config.colors.warning)
            .setTitle(`👀 Preview ${type.charAt(0).toUpperCase() + type.slice(1)} Message`)
            .addFields(
                {
                    name: '📝 Raw Template',
                    value: '```\n' + messageContent + '\n```',
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

    async showControlPanel(message) {
        const settings = this.getWelcomeSettings(message.guild.id);
        const buttonHandler = require('../../handlers/buttonHandler');
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎉 Welcome Control Panel')
            .setDescription('Gunakan button di bawah untuk mengatur welcome system dengan mudah!')
            .addFields(
                {
                    name: '📊 Current Status',
                    value: `**System:** ${settings.enabled ? '✅ Enabled' : '❌ Disabled'}\n**Welcome:** ${settings.welcome_enabled ? '✅ On' : '❌ Off'}\n**Channel:** ${settings.channel_id ? `<#${settings.channel_id}>` : '❌ Not Set'}`,
                    inline: true
                },
                {
                    name: '🎨 Appearance',
                    value: `**Embed:** ${settings.embed_enabled !== false ? '✅ On' : '❌ Off'}\n**Color:** ${settings.embed_color || '#7289DA'}\n**Ping User:** ${settings.ping_user !== false ? '✅ Yes' : '❌ No'}`,
                    inline: true
                },
                {
                    name: '📈 Statistics',
                    value: `**Members Welcomed:** ${settings.welcome_count || 0}\n**Auto Delete:** ${settings.delete_after > 0 ? `${settings.delete_after}s` : '❌ Disabled'}`,
                    inline: true
                }
            )
            .setFooter({ 
                text: `Buttons expire in ${buttonHandler.getButtonTimeoutMinutes()} minutes • Interactive Panel`,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const buttons = buttonHandler.createWelcomeButtons(message.author.id);

        return message.reply({ 
            embeds: [embed], 
            components: buttons 
        });
    },

    async resetSettings(message) {
        // Reset database settings
        this.updateWelcomeSettings(message.guild.id, {
            enabled: false,
            channelId: null,
            welcomeMessage: null,
            goodbyeMessage: null,
            welcomeEnabled: false,
            goodbyeEnabled: false
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🔄 Settings Reset')
            .setDescription('Semua pengaturan welcome/goodbye telah direset ke default')
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    // Helper functions
    getWelcomeSettings(guildId) {
        try {
            return db.getWelcomeSettings(guildId) || {
                enabled: false,
                channelId: null,
                welcomeMessage: null,
                goodbyeMessage: null,
                welcomeEnabled: false,
                goodbyeEnabled: false,
                welcomeCount: 0,
                goodbyeCount: 0,
                lastUpdated: null
            };
        } catch (error) {
            console.error('Error getting welcome settings:', error);
            return {
                enabled: false,
                channelId: null,
                welcomeMessage: null,
                goodbyeMessage: null,
                welcomeEnabled: false,
                goodbyeEnabled: false,
                welcomeCount: 0,
                goodbyeCount: 0,
                lastUpdated: null
            };
        }
    },

    updateWelcomeSettings(guildId, settings) {
        try {
            settings.lastUpdated = Date.now();
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
        
        // Helper function for ordinal numbers
        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        // Replace variables
        return template
            // User variables
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{displayname}/g, member.displayName)
            .replace(/{userid}/g, member.user.id)
            .replace(/{avatar}/g, member.user.displayAvatarURL({ dynamic: true }))
            .replace(/{accountage}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            
            // Server variables
            .replace(/{server}/g, guild.name)
            .replace(/{membercount:ordinal}/g, getOrdinal(memberCount))
            .replace(/{membercount}/g, memberCount.toLocaleString())
            .replace(/{servericon}/g, guild.iconURL({ dynamic: true }) || '')
            .replace(/{serverid}/g, guild.id)
            .replace(/{owner}/g, guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown')
            
            // Date/time variables
            .replace(/{date}/g, now.toLocaleDateString())
            .replace(/{time}/g, now.toLocaleTimeString())
            .replace(/{timestamp}/g, Math.floor(now.getTime() / 1000))
            .replace(/{joindate}/g, member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown')
            .replace(/{dayofweek}/g, now.toLocaleDateString('en-US', { weekday: 'long' }))
            
            // Special variables
            .replace(/{newline}/g, '\n')
            .replace(/{space}/g, ' ')
            
            // Random choices
            .replace(/{random:([^}]+)}/g, (match, options) => {
                const choices = options.split(',').map(s => s.trim());
                return choices[Math.floor(Math.random() * choices.length)];
            })
            
            // Role mentions (basic implementation)
            .replace(/{mention:role:([^}]+)}/g, (match, roleName) => {
                const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                return role ? role.toString() : `@${roleName}`;
            });
    }
};
