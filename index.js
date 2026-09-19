const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configurações principais obtidas das variáveis de ambiente do Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const VIP_GROUP_CHAT_ID = process.env.VIP_GROUP_CHAT_ID;
const PORT = process.env.PORT || 10000;

// Rota de teste para ver se o servidor está online no Render
app.get('/', (req, res) => {
    res.send('Bot do Telegram a funcionar com sucesso!');
});

// Webhook para receber as mensagens do Telegram (comandos como /start)
app.post(`/bot${TELEGRAM_TOKEN}`, async (req, res) => {
    const update = req.body;

    try {
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            // Se o utilizador enviar /start, o bot responde com as instruções do Pix
            if (text.startsWith('/start')) {
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: `🚀 **Bem-vindo à Alavancagem!**\n\nO acesso ao nosso grupo VIP de alavancagem custa apenas **R$ 2,00**.\n\n🔑 **Chave Pix (copia e cola):**\n\`93d480cc-e6c2-4b67-a0f0-992a9bbbe83b\`\n\n⚠️ *Importante:* Assim que fizeres o pagamento, o sistema deteta e envia o teu link de acesso exclusivo automaticamente na hora!`
                });
            }
        }
        res.status(200).send({ status: 'ok' });
    } catch (error) {
        console.error('Erro ao processar mensagem do Telegram:', error);
        res.status(500).send({ error: 'Erro interno' });
    }
});

// Webhook para receber os avisos de pagamento aprovado da Gateway Pix
app.post('/webhook-pix', async (req, res) => {
    const paymentData = req.body;
    console.log('Pagamento recebido:', paymentData);

    try {
        if (paymentData.status === 'approved' || paymentData.status === 'PAID') {
            const telegramUserChatId = paymentData.user_telegram_id;

            const inviteResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/createChatInviteLink`, {
                chat_id: VIP_GROUP_CHAT_ID,
                member_limit: 1,
                expire_date: Math.floor(Date.now() / 1000) + (3600 * 24)
            });

            const inviteLink = inviteResponse.data.result.invite_link;

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: telegramUserChatId,
                text: `🎉 **Pagamento aprovado com sucesso!**\n\nAqui tens o teu link de acesso exclusivo para o grupo VIP:\n${inviteLink}\n\nBem-vindo à equipa!`
            });
        }

        res.status(200).send({ status: 'ok' });
    } catch (error) {
        console.error('Erro ao processar o webhook de pagamento:', error);
        res.status(500).send({ error: 'Erro interno' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
