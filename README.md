# 🤖 Karma Bot

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

![Status](https://img.shields.io/badge/status-ready-brightgreen?style=for-the-badge)
![Commands](https://img.shields.io/badge/commands-15+-orange?style=for-the-badge)

</div>

**Karma Bot** adalah Discord bot yang powerful dan modular dengan sistem command berbasis prefix. Dirancang untuk multi-server dengan fitur-fitur modern.

## ✨ Key Features

• 📋 **Modular Commands** • ⚙️ **Custom Prefix** • 🛡️ **Error Handling** • 📊 **Analytics**


## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp env.example .env

# 3. Edit .env with your bot credentials
DISCORD_TOKEN=your_bot_token_here
PREFIX=!
CLIENT_ID=your_client_id_here

# 4. Start the bot
npm start
```

## 📋 Commands

| Category | Command | Description |
|----------|---------|-------------|
| **General** | `!help` | Command List |
| | `!ping` | Latency Bot |
| | `!info` | Bot Info |
| | `!invite` |  Bot Invite Link |
| | `!stats` | Global Stas for bot |
| **Utility** | `!prefix` | Change Prefix |
| **Moderation** | `!clear` | Remove Messages |

## 🛠️ Development

```javascript
// Template untuk command baru
module.exports = {
    name: 'commandname',
    description: 'Deskripsi command',
    category: 'general',
    cooldown: 3,
    
    async execute(message, args, client) {
        // Command logic here
    }
};
```

## 🤝 Contributing

<div align="center">

![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-brightgreen?style=for-the-badge)
![Pull Requests](https://img.shields.io/badge/PRs-welcome-blue?style=for-the-badge)
![Open Source](https://img.shields.io/badge/open%20source-❤️-red?style=for-the-badge)

</div>

**Contributors are open!** We welcome contributions from developers of all skill levels. Here's how you can help:

### 📋 Getting Started
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a new branch for your feature
4. **Make** your changes
5. **Test** your changes
6. **Submit** a pull request

### 💡 Development Guidelines
- Follow existing code style
- Write clear commit messages
- Test your changes thoroughly
- Update documentation if needed

## 📄 License

MIT License © [Kiy0w0](https://github.com/kiy0w0)

---

<div align="center">

**[⭐ Star this repo](https://github.com/kiy0w0/project-karma)** • **[🐛 Report Issue](https://github.com/kiy0w0/project-karma/issues)** • **[💬 Discord](https://discord.gg/)**

Made with ❤️ for the Discord community

</div>
