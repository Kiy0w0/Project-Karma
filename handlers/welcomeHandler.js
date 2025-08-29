/**
 * Welcome & Goodbye Event Handler
 * Handles member join/leave events with customizable messages
 */

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const config = require('../config/botConfig');
const db = require('../database/database');

class WelcomeHandler {
    constructor() {
        this.processTemplate = this.processTemplate.bind(this);
    }

    /**
     * Handle member join event
     */
    async handleMemberJoin(member) {
        try {
            if (!member.guild) return;
            
            const settings = db.getWelcomeSettings(member.guild.id);
            
            // Check if welcome system is enabled
            if (!settings || !settings.enabled || !settings.welcome_enabled) {
                return;
            }
            
            // Get welcome channel
            const channel = member.guild.channels.cache.get(settings.channel_id);
            if (!channel) {
                console.log(`Welcome channel not found for guild ${member.guild.id}`);
                return;
            }
            
            // Check bot permissions
            const botMember = member.guild.members.me;
            if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
                console.log(`No permission to send welcome message in ${channel.name}`);
                return;
            }
            
            // Get welcome message or use default
            const welcomeMessage = settings.welcome_message || 
                'Selamat datang {user} di server **{server}**! 🎉\nKamu adalah member ke-{membercount:ordinal}.\nSemoga betah ya! 😊';
            
            // Process template variables
            const processedMessage = this.processTemplate(welcomeMessage, member, member.guild);
            
            // Create welcome message
            if (settings.embed_enabled !== false) {
                // Send as embed
                const embed = new EmbedBuilder()
                    .setColor(settings.embed_color || config.colors.success)
                    .setTitle('🎉 Welcome to the Server!')
                    .setDescription(processedMessage)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setFooter({ 
                        text: `Member #${member.guild.memberCount} • ${member.guild.name}`,
                        iconURL: member.guild.iconURL({ dynamic: true }) 
                    })
                    .setTimestamp();
                
                // Add server info field
                embed.addFields({
                    name: '📊 Server Info',
                    value: `**Total Members:** ${member.guild.memberCount.toLocaleString()}\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                    inline: false
                });
                
                const messageOptions = { embeds: [embed] };
                
                // Add ping if enabled
                if (settings.ping_user !== false) {
                    messageOptions.content = member.toString();
                }
                
                const sentMessage = await channel.send(messageOptions);
                
                // Auto-delete after specified time
                if (settings.delete_after > 0) {
                    setTimeout(() => {
                        sentMessage.delete().catch(() => {});
                    }, settings.delete_after * 1000);
                }
                
            } else {
                // Send as plain text
                let messageContent = processedMessage;
                if (settings.ping_user !== false) {
                    messageContent = `${member.toString()}\n${messageContent}`;
                }
                
                const sentMessage = await channel.send(messageContent);
                
                // Auto-delete after specified time
                if (settings.delete_after > 0) {
                    setTimeout(() => {
                        sentMessage.delete().catch(() => {});
                    }, settings.delete_after * 1000);
                }
            }
            
            // Increment welcome count
            db.incrementWelcomeCount(member.guild.id, 'welcome');
            
            console.log(`✅ Welcome message sent for ${member.user.tag} in ${member.guild.name}`);
            
        } catch (error) {
            console.error('Error handling member join:', error);
        }
    }

    /**
     * Handle member leave event
     */
    async handleMemberLeave(member) {
        try {
            if (!member.guild) return;
            
            const settings = db.getWelcomeSettings(member.guild.id);
            
            // Check if goodbye system is enabled
            if (!settings || !settings.enabled || !settings.goodbye_enabled) {
                return;
            }
            
            // Get goodbye channel
            const channel = member.guild.channels.cache.get(settings.channel_id);
            if (!channel) {
                console.log(`Goodbye channel not found for guild ${member.guild.id}`);
                return;
            }
            
            // Check bot permissions
            const botMember = member.guild.members.me;
            if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
                console.log(`No permission to send goodbye message in ${channel.name}`);
                return;
            }
            
            // Get goodbye message or use default
            const goodbyeMessage = settings.goodbye_message || 
                '{username} telah meninggalkan server **{server}**. 😢\nSampai jumpa! Total members sekarang: {membercount}';
            
            // Process template variables
            const processedMessage = this.processTemplate(goodbyeMessage, member, member.guild);
            
            // Create goodbye message
            if (settings.embed_enabled !== false) {
                // Send as embed
                const embed = new EmbedBuilder()
                    .setColor(settings.embed_color || config.colors.warning)
                    .setTitle('👋 Goodbye!')
                    .setDescription(processedMessage)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setFooter({ 
                        text: `${member.guild.name} • ${member.guild.memberCount} members remaining`,
                        iconURL: member.guild.iconURL({ dynamic: true }) 
                    })
                    .setTimestamp();
                
                // Add member info field
                embed.addFields({
                    name: '📊 Member Info',
                    value: `**Username:** ${member.user.tag}\n**Joined:** ${member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown'}\n**Roles:** ${member.roles.cache.filter(r => r.name !== '@everyone').size || 'None'}`,
                    inline: false
                });
                
                const sentMessage = await channel.send({ embeds: [embed] });
                
                // Auto-delete after specified time
                if (settings.delete_after > 0) {
                    setTimeout(() => {
                        sentMessage.delete().catch(() => {});
                    }, settings.delete_after * 1000);
                }
                
            } else {
                // Send as plain text
                const sentMessage = await channel.send(processedMessage);
                
                // Auto-delete after specified time
                if (settings.delete_after > 0) {
                    setTimeout(() => {
                        sentMessage.delete().catch(() => {});
                    }, settings.delete_after * 1000);
                }
            }
            
            // Increment goodbye count
            db.incrementWelcomeCount(member.guild.id, 'goodbye');
            
            console.log(`✅ Goodbye message sent for ${member.user.tag} in ${member.guild.name}`);
            
        } catch (error) {
            console.error('Error handling member leave:', error);
        }
    }

    /**
     * Process template variables in messages
     */
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

        // Replace variables
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
            .replace(/{membercount:ordinal}/g, getOrdinal(memberCount))
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
            .replace(/{joinposition}/g, getOrdinal(memberCount))
            
            // Special variables
            .replace(/{newline}/g, '\n')
            .replace(/{space}/g, ' ')
            .replace(/{tab}/g, '\t')
            
            // Random choices
            .replace(/{random:([^}]+)}/g, (match, options) => {
                const choices = options.split(',').map(s => s.trim());
                return choices[Math.floor(Math.random() * choices.length)];
            })
            
            // Role mentions (basic implementation)
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

    /**
     * Get welcome statistics for a guild
     */
    getWelcomeStats(guildId) {
        try {
            const settings = db.getWelcomeSettings(guildId);
            return {
                welcomeCount: settings?.welcome_count || 0,
                goodbyeCount: settings?.goodbye_count || 0,
                enabled: settings?.enabled || false,
                welcomeEnabled: settings?.welcome_enabled || false,
                goodbyeEnabled: settings?.goodbye_enabled || false,
                channelId: settings?.channel_id,
                lastUpdated: settings?.updated_at
            };
        } catch (error) {
            console.error('Error getting welcome stats:', error);
            return {
                welcomeCount: 0,
                goodbyeCount: 0,
                enabled: false,
                welcomeEnabled: false,
                goodbyeEnabled: false,
                channelId: null,
                lastUpdated: null
            };
        }
    }
}

module.exports = new WelcomeHandler();
