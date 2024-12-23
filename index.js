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
        bot_name: 'POP CAR',
        api_key: process.env.API_KEY_VALUE_POPCAR,
        auth: process.env.BASIC_AUTHORIZATION_VALUE_POPCAR,
    },

    '675b7c3042fbd8c07f06d518': {
        bot_name: 'UN - Humaitá',
        api_key: process.env.API_KEY_VALUE_UN_HUMAITA,
        auth: process.env.BASIC_AUTHORIZATION_VALUE_UN_HUMAITA,
    },

    '676476192e9602bd8b059754': {
        bot_name: 'UN - Boituva',
        api_key: process.env.API_KEY_VALUE_UN_BOITUVA,
        auth: process.env.BASIC_AUTHORIZATION_VALUE_UN_BOITUVA,
    },

    '6762eb5267e2dea0140d1057': {
        bot_name: 'UN - Ariquemes',
        api_key: process.env.API_KEY_VALUE_UN_ARIQUEMES,
        auth: process.env.BASIC_AUTHORIZATION_VALUE_UN_ARIQUEMES,
    },

    '66f45a98afc0da5096066211': {
        bot_name: 'Epitacio Leva',
        api_key: process.env.API_KEY_VALUE_UN_ARIQUEMES,
        auth: process.env.BASIC_AUTHORIZATION_VALUE_UN_ARIQUEMES,
    },
  };

//
app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//
app.post('/corrida_setup', (req, res) => {
    const data = req.body;
    console.log(data.bot_id)
    console.log('\x1b[49m%s\x1b[0m', `Corrida cadastrada pelo bot: ${bot_headers[data.bot_id].bot_name} | ${data.id_corrida}`)
    corridas_to_process.push({...data, get_position: false})
    res.status(200).send({ status: 'success', body: {...req.body} });
});

////////Webhook Endpoints
// Each client should point to a different webhook 
app.post('/webhook_un_humaita', (req, res) => {
    const event = req.body;  
    HandleMachineStatus(event, `UN - Humaitá`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_ariquemes', (req, res) => {
    const event = req.body;  
    HandleMachineStatus(event, `UN - Ariquemes`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_boituva', (req, res) => {
    const event = req.body;  
    HandleMachineStatus(event, `UN - Boituva`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_popcar', (req, res) => {
    const event = req.body; 
    HandleMachineStatus(event, `POP CAR`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_humaita', (req, res) => {
    const event = req.body;  
    HandleMachineStatus(event, `UN - Humaitá`)
    res.status(200).send('Event received');
});

//
app.post('/webhook_epitacio_leva', (req, res) => {
    const event = req.body;
    HandleMachineStatus(event, `Epitácio Leva`)
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
            "lat_condutor": "-23.535684",
            "lng_condutor": "-46.700752",
            "condutor_id": "1080525"
        }
    });
});


//
function HandleMachineStatus(e, origin){
    const event_corrida_idx = corridas_to_process.findIndex((c) => c.id_corrida === e.id_mch)
    const event_corrida = event_corrida_idx >= 0 ? corridas_to_process[event_corrida_idx] : null;
    //console.log(e)
    if(event_corrida == null) {
    //    console.log('\x1b[41m%s\x1b[0m', `Corrida: ${e.id_mch} (${e.status_solicitacao})`)
        return
    } else {
        //console.log('\x1b[46m%s\x1b[0m', `${event_corrida && bot_headers[event_corrida.bot_id] ? bot_headers[event_corrida.bot_id].bot_name+' | ' : ''}Corrida: ${e.id_mch} (${e.status_solicitacao})`)
    }
    let fluxo_name
    
    if(e.status_solicitacao == event_corrida.current_solicitacao_status) {
        console.log('\x1b[41m%s\x1b[0m', `${origin} | ${e.id_mch} (${e.status_solicitacao}): Status Repetido`)
        return
    }
    
    switch(e.status_solicitacao){
        case 'L':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (L)`)
            //fluxo_name = 'notifica-corrida-pendente'
            break;
        case 'G':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (G): Esperando um condutor aceitar a solicitação.`)
            fluxo_name = 'notifica-busca-passageiro'
            break;
        case 'P':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (P): Solicitação não aceita, aguardando aceitação.`)
            fluxo_name = 'notifica-solicitacao-espera'
            break;
        case 'N':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (N): Nenhum condutor aceitou a solicitação.`)
            fluxo_name = 'notifica-corrida-nao-atendida'
            break;
        case 'A':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (A): Solicitação aceita por um condutor. ${e.motorista ? e.motorista.nome : ''}`)
            event_corrida.get_position = true;
            fluxo_name = 'notifica-corrida-aceita'
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (S): Solicitação em espera até a conclusão de uma anterior.`)
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'E':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (E): Corrida iniciada.`)
            event_corrida.get_position = false;
            fluxo_name = 'notifica-corrida-iniciada'
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (S): Solicitação finalizada pelo condutor.`)
            RemoveCorrida(e.id_mch)
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'F':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (F): Corrida concluída.`)
            RemoveCorrida(e.id_mch)
            fluxo_name = 'notifica-corrida-finalizada'
            break;
        case 'C':
            console.log('\x1b[43m%s\x1b[0m', `${origin} | ${e.id_mch} (C): Solicitação cancelada.`)
            fluxo_name = 'notifica-corrida-cancelada'
            RemoveCorrida(e.id_mch)
            break;
        default:
            console.log('\x1b[31m%s\x1b[0m', `${origin} | ${e.id_mch} (${e.status_solicitacao}): event not handled ;-;`)
            break;
    }

    event_corrida.current_solicitacao_status = e.status_solicitacao
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
        //console.log(flow_selected_on_status)

        //get list of flows successful, RUN flow
        SendPulseFlowRun(_contact_id, flow_selected_on_status)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                //console.log('401 - post get token')
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
        //console.log('SendPulse Flow: Run!');  // 
        if(_contact_id == '') throw "Contact ID is invalid"

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
        console.log(`SendPulse Flow: ${_flow.name} Success!`);  // 
    } catch (error) {
        console.error('Error runing SendPulse Flow:', error);  // 
    }
}


//
async function MachineGetPosicaoCondutor(_corrida, _corrida_idx) {
    try {
        if(_corrida.get_position == false) throw "Can't get position;"
        //console.log('MachineGetPosicaoCondutor',  _corrida)
        const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${_corrida.id_corrida}`, {
        //const response = await axios.get(`http://193.203.182.20:3000/posicaoCondutor`, {
            headers: {
                'api-key': `${bot_headers[_corrida.bot_id].api_key}`,
                'Authorization': `${bot_headers[_corrida.bot_id].auth}`
            }
        });

        //console.log('\x1b[42m%s\x1b[0m', 'POSICAO CONDUTOR')
        //console.log(response.data)

        return {
            'corrida_index': _corrida_idx,
            'id_corrida': _corrida.id_corrida,
            'bot_id': _corrida.bot_id,
            'contact_id': _corrida.contact_id,
            'lat_partida': _corrida.lat_partida, 
            'lng_partida': _corrida.lng_partida, 
            'lat_condutor': response.data.response.lat_condutor, 
            'lng_condutor': response.data.response.lng_condutor 
        };
    } catch (error) {
        const error_status = error.response.status
        // if (error.response && error.response.status === 404) {
        //   console.log(`Item ${id} not found, removing from processing list.`);
        //   corridas_to_process.delete(id)
        //   return { id, error: `Item not found` };
        // }
        return { error_status, error: error.message };
    }
}

//
async function ProcessCorridas() {
    if (corridas_to_process.length === 0){
        //console.log('0 corridas esperando processamento.')
        return; //nothing to process
    }

    const promises = Array.from(corridas_to_process).map( (corrida, idx) => MachineGetPosicaoCondutor(corrida, idx));
    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));

        if (successful_results.length > 0) {
            //console.log("Successful requests: ", successful_results)
            successful_results.map(pos => {
                const is_in_range = IsInRange(pos);
                if (is_in_range) {
                    SendPulseFlowToken(pos.bot_id, pos.contact_id, 'notifica-motorista-chegou')
                    corridas_to_process[pos.corrida_index].get_position = false;
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
    console.log('Corrida removida', remove_id)
    corridas_to_process.splice(corridas_to_process.findIndex((c) => c.id_corrida === remove_id), 1); 
}

function IsInRange(_pos){
    //console.log(_pos.lat_condutor, _pos.lng_condutor, _pos.lat_partida, _pos.lng_partida)
    const distance = geolib.getDistance(
        { latitude: _pos.lat_condutor, longitude: _pos.lng_condutor },
        { latitude: _pos.lat_partida, longitude: _pos.lng_partida }
    )
    console.log('\x1b[44m%s\x1b[0m', `${_pos.id_corrida} - Distancia do motorista: ${distance}`)
    if (distance <= process.env.DEFAULT_MIN_DISTANCE) return true;
    else return false;
    
}

// Set up the recurring process
setInterval(ProcessCorridas, process.env.CHECK_INTERVAL);