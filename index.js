const { Telegraf } = require('telegraf');
const { registerUser } = require('./handlers/startHandler');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Handle /start command
bot.start(async (ctx) => {
  try {
    await registerUser(ctx);
  } catch (error) {
    console.error('Error in /start handler:', error);
    await ctx.reply('❌ Something went wrong. Please try again.');
  }
});

// Handle /help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📱 *USDBot Help*\n\n' +
    '• /start - Open the app\n' +
    '• /help - Show this message\n\n' +
    'Tap the button below to launch the app:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Launch App',
            web_app: {
              url: 'https://cryptoprofit.cloud/miniapp/'
            }
          }
        ]]
      }
    }
  );
});

// Start bot
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (WEBHOOK_URL) {
  // Webhook mode (for production)
  bot.launch({
    webhook: {
      domain: WEBHOOK_URL,
      port: PORT,
      path: '/bot-webhook'
    }
  });
  console.log(`✅ Bot running in webhook mode on port ${PORT}`);
} else {
  // Polling mode (for development)
  bot.launch();
  console.log('✅ Bot running in polling mode');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
