const fs = require('fs');
const path = require('path');

// Load all commands from the commands directory
function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
    // Create commands folder if it doesn't exist
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
    }
    
    // Read all subdirectories
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        // Skip if it's not a directory
        if (!fs.statSync(folderPath).isDirectory()) {
            // If it's a .js file in root commands folder
            if (folder.endsWith('.js')) {
                try {
                    const command = require(path.join(commandsPath, folder));
                    if (command.name) {
                        client.commands.set(command.name, command);
                        console.log(`✅ Loaded command: ${command.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading command ${folder}:`, error);
                }
            }
            continue;
        }
        
        // Read command files in subfolder
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            try {
                const command = require(filePath);
                if (command.name) {
                    client.commands.set(command.name, command);
                    console.log(`✅ Loaded command: ${command.name} (${folder})`);
                } else {
                    console.warn(`⚠️ Command in ${file} is missing name property`);
                }
            } catch (error) {
                console.error(`❌ Error loading command ${file}:`, error);
            }
        }
    }
    
    console.log(`📁 Total commands loaded: ${client.commands.size}`);
}

module.exports = { loadCommands };
