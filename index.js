require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const geolib = require('geolib');

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
    console.log(`corrida cadastrada pelo bot: ${data.bot_id} | ${data.id_corrida}`)
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
app.get('/posicaoCondutor', (req, res) => {
    res.status(200).send({
        "success": true,
        "response": {
            "lat_taxi": "-30.835360698",
            "lng_taxi": "-51.819862425",
            "lat_condutor": "-30.835360698",
            "lng_condutor": "-51.819862425",
            "condutor_id": "1080525"
        }
    });
});


//
function HandleMachineStatus(e){
    const event_corrida_idx = corridas_to_process.findIndex((c) => c.id_corrida === e.id_mch)
    const event_corrida = event_corrida_idx >= 0 ? corridas_to_process[event_corrida_idx] : null
    console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (${e.status_solicitacao})`)
    let fluxo_name
    if(event_corrida == null) return
    switch(e.status_solicitacao){
        case 'D':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (D): Solicitação aberta e ainda não atribuída a um condutor.`)
            fluxo_name = 'notifica-busca-passageiro'
            break;
        case 'G':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (G): Esperando um condutor aceitar a solicitação.`)
            fluxo_name = 'notifica-corrida-pendente'
            break;
        case 'P':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (P): Solicitação não aceita, aguardando aceitação.`)
            fluxo_name = 'notifica-solicitacao-espera'
            break;
        case 'N':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (N): Nenhum condutor aceitou a solicitação.`)
            fluxo_name = 'notifica-corrida-nao-atendida'
            break;
        case 'A':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (A): Solicitação aceita por um condutor.`)
            if(e.motorista) console.log(`${e.motorista.nome}`)
            fluxo_name = 'notifica-corrida-aceita'
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (S): Solicitação em espera até a conclusão de uma anterior.`)
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'E':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (E): Corrida iniciada.`)
            fluxo_name = 'notifica-corrida-iniciada'
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (S): Solicitação finalizada pelo condutor.`)
            RemoveCorrida(e.id_mch)
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'F':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (F): Corrida concluída.`)
            RemoveCorrida(e.id_mch)
            fluxo_name = 'notifica-corrida-finalizada'
            break;
        case 'C':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (C): Solicitação cancelada.`)
            fluxo_name = 'notifica-corrida-cancelada'
            RemoveCorrida(e.id_mch)
            break;
        default:
            console.log('\x1b[31m%s\x1b[0m', `${e.id_mch} (${e.status_solicitacao}): event not handled ;-;`)
            break;
    }
    
    if(event_corrida != null && fluxo_name != null) SendPulseFlowToken(event_corrida.bot_id, event_corrida.contact_id, fluxo_name)
}


//https://api.sendpulse.com/whatsapp/flows?bot_id=671c1c15e2674ddd100159df
//Tries to get the flow list from the BOT_ID, it's a success, run the status related FLOW, to the CONTACT ID
async function SendPulseFlowToken(_bot_id, _contact_id, _fluxo_name){
    try {
        const response = await axios.get(`${sendpulse_base_url}/whatsapp/flows?bot_id=${_bot_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sendpulse_tkn}`
            }
        })
        
        const flow_selected_on_status = response.data.data.find((f) => f.name == _fluxo_name)
        console.log(flow_selected_on_status)

        //get list of flows successful, RUN flow
        SendPulseFlowRun(_contact_id, flow_selected_on_status)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                console.log('401 - post get token')
                const response = await axios.post(`${sendpulse_base_url}/oauth/access_token`, {
                    'grant_type': 'client_credentials',
                    'client_id': process.env.CLIENT_ID,
                    'client_secret': process.env.CLIENT_SECRET
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                
                sendpulse_tkn = response.data.access_token
                return SendPulseFlowToken(_bot_id, _contact_id, _fluxo_name);  // try again with new token
            } catch (tokenError) {
                console.error('Error getting SendPulse Access Token:', tokenError);  // error getting new token
            }
        } else {
            console.error('Error:', error);  // error getting new token
        }
    }
}

//using the contact id and the flow id and runs it
async function SendPulseFlowRun(_contact_id, _flow){
    try {
        console.log('SendPulse Flow: Run!');  // 
        const response = await axios.post(`https://api.sendpulse.com/whatsapp/flows/run`, {
            'contact_id': `${_contact_id}`,
            'flow_id': `${_flow.id}`,
            'external_data': {
                'tracking_number': '1234-0987-5678-9012'
            }
        }, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sendpulse_tkn}`
            }
        })
        console.log('SendPulse Flow: Success!', response.data);  // 
    } catch (error) {
        console.error('Error runing SendPulse Flow:', error);  // 
    }
}


//
async function MachineGetPosicaoCondutor(_corrida) {
    try {
        console.log('MachineGetPosicaoCondutor',  _corrida)
        //const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${_corrida_id}`, {
        const response = await axios.get(`http://193.203.182.20:3000/posicaoCondutor`, {
            headers: {
                'api-key': `${bot_headers[_corrida.bot_id].api_key}`,
                'Authorization': `${bot_headers[_corrida.bot_id].auth}`
            }
        });
        return {
            'bot_id': _corrida.bot_id,
            'contact_id': _corrida.contact_id,
            'lat_partida': _corrida.lat_partida, 
            'lng_partida': _corrida.lng_partida, 
            'lat_condutor': response.data.response.lat_condutor, 
            'lng_condutor': response.data.response.lng_condutor 
        };
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
        //console.log('0 corridas esperando processamento.')
        return; //nothing to process
    }

    const promises = Array.from(corridas_to_process).map(corrida => MachineGetPosicaoCondutor(corrida));
    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));

        if (successful_results.length > 0) {
            console.log("Successful requests: ", successful_results)
            successful_results.map(pos => {
                const is_in_range = IsInRange(pos);
                if (is_in_range) {
                    SendPulseFlowToken(pos.bot_id, pos.contact_id, 'notifica-motorista-chegou')
                }
            });
        }
        // if (rejected_results.length > 0) {
        //   console.error("Rejected requests: ", rejected_results)
        // }
    } catch (error) {
        console.error('Error processing IDs:', error);
    }
}

function RemoveCorrida(remove_id){
    console.log('remove corrida', remove_id)
    corridas_to_process.splice(corridas_to_process.findIndex((c) => c.id_corrida === remove_id), 1); 
}

function IsInRange(_pos){
    const distance = geolib.getDistance(
        { latitude: _pos.lat_condutor, longitude: _pos.lng_condutor },
        { latitude: _pos.lat_partida, longitude: _pos.lng_partida }
    )
    console.log(distance)
    if (distance <= process.env.DEFAULT_MIN_DISTANCE) return true;
    else return false;
    
}


// Set up the recurring process
setInterval(ProcessCorridas, process.env.CHECK_INTERVAL);


// {
//     "success": true,
//     "response": {
//         "lat_taxi": "-30.835360698",
//         "lng_taxi": "-51.819862425",
//         "lat_condutor": "-30.835360698",
//         "lng_condutor": "-51.819862425",
//         "condutor_id": "1080525"
//     }
// }


// {
//     "success": true,
//     "response": {
//         "lat_taxi": "-30.835426601",
//         "lng_taxi": "-51.819862425",
//         "lat_condutor": "-30.835426601",
//         "lng_condutor": "-51.819862425",
//         "condutor_id": "1080525"
//     }
// }