require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const geolib = require('geolib');
// const fs = require("fs");
// const db_file_path = "./corridas.json";
const { GetPendingCorridas, UpdateCorrida, InsertCorrida } = require('./db/database.js');
const { bot_headers } = require('./bots/credentials.js');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";

let corridas_to_process
/////////
(async () => {
    try {
        corridas_to_process = await GetPendingCorridas(['F', 'C', 'X']);
        // Use the data here
        console.log('Pending corridas:', Object.keys(corridas_to_process).length);
        //console.log("corridas_to_process: ", corridas_to_process)
        // Set up the recurring process
        setInterval(ProcessCorridasPosicao, process.env.CHECK_INTERVAL);        
        
        const corridas_entries = Object.values(corridas_to_process);
        if (corridas_entries.length === 0) return; //nothing to process

        corridas_entries.map((corrida) => PoolCorridaStatus( corrida ));
    } catch (error) {
        console.error('Error fetching corridas:', error);
    }
})();
///////

app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/status', (req, res) => {
    const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    res.json({ message: 'Server is running!', timestamp: cur_date , corridas: corridas_to_process});
});

//
app.post('/corrida_setup', (req, res) => {
    const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    ////data
    // {
    //     cidade: 'Itapeva'
    //     bot_id: '6704679a3a85573fe70d0904',
    //     id_corrida: '495710301',
    //     contact_id: '11111111',
    //     lat_partida: '-30.857200400',
    //     lng_partida: '-51.786323800',
    //     logs: [
    //     '495710301 - Corrida cadastrada pelo bot: Win Cars | 11/02/2025, 17:11:44',
    //     '495710301 - Win Cars | (A): Solicitação aceita por um condutor. | 11/02/2025, 14:11:45',
    //     '495710301 - Win Cars | (E): Corrida iniciada. | 11/02/2025, 14:14:50'
    //     ],
    //     get_position: false,
    //     corrida_active: true,
    //     current_solicitacao_status: 'E'
    // }
    const data = req.body;
    data.cidade = FormatCityName(data.cidade ? data.cidade : '')

    data.bot_name = GetCredential(data.bot_id, data.cidade, 'bot_name')
    data.api_key = GetCredential(data.bot_id, data.cidade, 'api_key')
    data.auth = GetCredential(data.bot_id, data.cidade, 'auth')
    data.client_id = GetCredential(data.bot_id, data.cidade, 'client_id')
    data.client_secret = GetCredential(data.bot_id, data.cidade, 'client_secret')
    data.sendpulse_tkn = GetCredential(data.bot_id, data.cidade, 'sendpulse_tkn')

    if(!isValidNumericalString(data.id_corrida)){
        res.status(400).json({
            error: 'Missing required fields: id_corrida',
        })
    } else {
        res.status(200).send({ status: 'success', body: {...req.body} });
    }    

    console.log('\x1b[42m%s\x1b[0m', `${data.id_corrida} - Corrida cadastrada pelo bot: ${data.bot_name} | ${cur_date}`)
    data.logs = [`${data.id_corrida} - Corrida cadastrada pelo bot: ${data.bot_name} | ${cur_date}`]
    data.get_position = false;
    data.current_solicitacao_status = 'X'

    //console.log(data)
    
    corridas_to_process[data.id_corrida] = {...data};
    PoolCorridaStatus({...data});
    InsertCorrida({...data}) 
    
});


//
async function MachineGetPosicaoCondutor(corrida) {
    try {
        if(corrida.get_position == false) throw "Can't get position";

        const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${corrida.id_corrida}`, {
            headers: {
                'api-key': `${corrida.api_key}`,
                'Authorization': `${corrida.auth}`
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
async function ProcessCorridasPosicao() {
    const corridas_entries = Object.values(corridas_to_process);
    if (corridas_entries.length === 0) return; //nothing to process

    const promises = corridas_entries.map((corrida) => MachineGetPosicaoCondutor( corrida ));

    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));

        if (successful_results.length > 0) {
            const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            console.log(`Posição dos motoristas | ${cur_date}`)
            successful_results.map(corrida => {
                const is_in_range = IsInRange(corrida);
                if (is_in_range) {

                    const origin = corrida.bot_name
                    console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (X): Motorista chegou. | ${cur_date}`)
                    corridas_to_process[corrida.id_corrida].logs.push(`${corrida.id_corrida} - ${origin} | (X): Motorista chegou. | ${cur_date}`)

                    SendPulseFlowToken(corrida, 'notifica-motorista-chegou')
                    corridas_to_process[corrida.id_corrida].get_position = false;
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

function IsInRange(corrida){
    if(corrida.lat_condutor == undefined || corrida.lng_condutor == undefined) {
        corridas_to_process[corrida.id_corrida].posicao_undefined ? corridas_to_process[corrida.id_corrida].posicao_undefined++ : corridas_to_process[corrida.id_corrida].posicao_undefined = 1;
        console.log('\x1b[41m%s\x1b[0m', `${corrida.id_corrida}: Posição motorista undefined | ${corridas_to_process[corrida.id_corrida].posicao_undefined}`)
        if(corridas_to_process[corrida.id_corrida].posicao_undefined >= 100) corridas_to_process[corrida.id_corrida].get_position = false
        return false
    }

    const distance = geolib.getDistance(
        { latitude: corrida.lat_condutor, longitude: corrida.lng_condutor },
        { latitude: corrida.lat_partida, longitude: corrida.lng_partida }
    )

    console.log('\x1b[44m%s\x1b[0m', `${corrida.id_corrida} - Distancia do motorista: ${distance}`)
    
    if (distance <= process.env.DEFAULT_MIN_DISTANCE) return true;
    else return false;
}

function isValidNumericalString(str) {
    return /^\d+$/.test(str);
}

let delays = {};
async function PoolCorridaStatus(corrida) {
    if (!delays[corrida.id_corrida]) delays[corrida.id_corrida] = 15000; // Initialize delay if not set
    //console.log(corrida)

    const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const origin = corrida.bot_name
    
    try {
        // const response = await axios.get(`${taxi_base_url}/solicitacaoStatus?id_mch=${corrida.id_corrida}`, {
        //     headers: {
        //         'api-key': `${corrida.api_key}`,
        //         'Authorization': `${corrida.auth}`
        //     }
        // });

        const response2 = await axios.get(`${taxi_base_url}/solicitacao?id_mch=${corrida.id_corrida}`, {
            headers: {
                'api-key': `${corrida.api_key}`,
                'Authorization': `${corrida.auth}`
            }
        });
        let response_status
        if(response2.data.response[0]){
            response_status = response2.data.response[0].status_solicitacao
        }else {
            throw "Couldn't find corrida status"
        }
         
        //console.log(response_status)
        //response.data = { success: true, response: { status: 'P' } }
        //console.log(response.data.response);
        HandleFetchedStatus(corrida.id_corrida, response_status)

        // Reset delay on success
        delays[corrida.id_corrida] = 15000;

        //Remove from pooling
        if (response_status === "F" || response_status === "C") {
            console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (${response_status}): Corrida finalizada/cancelada. | ${cur_date}`)

            delete delays[corrida.id_corrida]; // Remove ride from tracking
            return;
        }
    } catch (error) {
        //console.log(error)
        if(error.response && error.response.status == 400){
            console.log('\x1b[41m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (400): Erro de acesso a api. | ${cur_date}`)
            delete delays[corrida.id_corrida];
            return;
        } else if(error.response && error.response.status == 429){
            console.log('\x1b[41m%s\x1b[0m', `Error fetching status for ride ${corrida.id_corrida}: ${error.response.status}| ${cur_date}`)
            delays[corrida.id_corrida] = Math.min(delays[corrida.id_corrida] * 2, 30000); // Increase delay up to 1 min
        } else {
            console.error(`Error:`, error);
            return;
        }
    }

    // Schedule the next poll
    setTimeout(() => PoolCorridaStatus(corrida), delays[corrida.id_corrida]);
}

//
function HandleFetchedStatus(id_corrida, status){
    let fluxo_name, log;
    const corrida = {...corridas_to_process[id_corrida]}
    const origin = corrida.bot_name
    const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    
    if(status == corrida.current_solicitacao_status) {
        log = `Status repetido`
        //console.log('\x1b[43m%s\x1b[0m', `${corrida.id_corrida} - ${origin} | (${status}): ${log} | ${cur_date}`)
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
    
    UpdateCorrida(corridas_to_process[id_corrida]);
    
    if(corrida != null && fluxo_name != null) SendPulseFlowToken(corridas_to_process[id_corrida], fluxo_name)
}


//https://api.sendpulse.com/whatsapp/flows?bot_id=671c1c15e2674ddd100159df
//Tries to get the flow list from the BOT_ID, it's a success, run the status related FLOW, to the CONTACT ID
async function SendPulseFlowToken(corrida, fluxo_name){
    try {
        const response = await axios.get(`${sendpulse_base_url}/whatsapp/flows?bot_id=${corrida.bot_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${corrida.sendpulse_tkn}`
            }
        })
        const flow_selected_on_status = response.data.data.find((f) => f.name == fluxo_name)

        //get list of flows successful, RUN flow
        SendPulseFlowRun(corrida, flow_selected_on_status)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                const response = await axios.post(`${sendpulse_base_url}/oauth/access_token`, {
                    'grant_type': 'client_credentials',
                    'client_id': `${corrida.client_id}`,
                    'client_secret': `${corrida.client_secret}`
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                corrida.sendpulse_tkn = response.data.access_token
                return SendPulseFlowToken(corrida, fluxo_name);  // try again with new token
            } catch (tokenError) {
                console.error('Error getting SendPulse Access Token:', tokenError);  // error getting new token
            }
        } else {
            console.error('Error:', error);  // error getting new token
        }
    }
}

//using the contact id and the flow id and runs it
async function SendPulseFlowRun(corrida, flow){
    try {
        if(corrida.contact_id == '') throw "Contact ID is invalid"
        if(flow == undefined) throw "Couldn't find Flow. Flow undefined."

        const response = await axios.post(`https://api.sendpulse.com/whatsapp/flows/run`, {
            'contact_id': `${corrida.contact_id}`,
            'flow_id': `${flow.id}`,
            'external_data': {
                'tracking_number': '1234-0987-5678-9012'
            }
        }, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${corrida.sendpulse_tkn}`
            }
        })
        console.log(corrida.corrida_id)

        const origin = corrida.bot_name
        const cur_date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        
        corridas_to_process[corrida.corrida_id].logs.push(`${corrida.corrida_id} - ${origin} | SendPulse Flow: ${flow.name} Success! | ${cur_date}`)
        console.log('\x1b[43m%s\x1b[0m', `${corrida.corrida_id} - ${origin} | SendPulse Flow: ${flow.name} Success! | ${cur_date}`)
    } catch (error) {
        console.error('Error runing SendPulse Flow:', error);  // 
    }
}

function FormatCityName(city) {
    return city
        .toLowerCase() // Converte para minúsculas
        .normalize("NFD") // Separa os caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove a acentuação
        .replace(/\s+/g, "-"); // Substitui espaços por traços
}

function GetCredential(bot_id, cidade, credentials) {
    const bot_config = bot_headers[bot_id];
    if (!bot_config) return undefined;

    // Try cidade-based config first
    if (cidade && bot_config[cidade]) {
        return bot_config[cidade][credentials];
    }
    
    // Fallback to direct bot_name
    return bot_config[credentials];
}