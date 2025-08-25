const config = require('../../config/botConfig');
const utils = require('../../utils/helpers');

module.exports = {
    name: 'clear',
    description: 'Hapus sejumlah pesan di channel',
    usage: 'clear <amount>',
    category: 'moderation',
    aliases: ['purge', 'delete'],
    permissions: ['ManageMessages'],
    cooldown: 5,
    
    async execute(message, args, client) {
        const amount = utils.parseInteger(args[0], 1, config.settings.maxClearMessages);
        
        if (!amount) {
            const embed = utils.createEmbed(
                '🗑️ Invalid Amount',
                `Tolong masukkan jumlah pesan yang valid (1-${config.settings.maxClearMessages})!`,
                config.colors.error,
                client
            );
            return message.reply({ embeds: [embed] });
        }
        
        try {
            // Delete the command message first
            await message.delete().catch(() => {});
            
            // Bulk delete messages
            const deleted = await message.channel.bulkDelete(amount, true);
            
            const embed = utils.createEmbed(
                '🗑️ Messages Cleared',
                `Berhasil menghapus **${deleted.size}** pesan.`,
                config.colors.success,
                client
            );
            
            embed.addFields(
                { name: 'Requested by', value: message.author.tag, inline: true },
                { name: 'Channel', value: message.channel.name, inline: true },
                { name: 'Amount', value: deleted.size.toString(), inline: true }
            );
            
            const reply = await message.channel.send({ embeds: [embed] });
            
            // Delete the confirmation message after a delay
            setTimeout(() => {
                reply.delete().catch(() => {});
            }, config.settings.deleteReplyTime);
            
        } catch (error) {
            console.error('Clear command error:', error);
            const embed = utils.createEmbed(
                '❌ Error',
                'Terjadi error saat menghapus pesan! Pastikan pesan tidak lebih dari 14 hari.',
                config.colors.error,
                client
            );
            await message.reply({ embeds: [embed] });
        }
    }
};
