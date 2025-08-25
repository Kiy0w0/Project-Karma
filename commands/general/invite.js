const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'invite',
    description: 'Dapatkan link untuk mengundang bot ke server lain',
    usage: 'invite',
    category: 'general',
    aliases: ['inv', 'add'],
    cooldown: 5,
    
    async execute(message, args, client) {
        const clientId = process.env.CLIENT_ID || client.user.id;
        
        // Bot permissions yang dibutuhkan
        const permissions = [
            'ViewChannel',
            'SendMessages',
            'EmbedLinks',
            'AttachFiles',
            'ReadMessageHistory',
            'UseExternalEmojis',
            'AddReactions',
            'ManageMessages', // Untuk clear command
            'KickMembers',    // Untuk kick command  
            'BanMembers',     // Untuk ban command
            'MuteMembers'     // Untuk mute command
        ];
        
        // Convert permissions to bitfield
        const permissionsBitfield = permissions.reduce((acc, perm) => {
            return acc | (1n << BigInt(Object.keys(require('discord.js').PermissionFlagsBits).indexOf(perm)));
        }, 0n);
        
        // Create invite URL
        const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissionsBitfield}&scope=bot%20applications.commands`;
        
        const embed = new EmbedBuilder()
            .setTitle('🤖 Invite Karma Bot')
            .setColor(config.colors.primary)
            .setDescription('Terima kasih ingin mengundang Karma Bot ke server Anda!')
            .addFields(
                {
                    name: '🎯 Features',
                    value: '• Modular Command System\n• Rich Embeds & Interactions\n• Moderation Tools\n• Fun Commands\n• Utility Commands\n• Easy Configuration',
                    inline: false
                },
                {
                    name: '🔧 Permissions Needed',
                    value: '• Send Messages\n• Embed Links\n• Manage Messages\n• Read Message History\n• Add Reactions',
                    inline: true
                },
                {
                    name: '📋 Commands',
                    value: `• ${client.commands.size}+ Commands\n• Multiple Categories\n• Prefix: \`${config.prefix}\`\n• Type \`${config.prefix}help\` for list`,
                    inline: true
                }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Karma Bot - Ready for all servers!', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // Create button for invite
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteURL),
                new ButtonBuilder()
                    .setLabel('📚 Documentation')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/your-repo/karma-bot'), // Update with your repo
                new ButtonBuilder()
                    .setLabel('💬 Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server') // Update with your support server
            );
        
        await message.reply({ 
            embeds: [embed], 
            components: [row]
        });
    }
};
