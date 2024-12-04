const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log(data); // Processar os dados recebidos
    res.status(200).send({ status: 'success', body: {...req.body} });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
