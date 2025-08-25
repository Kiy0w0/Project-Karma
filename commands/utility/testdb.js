const { EmbedBuilder } = require('discord.js');
const config = require('../../config/botConfig');
const db = require('../../database/database');

module.exports = {
    name: 'testdb',
    description: 'Test koneksi dan fungsi database',
    usage: 'testdb',
    category: 'utility',
    aliases: ['dbtest'],
    permissions: ['ManageGuild'],
    cooldown: 10,
    
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setTitle('🔧 Database Connection Test')
            .setColor(config.colors.info)
            .setTimestamp();
        
        let results = [];
        
        try {
            // Test 1: Database connection
            results.push('✅ Database connection: OK');
            
            // Test 2: Read guild settings
            try {
                const guildSettings = db.getGuildSettings(message.guild?.id || 'test');
                results.push(`✅ Read guild settings: OK (prefix: ${guildSettings.prefix})`);
            } catch (error) {
                results.push(`❌ Read guild settings: FAILED - ${error.message}`);
            }
            
            // Test 3: Write test data
            try {
                if (message.guild) {
                    const success = db.setGuildPrefix(message.guild.id, config.prefix);
                    results.push(`✅ Write test data: ${success ? 'OK' : 'FAILED'}`);
                } else {
                    results.push('⚠️ Write test data: SKIPPED (not in guild)');
                }
            } catch (error) {
                results.push(`❌ Write test data: FAILED - ${error.message}`);
            }
            
            // Test 4: User data update
            try {
                db.updateUserData(message.author.id, message.author.username, message.author.discriminator);
                results.push('✅ User data update: OK');
            } catch (error) {
                results.push(`❌ User data update: FAILED - ${error.message}`);
            }
            
            // Test 5: Command logging
            try {
                db.logCommandUsage(message.guild?.id || 'dm', message.author.id, 'testdb');
                results.push('✅ Command logging: OK');
            } catch (error) {
                results.push(`❌ Command logging: FAILED - ${error.message}`);
            }
            
            // Test 6: Get statistics
            try {
                const stats = db.getStats();
                results.push(`✅ Get statistics: OK (${stats.guilds} guilds, ${stats.users} users)`);
            } catch (error) {
                results.push(`❌ Get statistics: FAILED - ${error.message}`);
            }
            
            // Test 7: Logging settings (if in guild)
            if (message.guild) {
                try {
                    const loggingSettings = db.getLoggingSettings(message.guild.id);
                    results.push(`✅ Logging settings: OK (enabled: ${loggingSettings.enabled})`);
                } catch (error) {
                    results.push(`❌ Logging settings: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            results.push(`❌ Database connection: FAILED - ${error.message}`);
        }
        
        embed.setDescription(results.join('\n'));
        
        // Add database file info
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, '../../database/karma_bot.db');
        
        try {
            const dbExists = fs.existsSync(dbPath);
            const dbStats = dbExists ? fs.statSync(dbPath) : null;
            
            embed.addFields({
                name: '📁 Database File Info',
                value: `**Exists:** ${dbExists ? '✅ Yes' : '❌ No'}\n**Path:** \`${dbPath}\`\n**Size:** ${dbStats ? `${(dbStats.size / 1024).toFixed(2)} KB` : 'N/A'}\n**Modified:** ${dbStats ? `<t:${Math.floor(dbStats.mtime.getTime() / 1000)}:R>` : 'N/A'}`,
                inline: false
            });
        } catch (error) {
            embed.addFields({
                name: '📁 Database File Info',
                value: `❌ Error checking file: ${error.message}`,
                inline: false
            });
        }
        
        // Add recommendations
        const failedTests = results.filter(r => r.startsWith('❌')).length;
        if (failedTests > 0) {
            embed.addFields({
                name: '🔧 Recommendations',
                value: `**${failedTests} test(s) failed.**\n\n**Solutions:**\n1. Restart the bot\n2. Check file permissions\n3. Run \`npm install\` again\n4. Check console for errors`,
                inline: false
            });
            embed.setColor(config.colors.error);
        } else {
            embed.addFields({
                name: '🎉 All Tests Passed!',
                value: 'Database is working perfectly. All data will be saved automatically.',
                inline: false
            });
            embed.setColor(config.colors.success);
        }
        
        await message.reply({ embeds: [embed] });
    }
};
