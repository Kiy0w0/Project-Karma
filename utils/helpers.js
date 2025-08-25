const { EmbedBuilder } = require('discord.js');
const config = require('../config/botConfig');

// Utility functions
const utils = {
    // Format uptime to readable string
    formatUptime: (uptime) => {
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor(uptime / 3600000) % 24;
        const minutes = Math.floor(uptime / 60000) % 60;
        const seconds = Math.floor(uptime / 1000) % 60;
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    },
    
    // Create embed with default styling
    createEmbed: (title, description, color = config.colors.primary, client = null) => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'Karma Bot' });
            
        if (client && client.user) {
            embed.setFooter({ 
                text: 'Karma Bot', 
                iconURL: client.user.displayAvatarURL() 
            });
        }
        
        return embed;
    },
    
    // Check if member has permission
    hasPermission: (member, permission) => {
        return member.permissions.has(permission);
    },
    
    // Get random element from array
    getRandomElement: (array) => {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Validate and parse integer
    parseInteger: (value, min = null, max = null) => {
        const parsed = parseInt(value);
        if (isNaN(parsed)) return null;
        if (min !== null && parsed < min) return null;
        if (max !== null && parsed > max) return null;
        return parsed;
    },
    
    // Format bytes to human readable
    formatBytes: (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};

module.exports = utils;
