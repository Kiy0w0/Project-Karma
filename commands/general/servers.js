const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');

module.exports = {
    name: 'servers',
    description: 'Menampilkan daftar server dimana bot berada (Owner only)',
    usage: 'servers',
    category: 'general',
    aliases: ['guilds', 'serverlist'],
    ownerOnly: true,
    cooldown: 10,
    
    async execute(message, args, client) {
        const guilds = client.guilds.cache;
        const totalGuilds = guilds.size;
        const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        // Sort guilds by member count (descending)
        const sortedGuilds = guilds.sort((a, b) => b.memberCount - a.memberCount);
        
        const embed = new EmbedBuilder()
            .setTitle('🌐 Server List')
            .setColor(config.colors.info)
            .setDescription(`Bot aktif di **${totalGuilds}** server dengan total **${totalMembers.toLocaleString()}** members`)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `Total Servers: ${totalGuilds}`, iconURL: client.user.displayAvatarURL() });
        
        // Create server list with pagination if too many servers
        const serversPerPage = 10;
        const page = parseInt(args[0]) || 1;
        const startIndex = (page - 1) * serversPerPage;
        const endIndex = startIndex + serversPerPage;
        
        const serverArray = Array.from(sortedGuilds.values());
        const serversOnPage = serverArray.slice(startIndex, endIndex);
        
        if (serversOnPage.length === 0) {
            embed.setDescription('Tidak ada server pada halaman ini.');
            return message.reply({ embeds: [embed] });
        }
        
        // Add server info fields
        serversOnPage.forEach((guild, index) => {
            const globalIndex = startIndex + index + 1;
            const owner = guild.members.cache.get(guild.ownerId)?.user?.tag || 'Unknown';
            const created = new Date(guild.createdTimestamp).toLocaleDateString();
            
            embed.addFields({
                name: `${globalIndex}. ${guild.name}`,
                value: `**Members:** ${guild.memberCount.toLocaleString()}\n**Owner:** ${owner}\n**Created:** ${created}\n**ID:** ${guild.id}`,
                inline: true
            });
        });
        
        // Add pagination info
        const totalPages = Math.ceil(totalGuilds / serversPerPage);
        if (totalPages > 1) {
            embed.setDescription(
                `Bot aktif di **${totalGuilds}** server dengan total **${totalMembers.toLocaleString()}** members\n\n**Halaman ${page} dari ${totalPages}**\nGunakan \`${config.prefix}servers [page]\` untuk halaman lain`
            );
        }
        
        // Add top servers summary
        if (page === 1) {
            const topServers = serverArray.slice(0, 3);
            const topServersList = topServers.map((guild, index) => 
                `${index + 1}. **${guild.name}** (${guild.memberCount.toLocaleString()} members)`
            ).join('\n');
            
            embed.addFields({
                name: '🏆 Top 3 Servers by Members',
                value: topServersList,
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};
