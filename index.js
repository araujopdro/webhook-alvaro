require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const geolib = require('geolib');
const fs = require("fs");
const db_file_path = "./corridas.json";
const { bot_headers } = require('./bots/credentials.js');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";

/////////
//const corridas_to_process = ReadData();
const corridas_to_process = {}; 
//
app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//
app.post('/corrida_setup', (req, res) => {
    const data = req.body;
    console.log('\x1b[42m%s\x1b[0m', `${data.id_corrida} - Corrida cadastrada pelo bot: ${bot_headers[data.bot_id.replace(/\s/g, "")].bot_name} | ${new Date().toLocaleString('pt-BR')}`)
    data.logs = [`${data.id_corrida} - Corrida cadastrada pelo bot: ${bot_headers[data.bot_id.replace(/\s/g, "")].bot_name} | ${new Date().toLocaleString('pt-BR')}`]
    data.get_position = false;
    data.corrida_active = true;
    
    corridas_to_process[data.id_corrida] = {...data};
    PollCorridaStatus({...data});

    if(!isValidNumericalString(data.id_corrida)){
        res.status(400).json({
            error: 'Missing required fields: id_corrida',
        })
    } else {
        res.status(200).send({ status: 'success', body: {...req.body} });
    }        
});

//https://api.sendpulse.com/whatsapp/flows?bot_id=671c1c15e2674ddd100159df
//Tries to get the flow list from the BOT_ID, it's a success, run the status related FLOW, to the CONTACT ID
async function SendPulseFlowToken(_bot_id, _contact_id, _fluxo_name, _corrida_id){
    try {
        const response = await axios.get(`${sendpulse_base_url}/whatsapp/flows?bot_id=${_bot_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bot_headers[_bot_id].sendpulse_tkn}`
            }
        })
        const flow_selected_on_status = response.data.data.find((f) => f.name == _fluxo_name)

        //get list of flows successful, RUN flow
        SendPulseFlowRun(_bot_id, _contact_id, flow_selected_on_status, _corrida_id)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                const response = await axios.post(`${sendpulse_base_url}/oauth/access_token`, {
                    'grant_type': 'client_credentials',
                    'client_id': `${bot_headers[_bot_id].client_id}`,
                    'client_secret': `${bot_headers[_bot_id].client_secret}`
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                bot_headers[_bot_id].sendpulse_tkn = response.data.access_token
                return SendPulseFlowToken(_bot_id, _contact_id, _fluxo_name, _corrida_id);  // try again with new token
            } catch (tokenError) {
                console.error('Error getting SendPulse Access Token:', tokenError);  // error getting new token
            }
        } else {
            console.error('Error:', error);  // error getting new token
        }
    }
}

//using the contact id and the flow id and runs it
async function SendPulseFlowRun(_bot_id, _contact_id, _flow, _corrida_id){
    console.log(`SendPulseFlowRun`, _bot_id, _contact_id, _flow, _corrida_id)
    // try {
    //     if(_contact_id == '') throw "Contact ID is invalid"
    //     if(_flow == undefined) throw "Couldn't find Flow. Flow undefined."

    //     const response = await axios.post(`https://api.sendpulse.com/whatsapp/flows/run`, {
    //         'contact_id': `${_contact_id}`,
    //         'flow_id': `${_flow.id}`,
    //         'external_data': {
    //             'tracking_number': '1234-0987-5678-9012'
    //         }
    //     }, {
    //         headers: {
    //             'accept': 'application/json',
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${bot_headers[_bot_id].sendpulse_tkn}`
    //         }
    //     })
    //     //console.log(`${_corrida_id} - SendPulse Flow: ${_flow.name} Success!`);  // 
    // } catch (error) {
    //     console.error('Error runing SendPulse Flow:', error);  // 
    // }
}


//
async function MachineGetPosicaoCondutor(corrida) {
    try {
        if(corrida.get_position == false) throw "Can't get position";
        if(corrida.current_solicitacao_status == 'C' || corrida.current_solicitacao_status == 'F'){
            corrida.get_position = false
            throw "Can't get position, corrida cancelada/concluída"
        }

        const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${corrida.id_corrida}`, {
            headers: {
                'api-key': `${bot_headers[corrida.bot_id].api_key}`,
                'Authorization': `${bot_headers[corrida.bot_id].auth}`
            }
        });

        return {
            'id_corrida': corrida.id_corrida,
            'bot_id': corrida.bot_id,
            'contact_id': corrida.contact_id,
            'lat_partida': corrida.lat_partida, 
            'lng_partida': corrida.lng_partida, 
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
    const corridas_entries = Object.entries(corridas_to_process);

    if (corridas_entries.length === 0) return; //nothing to process

    //const promises = Array.from(corridas_to_process).map( (corrida, idx) => MachineGetPosicaoCondutor(corrida, idx));
    console.log(corridas_entries)
    const promises = corridas_entries.map((corrida) => MachineGetPosicaoCondutor( corrida ));

    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));

        if (successful_results.length > 0) {
            console.log("Posição dos motoristas:")
            successful_results.map(pos => {
                const is_in_range = IsInRange(pos);
                if (is_in_range) {
                    SendPulseFlowToken(pos.bot_id, pos.contact_id, 'notifica-motorista-chegou', pos.id_corrida)
                    corridas_to_process[pos.corrida_index].get_position = false;
                }
            });
        }
        // if (rejected_results.length > 0) {
        //   //console.error("Rejected requests: ", rejected_results)
        // }
    } catch (error) {
        console.error('Error processing IDs:', error);
    }
}

function IsInRange(_pos){
    if(_pos.lat_condutor == undefined || _pos.lng_condutor == undefined) {
        console.log('\x1b[41m%s\x1b[0m', `${_pos.id_corrida}: Posição motorista undefined`)
        return false
    }

    const distance = geolib.getDistance(
        { latitude: _pos.lat_condutor, longitude: _pos.lng_condutor },
        { latitude: _pos.lat_partida, longitude: _pos.lng_partida }
    )

    console.log('\x1b[44m%s\x1b[0m', `${_pos.id_corrida} - Distancia do motorista: ${distance}`)
    
    if (distance <= process.env.DEFAULT_MIN_DISTANCE) return true;
    else return false;
}

function isValidNumericalString(str) {
    return /^\d+$/.test(str);
}

let delays = {};
async function PollCorridaStatus(corrida) {
    if (!delays[corrida.id_corrida]) delays[corrida.id_corrida] = 15000; // Initialize delay if not set
    //console.log(corrida)
    try {
        const response = await axios.get(`${taxi_base_url}/solicitacaoStatus?id_mch=${corrida.id_corrida}`, {
            headers: {
                'api-key': `${bot_headers[corrida.bot_id].api_key}`,
                'Authorization': `${bot_headers[corrida.bot_id].auth}`
            }
        });
        //response.data = { success: true, response: { status: 'P' } }
        //console.log(`Corrida ${corrida.id_corrida}`, response.data.response);
        HandleFetchedStatus(corrida.id_corrida, response.data.response.status)

        // Reset delay on success
        delays[corrida.id_corrida] = 15000;

        //Remove from pooling
        if (response.data.response.status === "F" || response.data.response.status === "C") {
            const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            const origin = bot_headers[corrida.bot_id.replace(/\s/g, "")].bot_name
            console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (${response.data.response.status}): Corrida finalizada/cancelada. | ${cur_date}`)

            delete delays[corrida.id_corrida]; // Remove ride from tracking
            return;
        }
    } catch (error) {
        console.error(`Error fetching status for ride ${corrida.id_corrida}:`, error.response.status);
        delays[corrida.id_corrida] = Math.min(delays[corrida.id_corrida] * 2, 30000); // Increase delay up to 1 min
    }

    // Schedule the next poll
    setTimeout(() => PollCorridaStatus(corrida), delays[corrida.id_corrida]);
}

//
function HandleFetchedStatus(id_corrida, status){
    let fluxo_name, log;
    const corrida = {...corridas_to_process[id_corrida]}
    const origin = bot_headers[corrida.bot_id.replace(/\s/g, "")].bot_name
    const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    //console.log(status, corrida.current_solicitacao_status)
    if(status == corrida.current_solicitacao_status) {
        log = `Status repetido`
        console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (${status}): ${log} | ${cur_date}`)
        return
    }
    
    switch(status){
        case 'L':
            log = `Aguardando liberação`
            fluxo_name = 'notifica-corrida-pendente'
            break;
        case 'G':
            fluxo_name = 'notifica-busca-passageiro'
            log = `Esperando um condutor aceitar a solicitação.`
            break;
        case 'P':
            log = `Solicitação não aceita, aguardando aceitação.`
            fluxo_name = 'notifica-solicitacao-espera'
            break;
        case 'N':
            fluxo_name = 'notifica-corrida-nao-atendida'
            log = `Nenhum condutor aceitou a solicitação.`
            break;
        case 'A':
            log = `Solicitação aceita por um condutor.`
            corridas_to_process[id_corrida].get_position = true;
            fluxo_name = 'notifica-corrida-aceita'
            break;
        case 'S':
            log = `Solicitação em espera até a conclusão de uma anterior.`
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'E':
            log = `Corrida iniciada.`
            corridas_to_process[id_corrida].get_position = false;
            fluxo_name = 'notifica-corrida-iniciada'
            break;
        case 'F':
            log = `Corrida concluída.`
            corridas_to_process[id_corrida].get_position = false;
            fluxo_name = 'notifica-corrida-finalizada'
            break;
        case 'C':
            log = `Solicitação cancelada.`
            corridas_to_process[id_corrida].get_position = false;

            fluxo_name = 'notifica-corrida-cancelada'
            break;
        case 'D':
            log = `Aguardando distribuição.`
            break;
        default:
            log = `Event not handled ;-;`
            break;
    }

    console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (${status}): ${log} | ${cur_date}`)

    corridas_to_process[id_corrida].logs ? corridas_to_process[id_corrida].logs.push(`${corrida.id_corrida} - ${origin} | (${status}): ${log} | ${cur_date}`) : corridas_to_process[id_corrida].logs = new Array(`${corrida.id_corrida} - ${origin} | (${status}): ${log} | ${cur_date}`);
    corridas_to_process[id_corrida].current_solicitacao_status = status;
    
    if(corrida != null && fluxo_name != null) SendPulseFlowToken(corrida.bot_id, corrida.contact_id, fluxo_name, corrida.id_corrida)
}

// Set up the recurring process
setInterval(ProcessCorridas, process.env.CHECK_INTERVAL);