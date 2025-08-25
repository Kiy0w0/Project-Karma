const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'ping',
    description: 'Cek latency bot dan API Discord',
    usage: 'ping',
    category: 'general',
    cooldown: 3,
    
    async execute(message, args, client) {
        const start = Date.now();
        const msg = await message.reply('🏓 Pinging...');
        const latency = Date.now() - start;
        
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(config.colors.success)
            .addFields(
                { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                { name: 'Status', value: latency < 100 ? '🟢 Excellent' : latency < 200 ? '🟡 Good' : '🔴 Poor', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Karma Bot', iconURL: client.user.displayAvatarURL() });
        
        await msg.edit({ content: '', embeds: [embed] });
    }
};
