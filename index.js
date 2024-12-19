require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";
const corridas_to_process = [];

let sendpulse_tkn;

const bot_headers = {
    '671c1c15e2674ddd100159df': {
      api_key: process.env.API_KEY_VALUE_POPCAR,
      auth: process.env.BASIC_AUTHORIZATION_VALUE_POPCAR,
    }
  };

//
app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//
app.post('/corrida_setup', (req, res) => {
    const data = req.body;
    console.log(`corrida cadastrada pelo bot: ${data.bot_id} | ${data.corrida_id}`)
    corridas_to_process.push({...data})
    res.status(200).send({ status: 'success', body: {...req.body} });
});


//
app.post('/webhook_listener', (req, res) => {
    const event = req.body;  
    
    //console.log(event);
    HandleMachineStatus(event)
    
    res.status(200).send('Event received');
});


//
app.get('/runflow', (req, res) => {
    SendPulseFlowToken('671c1c15e2674ddd100159df', '0000000000')

    res.status(200).send('Event received');
});

//
function HandleMachineStatus(e){
    const event_corrida_idx = corridas_to_process.findIndex((c) => c.corrida_id === e.id_mch)
    const event_corrida = event_corrida_idx >= 0 ? corridas_to_process[event_corrida_idx] : null
    console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (${e.status_solicitacao})`)
    if(event_corrida == null) return
    switch(e.status_solicitacao){
        case 'D':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (D): Solicitação aberta e ainda não atribuída a um condutor.`)
            break;
        case 'G':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (G): Esperando um condutor aceitar a solicitação.`)
            break;
        case 'P':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (P): Solicitação não aceita, aguardando aceitação.`)
            break;
        case 'N':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (N): Nenhum condutor aceitou a solicitação.`)
            break;
        case 'A':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (A): Solicitação aceita por um condutor.`)
            if(e.motorista) console.log(`${e.motorista.nome}`)
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (S): Solicitação em espera até a conclusão de uma anterior.`)
            break;
        case 'E':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (E): Corrida iniciada.`)
            break;
        case 'R':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (R): Parada concluída.`)
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (S): Solicitação finalizada pelo condutor.`)
            RemoveCorrida(e.id_mch)
            break;
        case 'F':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (F): Corrida concluída.`)
            RemoveCorrida(e.id_mch)
            break;
        case 'C':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (C): Solicitação cancelada.`)
            RemoveCorrida(e.id_mch)
            break;
        case 'R':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (R): Pagamento pendente de confirmação.`)
            break;
        default:
            console.log('\x1b[31m%s\x1b[0m', `${e.id_mch} (${e.status_solicitacao}): event not handled ;-;`)
            break;
    }

    if(event_corrida != null) SendPulseFlowToken(event_corrida.bot_id, event_corrida.contact_id)
}


//https://api.sendpulse.com/whatsapp/flows?bot_id=671c1c15e2674ddd100159df
//Tries to get the flow list from the BOT_ID, it's a success, run the status related FLOW, to the CONTACT ID
async function SendPulseFlowToken(_bot_id, _contact_id){
    try {
        const response = await axios.get(`${sendpulse_base_url}/whatsapp/flows?bot_id=${_bot_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sendpulse_tkn}`
            }
        })
        //console.log(response.data.data)
        const flow_selected_on_status = response.data.data.find((f) => f.name === 'fluxo-teste')
        console.log(flow_selected_on_status)

        //get list of flows successful, RUN flow
        console.log('SendPulseFlowRun - Token Ok')
        SendPulseFlowRun(_contact_id, flow_selected_on_status)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                const response = await axios.post(`${sendpulse_base_url}/oauth/access_token`, {
                    'grant_type': 'client_credentials',
                    'client_id': process.env.CLIENT_ID,
                    'client_secret': process.env.CLIENT_SECRET
                }, {
                    'Content-Type': 'application/json',
                })
                
                sendpulse_tkn = response.data.access_token
                return SendPulseFlowToken(_bot_id, _contact_id);  // try again with new token
            } catch (tokenError) {
                console.error('Error getting SendPulse Access Token:', tokenError);  // error getting new token
            }
        } else {
            console.error('Error:', error);  // error getting new token
        }
    }
}

//using the contact id and the flow id and runs it
function SendPulseFlowRun(_contact_id, _flow){
    try {
        console.log('SendPulseFlowRun contact_id: ',_contact_id)
        console.log('SendPulseFlowRun _flow_id: ',_flow.id)
        console.log('SendPulse Flow: Run!');  // 
        //await axios.post(`https://api.sendpulse.com/whatsapp/flows/run`, {
        //     'contact_id': `${_contact_id}`,
        //     'flow_id': `${_flow.id}`,
        // }, {
        //     'Content-Type': 'application/json',
        //        'Authorization': `Bearer ${sendpulse_tkn}`
        // })
        console.log('SendPulse Flow: Success!');  // 
    } catch (error) {
        console.error('Error runing SendPulse Flow:', error);  // 
    }
}


//
async function MachineGetPosicaoCondutor(_bot_id, _corrida_id) {
    try {
        //console.log('MachineGetPosicaoCondutor', _bot_id, _corrida_id)
        const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${_corrida_id}`, {
            headers: {
                'api-key': `${bot_headers[_bot_id].api_key}`,
                'Authorization': `${bot_headers[_bot_id].auth}`
            }
        });
        return response.data;
    } catch (error) {
        // if (error.response && error.response.status === 404) {
        //   console.log(`Item ${id} not found, removing from processing list.`);
        //   corridas_to_process.delete(id)
        //   return { id, error: `Item not found` };
        // }
        console.error(`Error fetching item ${id}:`, error.message);
        return { id, error: error.message };
    }
}

async function ProcessCorridas() {
    if (corridas_to_process.length === 0){
        console.log('0 corridas esperando processamento.')
        return; //nothing to process
    }

    const promises = Array.from(corridas_to_process).map(corrida => MachineGetPosicaoCondutor(corrida.bot_id, corrida.corrida_id));
    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));
        
        if (successful_results.length > 0) {
            console.log("Successful requests: ", successful_results)
        }
        // if (rejected_results.length > 0) {
        //   console.error("Rejected requests: ", rejected_results)
        // }
    } catch (error) {
        console.error('Error processing IDs:', error);
    }
}

function RemoveCorrida(remove_id){
    corridas_to_process = corridas_to_process.filter(c => c.corrida_id !== remove_id);
}


// Set up the recurring process
setInterval(ProcessCorridas, process.env.CHECK_INTERVAL);