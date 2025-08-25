const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class BotDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, 'karma_bot.db');
        this.db = null;
        this.init();
    }

    init() {
        try {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Initialize database
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL'); // Better performance
            
            console.log('✅ Database connected successfully');
            this.createTables();
            
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    createTables() {
        try {
            // Guild settings table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS guild_settings (
                    guild_id TEXT PRIMARY KEY,
                    prefix TEXT DEFAULT '!',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Logging settings table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS logging_settings (
                    guild_id TEXT PRIMARY KEY,
                    enabled BOOLEAN DEFAULT FALSE,
                    channel_id TEXT,
                    message_delete BOOLEAN DEFAULT FALSE,
                    message_edit BOOLEAN DEFAULT FALSE,
                    member_join BOOLEAN DEFAULT FALSE,
                    member_leave BOOLEAN DEFAULT FALSE,
                    channel_create BOOLEAN DEFAULT FALSE,
                    channel_delete BOOLEAN DEFAULT FALSE,
                    role_create BOOLEAN DEFAULT FALSE,
                    role_delete BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (guild_id) REFERENCES guild_settings (guild_id)
                )
            `);

            // User data table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS user_data (
                    user_id TEXT PRIMARY KEY,
                    username TEXT,
                    discriminator TEXT,
                    total_commands INTEGER DEFAULT 0,
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Command usage statistics
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS command_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT,
                    user_id TEXT,
                    command_name TEXT,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (guild_id) REFERENCES guild_settings (guild_id),
                    FOREIGN KEY (user_id) REFERENCES user_data (user_id)
                )
            `);

            // Message logs table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS message_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id TEXT,
                    channel_id TEXT,
                    message_id TEXT,
                    user_id TEXT,
                    content TEXT,
                    event_type TEXT, -- 'delete', 'edit', 'create'
                    old_content TEXT, -- for edits
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (guild_id) REFERENCES guild_settings (guild_id),
                    FOREIGN KEY (user_id) REFERENCES user_data (user_id)
                )
            `);

            // Create indexes for better performance
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_command_stats_guild ON command_stats(guild_id);
                CREATE INDEX IF NOT EXISTS idx_command_stats_user ON command_stats(user_id);
                CREATE INDEX IF NOT EXISTS idx_command_stats_command ON command_stats(command_name);
                CREATE INDEX IF NOT EXISTS idx_message_logs_guild ON message_logs(guild_id);
                CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON message_logs(timestamp);
            `);

            console.log('✅ Database tables created successfully');
            
        } catch (error) {
            console.error('❌ Failed to create tables:', error);
        }
    }

    // Guild Settings Methods
    getGuildSettings(guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
            return stmt.get(guildId) || { guild_id: guildId, prefix: '!' };
        } catch (error) {
            console.error('Error getting guild settings:', error);
            return { guild_id: guildId, prefix: '!' };
        }
    }

    setGuildPrefix(guildId, prefix) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO guild_settings (guild_id, prefix, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(guildId, prefix);
            return true;
        } catch (error) {
            console.error('Error setting guild prefix:', error);
            return false;
        }
    }

    // Logging Settings Methods
    getLoggingSettings(guildId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM logging_settings WHERE guild_id = ?');
            const result = stmt.get(guildId);
            
            if (!result) {
                return {
                    guild_id: guildId,
                    enabled: false,
                    channel_id: null,
                    events: {
                        messageDelete: false,
                        messageEdit: false,
                        memberJoin: false,
                        memberLeave: false,
                        channelCreate: false,
                        channelDelete: false,
                        roleCreate: false,
                        roleDelete: false
                    }
                };
            }

            return {
                guild_id: result.guild_id,
                enabled: Boolean(result.enabled),
                channel_id: result.channel_id,
                events: {
                    messageDelete: Boolean(result.message_delete),
                    messageEdit: Boolean(result.message_edit),
                    memberJoin: Boolean(result.member_join),
                    memberLeave: Boolean(result.member_leave),
                    channelCreate: Boolean(result.channel_create),
                    channelDelete: Boolean(result.channel_delete),
                    roleCreate: Boolean(result.role_create),
                    roleDelete: Boolean(result.role_delete)
                }
            };
        } catch (error) {
            console.error('Error getting logging settings:', error);
            return {
                guild_id: guildId,
                enabled: false,
                channel_id: null,
                events: {
                    messageDelete: false,
                    messageEdit: false,
                    memberJoin: false,
                    memberLeave: false,
                    channelCreate: false,
                    channelDelete: false,
                    roleCreate: false,
                    roleDelete: false
                }
            };
        }
    }

    setLoggingSettings(guildId, settings) {
        try {
            // Ensure guild exists in guild_settings
            this.db.prepare(`
                INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)
            `).run(guildId);

            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO logging_settings (
                    guild_id, enabled, channel_id, 
                    message_delete, message_edit, member_join, member_leave,
                    channel_create, channel_delete, role_create, role_delete,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            stmt.run(
                guildId,
                settings.enabled,
                settings.channel_id,
                settings.events.messageDelete,
                settings.events.messageEdit,
                settings.events.memberJoin,
                settings.events.memberLeave,
                settings.events.channelCreate,
                settings.events.channelDelete,
                settings.events.roleCreate,
                settings.events.roleDelete
            );
            
            return true;
        } catch (error) {
            console.error('Error setting logging settings:', error);
            return false;
        }
    }

    // User Data Methods
    updateUserData(userId, username, discriminator) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO user_data (user_id, username, discriminator, last_seen)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(userId, username, discriminator);
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }

    // Command Statistics Methods
    logCommandUsage(guildId, userId, commandName) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO command_stats (guild_id, user_id, command_name)
                VALUES (?, ?, ?)
            `);
            stmt.run(guildId, userId, commandName);
            
            // Update user command count
            const updateUser = this.db.prepare(`
                UPDATE user_data 
                SET total_commands = total_commands + 1, last_seen = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `);
            updateUser.run(userId);
            
        } catch (error) {
            console.error('Error logging command usage:', error);
        }
    }

    getCommandStats(guildId = null, limit = 10) {
        try {
            let query = `
                SELECT command_name, COUNT(*) as usage_count
                FROM command_stats
            `;
            
            if (guildId) {
                query += ` WHERE guild_id = ?`;
            }
            
            query += ` GROUP BY command_name ORDER BY usage_count DESC LIMIT ?`;
            
            const stmt = this.db.prepare(query);
            return guildId ? stmt.all(guildId, limit) : stmt.all(limit);
        } catch (error) {
            console.error('Error getting command stats:', error);
            return [];
        }
    }

    // Message Logs Methods
    logMessage(guildId, channelId, messageId, userId, content, eventType, oldContent = null) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO message_logs (guild_id, channel_id, message_id, user_id, content, event_type, old_content)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(guildId, channelId, messageId, userId, content, eventType, oldContent);
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    // Database maintenance
    cleanup() {
        try {
            // Clean old command stats (older than 30 days)
            this.db.prepare(`
                DELETE FROM command_stats 
                WHERE executed_at < datetime('now', '-30 days')
            `).run();

            // Clean old message logs (older than 7 days)
            this.db.prepare(`
                DELETE FROM message_logs 
                WHERE timestamp < datetime('now', '-7 days')
            `).run();

            console.log('✅ Database cleanup completed');
        } catch (error) {
            console.error('❌ Database cleanup failed:', error);
        }
    }

    // Get database statistics
    getStats() {
        try {
            const guilds = this.db.prepare('SELECT COUNT(*) as count FROM guild_settings').get().count;
            const users = this.db.prepare('SELECT COUNT(*) as count FROM user_data').get().count;
            const commands = this.db.prepare('SELECT COUNT(*) as count FROM command_stats').get().count;
            const messages = this.db.prepare('SELECT COUNT(*) as count FROM message_logs').get().count;

            return { guilds, users, commands, messages };
        } catch (error) {
            console.error('Error getting database stats:', error);
            return { guilds: 0, users: 0, commands: 0, messages: 0 };
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }
}

module.exports = new BotDatabase();
