const express = require('express');
const app = express();
const port = 3000;

// Middleware para processar JSON
app.use(express.json());

// Rota para o webhook
app.post('/webhook', (req, res) => {
    console.log('Payload recebido:', req.body);
    res.status(200).send('Webhook recebido com sucesso!');
});

app.listen(port, () => {
    console.log(`Servidor ouvindo na porta ${port}`);
});