require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const sheetsManager = require('./sheets');
const topupCommand = require('./commands/topup');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Parse authorized users from environment variable
const authorizedUsers = (process.env.AUTHORIZED_USERS || '').split(',').map(id => id.trim());

// Middleware to check user authorization
bot.use((ctx, next) => {
    const userId = ctx.from?.id.toString();
    // if (!authorizedUsers.includes(userId)) {
    //     return ctx.reply('Sorry, you are not authorized to use this bot.');
    // }
    return next();
});

// Session middleware is required for scenes to work
bot.use(session());

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
/topup - Tạo đơn topup mới cho khách hàng
`;
    ctx.reply(helpMessage);
});

bot.command('myid', (ctx) => {
    ctx.reply(`Your Telegram ID is: ${ctx.from.id}`);
});

// Initialize topup command
topupCommand.initTopupCommand(bot);

// Add global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Add error handling to bot launch
bot.launch()
    .then(() => {
        console.log('Bot is running...');
    })
    .catch((err) => {
        console.error('Bot launch failed:', err);
    });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));