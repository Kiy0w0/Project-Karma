const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar semua command',
    usage: 'help [command]',
    category: 'general',
    cooldown: 3,
    
    async execute(message, args, client) {
        // Get guild-specific prefix
        let prefix = config.prefix;
        try {
            const { getGuildPrefix } = require('../utility/prefix');
            prefix = message.guild ? getGuildPrefix(message.guild.id) : config.prefix;
        } catch (error) {
            // Use default prefix if there's an error
        }
        
        if (args[0]) {
            // Show specific command help
            const command = client.commands.get(args[0].toLowerCase());
            if (!command) {
                const embed = new EmbedBuilder()
                    .setTitle('❓ Command Not Found')
                    .setDescription(`Command \`${args[0]}\` tidak ditemukan!`)
                    .setColor(config.colors.error)
                    .setTimestamp();
                
                // Try to send DM only
                try {
                    await message.author.send({ embeds: [embed] });
                    // Delete the original command message if possible
                    if (message.guild && message.deletable) {
                        await message.delete().catch(() => {});
                    }
                    return;
                } catch (dmError) {
                    // If DM fails, send error message to channel
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ DM Error')
                        .setDescription('Tidak bisa mengirim DM. Pastikan DM Anda terbuka untuk bot!')
                        .setColor(config.colors.error)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`📋 Help: ${command.name}`)
                .setDescription(command.description || 'Tidak ada deskripsi')
                .addFields(
                    { name: 'Usage', value: `\`${prefix}${command.usage || command.name}\``, inline: true },
                    { name: 'Category', value: command.category || 'General', inline: true },
                    { name: 'Cooldown', value: `${command.cooldown || 3}s`, inline: true }
                )
                .setColor(config.colors.info)
                .setTimestamp();
            
            if (command.aliases) {
                embed.addFields({ name: 'Aliases', value: command.aliases.join(', '), inline: true });
            }
            
            // Try to send DM only
            try {
                await message.author.send({ embeds: [embed] });
                // Delete the original command message if possible
                if (message.guild && message.deletable) {
                    await message.delete().catch(() => {});
                }
                return;
            } catch (dmError) {
                // If DM fails, send error message to channel
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ DM Error')
                    .setDescription('Tidak bisa mengirim DM. Pastikan DM Anda terbuka untuk bot!')
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }
        }
        
        // Show all commands categorized
        const categories = {};
        client.commands.forEach(command => {
            // Skip hidden commands
            if (command.hidden) return;
            
            const category = command.category || 'general';
            if (!categories[category]) categories[category] = [];
            categories[category].push(command);
        });
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Karma Bot - Command List')
            .setColor(config.colors.primary)
            .setDescription(`Berikut adalah daftar semua command yang tersedia:\nPrefix: \`${prefix}\``)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();
        
        // Add server info if in guild
        if (message.guild) {
            embed.addFields({
                name: '🏠 Server Info',
                value: `Server: **${message.guild.name}**\nPrefix: \`${prefix}\``,
                inline: true
            });
        }
        
        // Add fields for each category
        Object.entries(categories).forEach(([categoryName, commands]) => {
            const categoryEmoji = {
                general: '📋',
                fun: '🎮',
                utility: '🔧',
                moderation: '👮',
                music: '🎵',
                economy: '💰'
            };
            
            const emoji = categoryEmoji[categoryName] || '📁';
            const commandList = commands.map(cmd => `\`${cmd.name}\``).join(', ');
            
            embed.addFields({
                name: `${emoji} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Commands`,
                value: commandList,
                inline: false
            });
        });
        
        embed.setFooter({ 
            text: `Total Commands: ${client.commands.size} | Use ${prefix}help [command] for detailed info`,
            iconURL: client.user.displayAvatarURL()
        });
        
        // Try to send DM only
        try {
            await message.author.send({ embeds: [embed] });
            
            // Delete the original command message if possible
            if (message.guild && message.deletable) {
                await message.delete().catch(() => {});
            }
            return;
            
        } catch (dmError) {
            // If DM fails, send error message to channel
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ DM Error')
                .setDescription('Tidak bisa mengirim DM. Pastikan DM Anda terbuka untuk bot!\n\n**Cara membuka DM:**\n1. Klik kanan nama bot\n2. Pilih "Message"\n3. Coba command help lagi')
                .setColor(config.colors.error)
                .setFooter({ text: 'Help command hanya tersedia via DM' })
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
    }
};
