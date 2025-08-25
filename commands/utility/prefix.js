const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

// Get prefix for a guild
function getGuildPrefix(guildId) {
    try {
        const settings = db.getGuildSettings(guildId);
        return settings.prefix || config.prefix;
    } catch (error) {
        console.error('Error getting guild prefix:', error);
        return config.prefix;
    }
}

// Set prefix for a guild
function setGuildPrefix(guildId, newPrefix) {
    try {
        return db.setGuildPrefix(guildId, newPrefix);
    } catch (error) {
        console.error('Error setting guild prefix:', error);
        return false;
    }
}

module.exports = {
    name: 'prefix',
    description: 'Lihat atau ubah prefix bot untuk server ini',
    usage: 'prefix [new_prefix]',
    category: 'utility',
    aliases: ['setprefix'],
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
        
        const currentPrefix = getGuildPrefix(message.guild.id);
        
        // If no arguments, show current prefix
        if (!args.length) {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Server Prefix')
                .setColor(config.colors.info)
                .addFields(
                    { name: 'Current Prefix', value: `\`${currentPrefix}\``, inline: true },
                    { name: 'Default Prefix', value: `\`${config.prefix}\``, inline: true },
                    { name: 'Usage', value: `\`${currentPrefix}prefix <new_prefix>\``, inline: false }
                )
                .setDescription(`Prefix saat ini untuk **${message.guild.name}** adalah: \`${currentPrefix}\``)
                .setFooter({ text: 'Karma Bot', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Validate new prefix
        const newPrefix = args[0];
        
        if (newPrefix.length > 5) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Prefix')
                .setDescription('Prefix tidak boleh lebih dari 5 karakter!')
                .setColor(config.colors.error)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        if (newPrefix.includes(' ') || newPrefix.includes('\n')) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Invalid Prefix')
                .setDescription('Prefix tidak boleh mengandung spasi atau baris baru!')
                .setColor(config.colors.error)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        // Set new prefix
        const success = setGuildPrefix(message.guild.id, newPrefix);
        
        if (!success) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Gagal menyimpan prefix baru!')
                .setColor(config.colors.error)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Prefix Updated')
            .setColor(config.colors.success)
            .addFields(
                { name: 'Old Prefix', value: `\`${currentPrefix}\``, inline: true },
                { name: 'New Prefix', value: `\`${newPrefix}\``, inline: true },
                { name: 'Example', value: `\`${newPrefix}help\``, inline: true }
            )
            .setDescription(`Prefix berhasil diubah untuk **${message.guild.name}**!`)
            .setFooter({ text: `Changed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    },
    
    // Export helper functions
    getGuildPrefix,
    setGuildPrefix
};
