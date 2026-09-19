const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Configurações principais (depois podes colocar estas variáveis no Render)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const VIP_GROUP_CHAT_ID = process.env.VIP_GROUP_CHAT_ID; // ID do teu canal/grupo VIP
const PORT = process.env.PORT || 3000;

// Rota de teste para ver se o servidor está online no Render
app.get('/', (req, res) => {
    res.send('Bot de Análise Esportiva a funcionar com sucesso!');
});

// Webhook para receber os avisos de pagamento aprovado da Gateway Pix
app.post('/webhook-pix', async (req, res) => {
    const paymentData = req.body;
    
    // Aqui podes validar os dados que a tua gateway de pagamento envia (ex: status aprovado)
    console.log('Pagamento recebido:', paymentData);

    try {
        // Exemplo: se o pagamento foi aprovado, geramos um link de convite único no Telegram
        if (paymentData.status === 'approved' || paymentData.status === 'PAID') {
            const telegramUserChatId = paymentData.user_telegram_id; // ID do comprador recolhido no fluxo

            // Pedir ao Telegram um link de convite de uso único para o grupo VIP
            const inviteResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/createChatInviteLink`, {
                chat_id: VIP_GROUP_CHAT_ID,
                member_limit: 1, // Link válido apenas para 1 pessoa
                expire_date: Math.floor(Date.now() / 1000) + (3600 * 24) // Expira em 24 horas se não for usado
            });

            const inviteLink = inviteResponse.data.result.invite_link;

            // Enviar o link de acesso diretamente para o comprador no Telegram
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: telegramUserChatId,
                text: `🎉 Pagamento aprovado com sucesso!\n\nAqui tens o teu link de acesso exclusivo e único para o grupo VIP do @analise.esportiva.pro:\n${inviteLink}\n\nBem-vindo à equipa!`
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
