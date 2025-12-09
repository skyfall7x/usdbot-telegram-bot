const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function registerUser(ctx) {
  const user = ctx.from;
  const firstName = user.first_name || 'User';
  const telegramId = user.id;
  const username = user.username || null;

  // Extract referral code from /start command
  const args = ctx.message.text.split(' ');
  const referralCode = args.length > 1 ? args[1] : null;

  console.log(`📱 User: ${firstName} (ID: ${telegramId}), Referral: ${referralCode}`);

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (!existingUser) {
      // New user - register via Edge Function
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/telegram-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            telegram_id: telegramId,
            first_name: firstName,
            username: username,
            referral_code: referralCode
          })
        }
      );

      if (!response.ok) {
        console.error('Edge Function error:', await response.text());
      }
    }

    // Build MiniApp URL with referral
    const botUsername = process.env.BOT_USERNAME; // contoh: usdtbot_ai_bot

const miniappUrl = referralCode
  ? `https://t.me/${botUsername}/app?startapp=${referralCode}`
  : `https://t.me/${botUsername}/app`;

    // Send welcome message with launch button
    await ctx.reply(
      `👋 Welcome ${firstName}!\n\n` +
      `🚀 Tap the button below to open *CryptoProfit* and start earning!\n\n` +
      `💰 Deposit USDT → Get daily profit → Earn referral commissions`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🚀 Launch App',
              web_app: {
                url: miniappUrl
              }
            }
          ]]
        }
      }
    );

    console.log(`✅ User ${firstName} welcomed successfully`);
  } catch (error) {
    console.error('Error registering user:', error);
    await ctx.reply('❌ Error opening app. Please try again.');
  }
}

module.exports = { registerUser };

