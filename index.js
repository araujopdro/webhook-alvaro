const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api-trial.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log(data);
    res.status(200).send({ status: 'success', body: {...req.body} });
});

app.post('/taxi_webhook_setup', (req, res) => {
    const data = req.body;
    console.log(data);
    
    axios.post(`${taxi_base_url}/cadastrarWebhook`, data)
    .then(response => {
        //setup do token

        console.log(response.data);
    })
    .catch(error => {
        console.error('Error making POST request:', error);
    });

    res.status(200).send({ status: 'success', body: {...req.body} });
});

app.post('/sendpulse_get_token', (req, res) => {
    const data = req.body;
    console.log(data);
    
    axios.post(`${sendpulse_base_url}/oauth/access_token`, data)
    .then(response => {
        console.log(response.data);
        res.status(200).send({ status: 'success', body: {...response.data} });
    })
    .catch(error => {
        console.error('Error making POST request:', error);
    });

});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
