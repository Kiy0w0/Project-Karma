const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar semua command',
    usage: 'help [command]',
    category: 'general',
    cooldown: 3,
    
    async execute(message, args, client) {
        if (args[0]) {
            // Show specific command help
            const command = client.commands.get(args[0].toLowerCase());
            if (!command) {
                const embed = new EmbedBuilder()
                    .setTitle('❓ Command Not Found')
                    .setDescription(`Command \`${args[0]}\` tidak ditemukan!`)
                    .setColor(config.colors.error)
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`📋 Help: ${command.name}`)
                .setDescription(command.description || 'Tidak ada deskripsi')
                .addFields(
                    { name: 'Usage', value: `\`${config.prefix}${command.usage || command.name}\``, inline: true },
                    { name: 'Category', value: command.category || 'General', inline: true },
                    { name: 'Cooldown', value: `${command.cooldown || 3}s`, inline: true }
                )
                .setColor(config.colors.info)
                .setTimestamp();
            
            if (command.aliases) {
                embed.addFields({ name: 'Aliases', value: command.aliases.join(', '), inline: true });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Show all commands categorized
        const categories = {};
        client.commands.forEach(command => {
            const category = command.category || 'general';
            if (!categories[category]) categories[category] = [];
            categories[category].push(command);
        });
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Karma Bot - Command List')
            .setColor(config.colors.primary)
            .setDescription(`Berikut adalah daftar semua command yang tersedia:\nPrefix: \`${config.prefix}\``)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();
        
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
            text: `Total Commands: ${client.commands.size} | Use ${config.prefix}help [command] for detailed info`,
            iconURL: client.user.displayAvatarURL()
        });
        
        await message.reply({ embeds: [embed] });
    }
};
