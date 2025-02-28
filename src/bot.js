require('dotenv').config();
const { Telegraf } = require('telegraf');
const sheetsManager = require('./sheets');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Parse authorized users from environment variable
const authorizedUsers = (process.env.AUTHORIZED_USERS || '').split(',').map(id => id.trim());

// Middleware to check user authorization
bot.use((ctx, next) => {
    const userId = ctx.from?.id.toString();
    if (!authorizedUsers.includes(userId)) {
        return ctx.reply('Sorry, you are not authorized to use this bot.');
    }
    return next();
});

// Start command
bot.command('start', (ctx) => {
    ctx.reply('Chào mừng bạn đến với Bot quản lý tài liệu! 📚\nSử dụng /help để xem danh sách lệnh.');
});

// Help command
bot.command('help', (ctx) => {
    const helpMessage = `
Các lệnh có sẵn:
/start - Khởi động bot
/myid - Hiển thị ID của bạn
/search [từ khóa] - Tìm kiếm tài liệu
/upload - Tải lên tài liệu mới
/add [data1,data2,...] - Thêm dữ liệu vào Google Sheets
/view - Xem dữ liệu từ Google Sheets
`;
    ctx.reply(helpMessage);
});

bot.command('myid', (ctx) => {
    ctx.reply(`Your Telegram ID is: ${ctx.from.id}`);
});

// Initialize Google Sheets connection
let sheetsInitialized = false;
async function initializeSheets() {
    if (!sheetsInitialized) {
        sheetsInitialized = await sheetsManager.init(process.env.GOOGLE_SPREADSHEET_ID);
    }
    return sheetsInitialized;
}

// Add a new row to the sheet
bot.command('add', async (ctx) => {
    if (!await initializeSheets()) {
        return ctx.reply('Failed to connect to Google Sheets');
    }

    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
        return ctx.reply('Please provide data to add. Format: /add data1,data2,data3');
    }

    const rowData = text.split(',').map(item => item.trim());
    const success = await sheetsManager.addRow(0, rowData);
    
    if (success) {
        ctx.reply('Data added successfully!');
    } else {
        ctx.reply('Failed to add data.');
    }
});

// View data from the sheet
bot.command('view', async (ctx) => {
    if (!await initializeSheets()) {
        return ctx.reply('Failed to connect to Google Sheets');
    }
});

// Launch bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((err) => {
    console.error('Bot launch failed:', err);
});


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));