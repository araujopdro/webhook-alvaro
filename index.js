const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api-trial.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";

let sendpulse_tkn;

app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


//
app.post('/taxi_webhook_setup', (req, res) => {
    const data = req.body;
    console.log(data);
    

    const webhook_data = {
        "tipo": "status",
        "url": "http://193.203.182.20:3000/webhook_listener",
        "responsbilidade": "<string>"
        /**
          Obrigatório caso o usuário autentica não seja de empresa. 
          Indica qual o responsável pelo evento
          Valores aceitos: 
          solicitante (quem abre a corrida), 
          corrida (quem aceita a corrida) ou 
          empresa (empresa responsável pela corrida)
        */
    }

    axios.post(`${taxi_base_url}/cadastrarWebhook`, data)
    .then(response => {

        console.log(response.data);
    
    
    })
    .catch(error => {
        console.error('Error making POST request:', error);
    });

    res.status(200).send({ status: 'success', body: {...req.body} });
});


//
app.post('/get_sendpulse_token', (req, res) => {
    const data = req.body;
    console.log(data);
    let sendpulse_response = GetSendPulseToken()
    
    res.status(200).send({ status: 'success', body: {...sendpulse_response} });
});


//
app.post('/webhook_listener', (req, res) => {
    const event = req.body;  
    
    console.log('Received webhook event:', event);
    HandleMachineStatus(event)
    
    res.status(200).send('Event received');
});
 
//
app.get('/are_you_there', (req, res) => {
    console.log('Yes');
    
    res.status(200).send('Event received');
});


//
function HandleMachineStatus(e){
    switch(e.status){
        case 'x':
            //status X
            //send status to sendpulse using the token
            //requisição para sendpulse
        case 'y':
            //status y
            //send status to sendpulse using the token
            //requisição para sendpulse
        case 'z':
            //status z
            //send status to sendpulse using the token
            //requisição para sendpulse
        default:
            console.log("Event Handled")
    }
}


//
function GetSendPulseToken(){
    axios.post(`${sendpulse_base_url}/oauth/access_token`, data)
    .then(response => {
        console.log(response.data);
        if(response.data) sendpulse_tkn = response.data.access_token
        return response.data
    })
    .catch(error => {
        console.error('Error making POST request:', error);
    });
}