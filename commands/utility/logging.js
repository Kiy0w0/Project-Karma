const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

// Get logging settings for a guild
function getLoggingSettings(guildId) {
    try {
        return db.getLoggingSettings(guildId);
    } catch (error) {
        console.error('Error getting logging settings:', error);
        return {
            enabled: false,
            channelId: null,
            events: {
                messageDelete: false,
                messageEdit: false,
                memberJoin: false,
                memberLeave: false,
                channelCreate: false,
                channelDelete: false,
                roleCreate: false,
                roleDelete: false
            }
        };
    }
}

// Set logging settings for a guild
function setLoggingSettings(guildId, settings) {
    try {
        return db.setLoggingSettings(guildId, settings);
    } catch (error) {
        console.error('Error setting logging settings:', error);
        return false;
    }
}

module.exports = {
    name: 'logging',
    description: 'Konfigurasi message logging dan audit log untuk server',
    usage: 'logging <action> [options]',
    category: 'utility',
    aliases: ['log', 'audit'],
    permissions: ['ManageGuild'],
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
        
        const action = args[0]?.toLowerCase();
        const currentSettings = getLoggingSettings(message.guild.id);
        
        // Show current settings if no action provided
        if (!action) {
            const embed = new EmbedBuilder()
                .setTitle('📊 Logging Configuration')
                .setColor(config.colors.info)
                .setDescription(`Konfigurasi logging untuk **${message.guild.name}**`)
                .addFields(
                    { 
                        name: '🔘 Status', 
                        value: currentSettings.enabled ? '✅ Enabled' : '❌ Disabled', 
                        inline: true 
                    },
                    { 
                        name: '📝 Log Channel', 
                        value: currentSettings.channelId ? `<#${currentSettings.channelId}>` : 'Not set', 
                        inline: true 
                    },
                    { 
                        name: '📋 Available Actions', 
                        value: `\`${config.prefix}logging setup\` - Setup logging\n\`${config.prefix}logging enable\` - Enable logging\n\`${config.prefix}logging disable\` - Disable logging\n\`${config.prefix}logging channel <#channel>\` - Set log channel\n\`${config.prefix}logging events\` - Configure events`, 
                        inline: false 
                    }
                );
            
            // Show enabled events
            const enabledEvents = Object.entries(currentSettings.events)
                .filter(([_, enabled]) => enabled)
                .map(([event, _]) => event);
            
            if (enabledEvents.length > 0) {
                embed.addFields({
                    name: '🎯 Enabled Events',
                    value: enabledEvents.map(event => `• ${event}`).join('\n'),
                    inline: false
                });
            }
            
            embed.setFooter({ text: 'Karma Bot Logging System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Setup logging
        if (action === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('🔧 Logging Setup')
                .setColor(config.colors.warning)
                .setDescription('Ikuti langkah-langkah berikut untuk setup logging:')
                .addFields(
                    { name: '1️⃣ Set Log Channel', value: `\`${config.prefix}logging channel #channel-name\``, inline: false },
                    { name: '2️⃣ Configure Events', value: `\`${config.prefix}logging events\``, inline: false },
                    { name: '3️⃣ Enable Logging', value: `\`${config.prefix}logging enable\``, inline: false },
                    { name: '📋 Requirements', value: '• Bot needs **View Channels** and **Send Messages** permission in log channel\n• You need **Manage Server** permission', inline: false }
                )
                .setFooter({ text: 'Follow the steps in order', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Enable logging
        if (action === 'enable') {
            if (!currentSettings.channelId) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Log Channel Not Set')
                    .setDescription(`Tolong set log channel terlebih dahulu dengan:\n\`${config.prefix}logging channel #channel-name\``)
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            currentSettings.enabled = true;
            const success = setLoggingSettings(message.guild.id, currentSettings);
            
            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Logging Enabled')
                    .setDescription(`Logging telah diaktifkan untuk server **${message.guild.name}**`)
                    .addFields(
                        { name: 'Log Channel', value: `<#${currentSettings.channelId}>`, inline: true },
                        { name: 'Status', value: '🟢 Active', inline: true }
                    )
                    .setColor(config.colors.success)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Disable logging
        if (action === 'disable') {
            currentSettings.enabled = false;
            const success = setLoggingSettings(message.guild.id, currentSettings);
            
            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Logging Disabled')
                    .setDescription(`Logging telah dinonaktifkan untuk server **${message.guild.name}**`)
                    .setColor(config.colors.error)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Set log channel
        if (action === 'channel') {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Invalid Channel')
                    .setDescription(`Tolong mention channel yang valid!\nContoh: \`${config.prefix}logging channel #audit-log\``)
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            if (channel.type !== ChannelType.GuildText) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Invalid Channel Type')
                    .setDescription('Log channel harus berupa text channel!')
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            // Check bot permissions
            const botMember = message.guild.members.me;
            if (!channel.permissionsFor(botMember).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Missing Permissions')
                    .setDescription('Bot memerlukan permission **View Channel**, **Send Messages**, dan **Embed Links** di channel tersebut!')
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            currentSettings.channelId = channel.id;
            const success = setLoggingSettings(message.guild.id, currentSettings);
            
            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Log Channel Set')
                    .setDescription(`Log channel berhasil diset ke ${channel}`)
                    .addFields(
                        { name: 'Channel', value: `${channel}`, inline: true },
                        { name: 'Next Step', value: `Use \`${config.prefix}logging enable\` to activate`, inline: true }
                    )
                    .setColor(config.colors.success)
                    .setTimestamp();
                
                // Send test message to log channel
                const testEmbed = new EmbedBuilder()
                    .setTitle('🔧 Logging Setup')
                    .setDescription('✅ Log channel berhasil dikonfigurasi! Logging events akan muncul di sini.')
                    .setColor(config.colors.success)
                    .setTimestamp();
                
                channel.send({ embeds: [testEmbed] }).catch(console.error);
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Configure events
        if (action === 'events') {
            const eventToggle = args[1]?.toLowerCase();
            const eventName = args[2]?.toLowerCase();
            
            if (!eventToggle || !['enable', 'disable', 'list'].includes(eventToggle)) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Event Configuration')
                    .setColor(config.colors.info)
                    .setDescription('Konfigurasi event yang akan di-log')
                    .addFields(
                        { 
                            name: '📝 Available Events', 
                            value: '• `messageDelete` - Pesan dihapus\n• `messageEdit` - Pesan diedit\n• `memberJoin` - Member join\n• `memberLeave` - Member leave\n• `channelCreate` - Channel dibuat\n• `channelDelete` - Channel dihapus\n• `roleCreate` - Role dibuat\n• `roleDelete` - Role dihapus', 
                            inline: false 
                        },
                        { 
                            name: '🔧 Usage', 
                            value: `\`${config.prefix}logging events enable <event>\`\n\`${config.prefix}logging events disable <event>\`\n\`${config.prefix}logging events list\``, 
                            inline: false 
                        }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (eventToggle === 'list') {
                const enabledEvents = Object.entries(currentSettings.events)
                    .map(([event, enabled]) => `${enabled ? '✅' : '❌'} \`${event}\``)
                    .join('\n');
                
                const embed = new EmbedBuilder()
                    .setTitle('📋 Event Status')
                    .setDescription(enabledEvents)
                    .setColor(config.colors.info)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (!eventName || !currentSettings.events.hasOwnProperty(eventName)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Invalid Event')
                    .setDescription('Event tidak valid! Gunakan `logging events` untuk melihat daftar event.')
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            const isEnable = eventToggle === 'enable';
            currentSettings.events[eventName] = isEnable;
            const success = setLoggingSettings(message.guild.id, currentSettings);
            
            if (success) {
                const embed = new EmbedBuilder()
                    .setTitle(`${isEnable ? '✅' : '❌'} Event ${isEnable ? 'Enabled' : 'Disabled'}`)
                    .setDescription(`Event \`${eventName}\` telah ${isEnable ? 'diaktifkan' : 'dinonaktifkan'}`)
                    .setColor(isEnable ? config.colors.success : config.colors.warning)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Invalid action
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Action')
            .setDescription(`Action tidak valid! Gunakan \`${config.prefix}logging\` untuk melihat panduan.`)
            .setColor(config.colors.error)
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    },
    
    // Export helper functions
    getLoggingSettings,
    setLoggingSettings
};
