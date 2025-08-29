/**
 * Button Handler for Interactive Components
 * Handles button interactions with expiration system
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config/botConfig');
const db = require('../database/database');

class ButtonHandler {
    constructor() {
        this.activeButtons = new Map(); // Store active buttons with expiration
        this.buttonTimeout = 5 * 60 * 1000; // 5 minutes expiration
        
        // Clean expired buttons every minute
        setInterval(() => {
            this.cleanExpiredButtons();
        }, 60 * 1000);
    }

    /**
     * Handle button interactions
     */
    async handleButtonInteraction(interaction) {
        try {
            const { customId, user, guild } = interaction;
            
            // Check if button is still active
            if (!this.isButtonActive(customId, user.id)) {
                return await interaction.reply({
                    content: '⏰ Button ini sudah tidak aktif. Gunakan command lagi untuk membuat button baru.',
                    ephemeral: true
                });
            }

            // Parse button ID
            const [action, subAction, userId] = customId.split('_');
            
            // Security check - only the user who triggered can use the button
            if (userId && userId !== user.id) {
                return await interaction.reply({
                    content: '❌ Anda tidak memiliki permission untuk menggunakan button ini!',
                    ephemeral: true
                });
            }

            // Handle different button actions
            switch (action) {
                case 'welcome':
                    return await this.handleWelcomeButton(interaction, subAction);
                case 'goodbye':
                    return await this.handleGoodbyeButton(interaction, subAction);
                default:
                    return await interaction.reply({
                        content: '❌ Unknown button action!',
                        ephemeral: true
                    });
            }
            
        } catch (error) {
            console.error('Error handling button interaction:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Terjadi error saat memproses button interaction!',
                    ephemeral: true
                });
            }
        }
    }

    /**
     * Handle modal submissions
     */
    async handleModalSubmit(interaction) {
        try {
            const { customId, user, guild } = interaction;
            
            // Parse modal ID
            const [action, subAction, userId] = customId.split('_');
            
            // Security check
            if (userId && userId !== user.id) {
                return await interaction.reply({
                    content: '❌ Anda tidak memiliki permission untuk menggunakan modal ini!',
                    ephemeral: true
                });
            }

            // Handle different modal actions
            switch (action) {
                case 'welcome':
                    return await this.handleWelcomeModal(interaction, subAction);
                case 'goodbye':
                    return await this.handleGoodbyeModal(interaction, subAction);
                default:
                    return await interaction.reply({
                        content: '❌ Unknown modal action!',
                        ephemeral: true
                    });
            }
            
        } catch (error) {
            console.error('Error handling modal submit:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Terjadi error saat memproses modal submission!',
                    ephemeral: true
                });
            }
        }
    }

    /**
     * Handle welcome button interactions
     */
    async handleWelcomeButton(interaction, subAction) {
        const { guild, user } = interaction;
        
        switch (subAction) {
            case 'setup':
                return await this.showWelcomeSetupModal(interaction);
                
            case 'message':
                return await this.showWelcomeMessageModal(interaction);
                
            case 'channel':
                return await this.showWelcomeChannelModal(interaction);
                
            case 'toggle':
                return await this.toggleWelcomeSystem(interaction);
                
            case 'test':
                return await this.testWelcomeMessage(interaction);
                
            case 'preview':
                return await this.previewWelcomeMessage(interaction);
                
            case 'settings':
                return await this.showWelcomeSettingsButtons(interaction);
                
            case 'color':
                return await this.showColorModal(interaction, 'welcome');
                
            case 'embed':
                return await this.toggleWelcomeEmbed(interaction);
                
            default:
                return await interaction.reply({
                    content: '❌ Unknown welcome action!',
                    ephemeral: true
                });
        }
    }

    /**
     * Show welcome setup modal
     */
    async showWelcomeSetupModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId(`welcome_setup_${interaction.user.id}`)
            .setTitle('🎉 Welcome System Setup');

        const channelInput = new TextInputBuilder()
            .setCustomId('channel')
            .setLabel('Welcome Channel (ID atau #mention)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Contoh: #general atau 123456789')
            .setRequired(true);

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Welcome Message')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Selamat datang {user} di server {server}! 🎉')
            .setRequired(false)
            .setMaxLength(2000);

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Embed Color (Hex)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#7289DA atau blue')
            .setRequired(false);

        const row1 = new ActionRowBuilder().addComponents(channelInput);
        const row2 = new ActionRowBuilder().addComponents(messageInput);
        const row3 = new ActionRowBuilder().addComponents(colorInput);

        modal.addComponents(row1, row2, row3);

        await interaction.showModal(modal);
    }

    /**
     * Show welcome message modal
     */
    async showWelcomeMessageModal(interaction) {
        const settings = db.getWelcomeSettings(interaction.guild.id);
        
        const modal = new ModalBuilder()
            .setCustomId(`welcome_message_${interaction.user.id}`)
            .setTitle('📝 Set Welcome Message');

        const messageInput = new TextInputBuilder()
            .setCustomId('message')
            .setLabel('Welcome Message')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Selamat datang {user} di server {server}! 🎉\nKamu adalah member ke-{membercount:ordinal}.')
            .setValue(settings?.welcome_message || '')
            .setRequired(true)
            .setMaxLength(2000);

        const row = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    /**
     * Show welcome channel modal
     */
    async showWelcomeChannelModal(interaction) {
        const modal = new ModalBuilder()
            .setCustomId(`welcome_channel_${interaction.user.id}`)
            .setTitle('📍 Set Welcome Channel');

        const channelInput = new TextInputBuilder()
            .setCustomId('channel')
            .setLabel('Channel (ID atau #mention)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Contoh: #general atau 123456789')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(channelInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    /**
     * Show color modal
     */
    async showColorModal(interaction, type) {
        const modal = new ModalBuilder()
            .setCustomId(`${type}_color_${interaction.user.id}`)
            .setTitle('🎨 Set Embed Color');

        const colorInput = new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color (Hex atau nama warna)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#7289DA, blue, red, green, dll.')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(colorInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    /**
     * Handle welcome modal submissions
     */
    async handleWelcomeModal(interaction, subAction) {
        const { guild, fields } = interaction;
        
        switch (subAction) {
            case 'setup':
                return await this.processWelcomeSetup(interaction, fields);
                
            case 'message':
                return await this.processWelcomeMessage(interaction, fields);
                
            case 'channel':
                return await this.processWelcomeChannel(interaction, fields);
                
            case 'color':
                return await this.processWelcomeColor(interaction, fields);
                
            default:
                return await interaction.reply({
                    content: '❌ Unknown welcome modal action!',
                    ephemeral: true
                });
        }
    }

    /**
     * Process welcome setup
     */
    async processWelcomeSetup(interaction, fields) {
        const channelValue = fields.getTextInputValue('channel');
        const messageValue = fields.getTextInputValue('message');
        const colorValue = fields.getTextInputValue('color');

        // Parse channel
        let channelId = channelValue.replace(/[<#>]/g, '');
        const channel = interaction.guild.channels.cache.get(channelId);
        
        if (!channel) {
            return await interaction.reply({
                content: '❌ Channel tidak ditemukan!',
                ephemeral: true
            });
        }

        // Validate color
        let color = '#7289DA';
        if (colorValue) {
            const namedColors = {
                'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
                'yellow': '#FFFF00', 'purple': '#800080', 'orange': '#FFA500',
                'pink': '#FFC0CB', 'cyan': '#00FFFF'
            };
            
            if (namedColors[colorValue.toLowerCase()]) {
                color = namedColors[colorValue.toLowerCase()];
            } else if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
                color = colorValue;
            }
        }

        // Update settings
        db.setWelcomeSettings(interaction.guild.id, {
            enabled: true,
            channelId: channel.id,
            welcomeEnabled: true,
            welcomeMessage: messageValue || 'Selamat datang {user} di server **{server}**! 🎉',
            embedColor: color
        });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Welcome System Setup Complete!')
            .setDescription('Welcome system berhasil dikonfigurasi!')
            .addFields(
                { name: '📍 Channel', value: channel.toString(), inline: true },
                { name: '🎨 Color', value: color, inline: true },
                { name: '📝 Message Preview', value: messageValue || 'Selamat datang {user} di server **{server}**! 🎉', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Process welcome message
     */
    async processWelcomeMessage(interaction, fields) {
        const message = fields.getTextInputValue('message');
        
        db.setWelcomeSettings(interaction.guild.id, {
            welcomeMessage: message,
            welcomeEnabled: true
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Welcome Message Updated!')
            .addFields({
                name: '📝 New Message',
                value: message,
                inline: false
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Process welcome channel
     */
    async processWelcomeChannel(interaction, fields) {
        const channelValue = fields.getTextInputValue('channel');
        let channelId = channelValue.replace(/[<#>]/g, '');
        const channel = interaction.guild.channels.cache.get(channelId);
        
        if (!channel) {
            return await interaction.reply({
                content: '❌ Channel tidak ditemukan!',
                ephemeral: true
            });
        }

        db.setWelcomeSettings(interaction.guild.id, {
            channelId: channel.id
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Welcome Channel Updated!')
            .setDescription(`Welcome channel berhasil diset ke ${channel}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Process welcome color
     */
    async processWelcomeColor(interaction, fields) {
        const colorValue = fields.getTextInputValue('color');
        
        const namedColors = {
            'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
            'yellow': '#FFFF00', 'purple': '#800080', 'orange': '#FFA500',
            'pink': '#FFC0CB', 'cyan': '#00FFFF'
        };
        
        let color;
        if (namedColors[colorValue.toLowerCase()]) {
            color = namedColors[colorValue.toLowerCase()];
        } else if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
            color = colorValue;
        } else {
            return await interaction.reply({
                content: '❌ Format warna tidak valid! Gunakan hex (#FF0000) atau nama warna (red, blue, etc.)',
                ephemeral: true
            });
        }

        db.setWelcomeSettings(interaction.guild.id, {
            embedColor: color
        });

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✅ Welcome Color Updated!')
            .setDescription(`Warna embed welcome berhasil diubah ke ${color}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Toggle welcome system
     */
    async toggleWelcomeSystem(interaction) {
        const settings = db.getWelcomeSettings(interaction.guild.id);
        const newState = !settings?.enabled;
        
        if (newState && !settings?.channel_id) {
            return await interaction.reply({
                content: '❌ Set channel terlebih dahulu sebelum mengaktifkan welcome system!',
                ephemeral: true
            });
        }

        db.setWelcomeSettings(interaction.guild.id, {
            enabled: newState,
            welcomeEnabled: newState
        });

        const embed = new EmbedBuilder()
            .setColor(newState ? config.colors.success : config.colors.warning)
            .setTitle(`${newState ? '✅ Welcome System Enabled' : '⏸️ Welcome System Disabled'}`)
            .setDescription(`Welcome system telah ${newState ? 'diaktifkan' : 'dinonaktifkan'}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Toggle welcome embed
     */
    async toggleWelcomeEmbed(interaction) {
        const settings = db.getWelcomeSettings(interaction.guild.id);
        const newState = !(settings?.embed_enabled !== false);
        
        db.setWelcomeSettings(interaction.guild.id, {
            embedEnabled: newState
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`✅ Embed Mode ${newState ? 'Enabled' : 'Disabled'}`)
            .setDescription(`Welcome messages akan ${newState ? 'menggunakan embed' : 'dikirim sebagai text biasa'}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Test welcome message
     */
    async testWelcomeMessage(interaction) {
        const settings = db.getWelcomeSettings(interaction.guild.id);
        
        if (!settings?.channel_id) {
            return await interaction.reply({
                content: '❌ Set channel terlebih dahulu!',
                ephemeral: true
            });
        }

        const channel = interaction.guild.channels.cache.get(settings.channel_id);
        if (!channel) {
            return await interaction.reply({
                content: '❌ Welcome channel tidak ditemukan!',
                ephemeral: true
            });
        }

        // Use welcome handler to send test message
        const welcomeHandler = require('./welcomeHandler');
        await welcomeHandler.handleMemberJoin(interaction.member);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('✅ Test Message Sent!')
            .setDescription(`Test welcome message telah dikirim ke ${channel}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Preview welcome message
     */
    async previewWelcomeMessage(interaction) {
        const settings = db.getWelcomeSettings(interaction.guild.id);
        const welcomeMessage = settings?.welcome_message || 
            'Selamat datang {user} di server **{server}**! 🎉';

        // Process template
        const welcomeHandler = require('./welcomeHandler');
        const processedMessage = welcomeHandler.processTemplate(welcomeMessage, interaction.member, interaction.guild);

        const embed = new EmbedBuilder()
            .setColor(settings?.embed_color || config.colors.success)
            .setTitle('👀 Preview Welcome Message')
            .addFields(
                {
                    name: '📝 Raw Template',
                    value: '```\n' + welcomeMessage + '\n```',
                    inline: false
                },
                {
                    name: '🎨 Processed Result',
                    value: processedMessage,
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    /**
     * Create welcome control buttons
     */
    createWelcomeButtons(userId) {
        const buttonId = `welcome_main_${userId}`;
        this.registerButton(buttonId, userId);

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`welcome_setup_${userId}`)
                    .setLabel('Quick Setup')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚙️'),
                new ButtonBuilder()
                    .setCustomId(`welcome_message_${userId}`)
                    .setLabel('Set Message')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId(`welcome_channel_${userId}`)
                    .setLabel('Set Channel')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📍')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`welcome_toggle_${userId}`)
                    .setLabel('Toggle System')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId(`welcome_test_${userId}`)
                    .setLabel('Test Message')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧪'),
                new ButtonBuilder()
                    .setCustomId(`welcome_preview_${userId}`)
                    .setLabel('Preview')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👀'),
                new ButtonBuilder()
                    .setCustomId(`welcome_settings_${userId}`)
                    .setLabel('Advanced')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎛️')
            );

        return [row1, row2];
    }

    /**
     * Create welcome settings buttons
     */
    createWelcomeSettingsButtons(userId) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`welcome_color_${userId}`)
                    .setLabel('Set Color')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎨'),
                new ButtonBuilder()
                    .setCustomId(`welcome_embed_${userId}`)
                    .setLabel('Toggle Embed')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        return [row];
    }

    /**
     * Register button with expiration
     */
    registerButton(buttonId, userId) {
        const expirationTime = Date.now() + this.buttonTimeout;
        this.activeButtons.set(buttonId, {
            userId: userId,
            expiresAt: expirationTime
        });
    }

    /**
     * Check if button is still active
     */
    isButtonActive(buttonId, userId) {
        const buttonData = this.activeButtons.get(buttonId);
        if (!buttonData) return false;
        
        if (Date.now() > buttonData.expiresAt) {
            this.activeButtons.delete(buttonId);
            return false;
        }
        
        return buttonData.userId === userId;
    }

    /**
     * Clean expired buttons
     */
    cleanExpiredButtons() {
        const now = Date.now();
        for (const [buttonId, buttonData] of this.activeButtons.entries()) {
            if (now > buttonData.expiresAt) {
                this.activeButtons.delete(buttonId);
            }
        }
    }

    /**
     * Get button timeout in minutes
     */
    getButtonTimeoutMinutes() {
        return Math.floor(this.buttonTimeout / (60 * 1000));
    }
}

module.exports = new ButtonHandler();
