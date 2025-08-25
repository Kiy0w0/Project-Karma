// Bot configuration file
module.exports = {
    prefix: process.env.PREFIX || '!',
    botOwner: '', 
    
    
    colors: {
        primary: '#7289DA',
        success: '#43B581',
        warning: '#FAA61A',
        error: '#F04747',
        info: '#5865F2'
    },
    
    
    settings: {
        deleteReplyTime: 5000, 
        maxClearMessages: 100,
        maxDiceSides: 100,
        minDiceSides: 2
    }
};
