const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config/botConfig');
const db = require('../database/database');

// Get logging settings using database
function getLoggingSettings(guildId) {
    try {
        return db.getLoggingSettings(guildId);
    } catch (error) {
        console.error('Could not load logging settings:', error);
        return { enabled: false };
    }
}

// Send log to channel
async function sendLog(guild, embed) {
    if (!getLoggingSettings) return;
    
    const settings = getLoggingSettings(guild.id);
    if (!settings.enabled || !settings.channelId) return;
    
    const logChannel = guild.channels.cache.get(settings.channelId);
    if (!logChannel) return;
    
    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to send log message:', error);
    }
}

// Message Delete Logging
async function handleMessageDelete(message) {
    if (!message.guild || message.author?.bot) return;
    
    const settings = getLoggingSettings(message.guild.id);
    if (!settings.enabled || !settings.events.messageDelete) return;
    
    // Log to database
    try {
        db.logMessage(
            message.guild.id,
            message.channel.id,
            message.id,
            message.author?.id || 'unknown',
            message.content || '',
            'delete'
        );
    } catch (error) {
        console.error('Error logging message delete to database:', error);
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .setColor(config.colors.error)
        .addFields(
            { name: '👤 Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown User', inline: true },
            { name: '📝 Channel', value: `${message.channel} (${message.channel.name})`, inline: true },
            { name: '🕒 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();
    
    if (message.content && message.content.length > 0) {
        embed.addFields({ 
            name: '💬 Content', 
            value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content, 
            inline: false 
        });
    }
    
    if (message.attachments.size > 0) {
        const attachments = message.attachments.map(att => att.name).join(', ');
        embed.addFields({ name: '📎 Attachments', value: attachments, inline: false });
    }
    
    await sendLog(message.guild, embed);
}

// Message Edit Logging
async function handleMessageUpdate(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // No content change
    
    const settings = getLoggingSettings(newMessage.guild.id);
    if (!settings.enabled || !settings.events.messageEdit) return;
    
    // Log to database
    try {
        db.logMessage(
            newMessage.guild.id,
            newMessage.channel.id,
            newMessage.id,
            newMessage.author.id,
            newMessage.content || '',
            'edit',
            oldMessage.content || ''
        );
    } catch (error) {
        console.error('Error logging message edit to database:', error);
    }
    
    const embed = new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .setColor(config.colors.warning)
        .addFields(
            { name: '👤 Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
            { name: '📝 Channel', value: `${newMessage.channel} (${newMessage.channel.name})`, inline: true },
            { name: '🔗 Jump to Message', value: `[Click Here](${newMessage.url})`, inline: true }
        )
        .setTimestamp();
    
    if (oldMessage.content) {
        embed.addFields({ 
            name: '📝 Before', 
            value: oldMessage.content.length > 512 ? oldMessage.content.substring(0, 509) + '...' : oldMessage.content, 
            inline: false 
        });
    }
    
    if (newMessage.content) {
        embed.addFields({ 
            name: '📝 After', 
            value: newMessage.content.length > 512 ? newMessage.content.substring(0, 509) + '...' : newMessage.content, 
            inline: false 
        });
    }
    
    await sendLog(newMessage.guild, embed);
}

// Member Join Logging
async function handleMemberJoin(member) {
    const settings = getLoggingSettings(member.guild.id);
    if (!settings.enabled || !settings.events.memberJoin) return;
    
    const embed = new EmbedBuilder()
        .setTitle('📥 Member Joined')
        .setColor(config.colors.success)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
            { name: '👥 Member Count', value: member.guild.memberCount.toString(), inline: true }
        )
        .setTimestamp();
    
    await sendLog(member.guild, embed);
}

// Member Leave Logging
async function handleMemberRemove(member) {
    const settings = getLoggingSettings(member.guild.id);
    if (!settings.enabled || !settings.events.memberLeave) return;
    
    const embed = new EmbedBuilder()
        .setTitle('📤 Member Left')
        .setColor(config.colors.error)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 User', value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: '📅 Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown', inline: true },
            { name: '👥 Member Count', value: member.guild.memberCount.toString(), inline: true }
        )
        .setTimestamp();
    
    await sendLog(member.guild, embed);
}

// Channel Create Logging
async function handleChannelCreate(channel) {
    if (!channel.guild) return;
    
    const settings = getLoggingSettings(channel.guild.id);
    if (!settings.enabled || !settings.events.channelCreate) return;
    
    const channelTypes = {
        0: 'Text Channel',
        2: 'Voice Channel',
        4: 'Category',
        5: 'News Channel',
        13: 'Stage Channel',
        15: 'Forum Channel'
    };
    
    const embed = new EmbedBuilder()
        .setTitle('➕ Channel Created')
        .setColor(config.colors.success)
        .addFields(
            { name: '📝 Name', value: channel.name, inline: true },
            { name: '🏷️ Type', value: channelTypes[channel.type] || 'Unknown', inline: true },
            { name: '🆔 ID', value: channel.id, inline: true }
        )
        .setTimestamp();
    
    if (channel.parent) {
        embed.addFields({ name: '📁 Category', value: channel.parent.name, inline: true });
    }
    
    await sendLog(channel.guild, embed);
}

// Channel Delete Logging
async function handleChannelDelete(channel) {
    if (!channel.guild) return;
    
    const settings = getLoggingSettings(channel.guild.id);
    if (!settings.enabled || !settings.events.channelDelete) return;
    
    const channelTypes = {
        0: 'Text Channel',
        2: 'Voice Channel',
        4: 'Category',
        5: 'News Channel',
        13: 'Stage Channel',
        15: 'Forum Channel'
    };
    
    const embed = new EmbedBuilder()
        .setTitle('➖ Channel Deleted')
        .setColor(config.colors.error)
        .addFields(
            { name: '📝 Name', value: channel.name, inline: true },
            { name: '🏷️ Type', value: channelTypes[channel.type] || 'Unknown', inline: true },
            { name: '🆔 ID', value: channel.id, inline: true }
        )
        .setTimestamp();
    
    if (channel.parent) {
        embed.addFields({ name: '📁 Category', value: channel.parent.name, inline: true });
    }
    
    await sendLog(channel.guild, embed);
}

// Role Create Logging
async function handleRoleCreate(role) {
    const settings = getLoggingSettings(role.guild.id);
    if (!settings.enabled || !settings.events.roleCreate) return;
    
    const embed = new EmbedBuilder()
        .setTitle('🏷️ Role Created')
        .setColor(role.color || config.colors.success)
        .addFields(
            { name: '📝 Name', value: role.name, inline: true },
            { name: '🎨 Color', value: role.hexColor, inline: true },
            { name: '🆔 ID', value: role.id, inline: true },
            { name: '📍 Position', value: role.position.toString(), inline: true },
            { name: '🔒 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
            { name: '👁️ Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true }
        )
        .setTimestamp();
    
    await sendLog(role.guild, embed);
}

// Role Delete Logging
async function handleRoleDelete(role) {
    const settings = getLoggingSettings(role.guild.id);
    if (!settings.enabled || !settings.events.roleDelete) return;
    
    const embed = new EmbedBuilder()
        .setTitle('🗑️ Role Deleted')
        .setColor(config.colors.error)
        .addFields(
            { name: '📝 Name', value: role.name, inline: true },
            { name: '🎨 Color', value: role.hexColor, inline: true },
            { name: '🆔 ID', value: role.id, inline: true },
            { name: '📍 Position', value: role.position.toString(), inline: true },
            { name: '👥 Member Count', value: role.members.size.toString(), inline: true }
        )
        .setTimestamp();
    
    await sendLog(role.guild, embed);
}

module.exports = {
    handleMessageDelete,
    handleMessageUpdate,
    handleMemberJoin,
    handleMemberRemove,
    handleChannelCreate,
    handleChannelDelete,
    handleRoleCreate,
    handleRoleDelete
};
