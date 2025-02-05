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

// Function to read data from the JSON file
const ReadData = () => {
    try {
      const data = fs.readFileSync(db_file_path, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading data:", error);
      return {}; // Return an empty object if the file doesn't exist
    }
};


// Function to write data to the JSON file
const WriteData = (data) => {
    try {
      fs.writeFileSync(db_file_path, JSON.stringify(data, null, 2));
      //console.log("Data saved!");
    } catch (error) {
      console.error("Error writing data:", error);
    }
};


const corridas_to_process = ReadData();


//
app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//
app.post('/corrida_setup', (req, res) => {
    const data = req.body;
    console.log('\x1b[42m%s\x1b[0m', `${data.id_corrida} - Corrida cadastrada pelo bot: ${bot_headers[data.bot_id.replace(/\s/g, "")].bot_name} | ${new Date().toLocaleString('pt-BR')}`)
    corridas_to_process.push({...data, get_position: false})
    WriteData(corridas_to_process);

    if(!isValidNumericalString(data.id_corrida)){
        res.status(400).json({
            error: 'Missing required fields: id_corrida',
        })
    } else {
        res.status(200).send({ status: 'success', body: {...req.body} });
    }        
});

//console.log color 
// 40 BLACK
// 41 RED
// 42 GREEN
// 43 YELLOW
// 44 BLUE
// 45 MAGENTA
// 46 CYAN
// 47 WHITE
// 100 GRAY

////////Webhook Endpoints
// Each client should point to a different webhook 
app.post('/webhook_un_humaita', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Humaitá | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Humaitá`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_ariquemes', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Ariquemes | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Ariquemes`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_boituva', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Boituva | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Boituva`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_vilhena', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Vilhena | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Vilhena`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_popcar', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Pop Car | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body; 
    HandleMachineStatus(event, `Pop Car`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_fastcar_rio', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Fast Car | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body; 
    HandleMachineStatus(event, `Fast Car - Rio`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_epitacio_leva', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Epitacio Leva | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Epitácio Leva`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_bora_la_go', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Bora Lá GO | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Bora Lá GO`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_rocar', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Rocar | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Rocar`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_vai_e_volta', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Vai e Volta - Corridas | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Vai e Volta - Corridas`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_win_cars', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Win Cars | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Win Cars`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_novo_progresso', (req, res) => {
  //  console.log('\x1b[43m%s\x1b[0m', `UN - Novo Progresso | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `UN - Novo Progresso`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_rota_pop', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Rota Pop | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Rota Pop`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_center_taxi', (req, res) => {
 //   console.log('\x1b[43m%s\x1b[0m', `Center Taxi | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Center Taxi`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_to_indo', (req, res) => {
    const event = req.body;
    //console.log('\x1b[43m%s\x1b[0m', `To Indo | ${new Date().toLocaleString('pt-BR')}`)
    console.log('\x1b[36m%s\x1b[0m', `To Indo | ${event.id_mch} | ${new Date().toLocaleString('pt-BR')}`)
    HandleMachineStatus(event, `To Indo`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_vrdrive', (req, res) => {
   // console.log('\x1b[43m%s\x1b[0m', `VRDRIVE | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `VRDRIVE`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_quiricar', (req, res) => {
    const event = req.body;
    //console.log('\x1b[36m%s\x1b[0m', `Quiricar | ${event.id_mch} | ${new Date().toLocaleString('pt-BR')}`)
    HandleMachineStatus(event, `Quiricar`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_igo_mobilidade', (req, res) => {
    const event = req.body;
    //console.log('\x1b[36m%s\x1b[0m', `iGO Mobilidade | ${event.id_mch} | ${new Date().toLocaleString('pt-BR')}`)
    HandleMachineStatus(event, `iGO Mobilidade`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_go', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `GO | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `GO`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_go_lavras', (req, res) => {
    //console.log('\x1b[36m%s\x1b[0m', `GO Lavras | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `GO`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_iupe', (req, res) => {
    const event = req.body;
    //console.log('\x1b[36m%s\x1b[0m', `iupe! | ${event.id_mch} | ${new Date().toLocaleString('pt-BR')}`)
    HandleMachineStatus(event, `iupe!`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_iupe_itumbiara', (req, res) => {
    //console.log('\x1b[36m%s\x1b[0m', `iupe! Itumbiara | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `iupe! - Itumbiara`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_iupe_planaltina', (req, res) => {
    //console.log('\x1b[36m%s\x1b[0m', `iupe! Planaltina | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `iupe! - Planaltina`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_chama_aracruz', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Chama | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Chama`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_du_norte_rolim', (req, res) => {
 //   console.log('\x1b[43m%s\x1b[0m', `Du Norte - Rolim de Moura | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Du Norte - Rolim de Moura`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_du_norte_espigao_do_oeste', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Du Norte - Espigão do Oeste | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Du Norte - Espigão do Oeste`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_du_norte_cacoal', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Du Norte - Cacoal | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Du Norte - Cacoal`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_du_norte_ji_parana', (req, res) => {
    const event = req.body;
    console.log('\x1b[36m%s\x1b[0m', `Du Norte - Ji-Paraná | ${event.id_mch} | ${new Date().toLocaleString('pt-BR')}`)
    HandleMachineStatus(event, `Du Norte - Ji-Paraná`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_pimenta_bueno', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Pimenta Bueno | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `UN - Pimenta Bueno`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_un_pato_branco', (req, res) => {
    //console.log('\x1b[32m%s\x1b[0m', `UN - Pato Branco | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `UN - Pato Branco`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_du_norte_vilhena', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Du Norte - Vilhena | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Du Norte - Vilhena`)
    res.status(200).send('Event received');
});
//
app.post('/webhook_dub', (req, res) => {
    //   console.log('\x1b[43m%s\x1b[0m', `Dub - Corridas | ${new Date().toLocaleString('pt-BR')}`)
       const event = req.body;
       HandleMachineStatus(event, `Dub - Corridas`)
       res.status(200).send('Event received');
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
        console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} - ${origin} | (${e.status_solicitacao}): Status Repetido`)
        return
    }

    if(e.status_solicitacao == 'G' && event_corrida.current_solicitacao_status == 'C'){
        console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} - ${origin} | (${e.status_solicitacao}): Redirecionamento`)
    }
    
    switch(e.status_solicitacao){
        case 'L':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (L)`)
            //fluxo_name = 'notifica-corrida-pendente'
            break;
        case 'G':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (G): Esperando um condutor aceitar a solicitação.`)
            fluxo_name = 'notifica-busca-passageiro'
            break;
        case 'P':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (P): Solicitação não aceita, aguardando aceitação.`)
            fluxo_name = 'notifica-solicitacao-espera'
            break;
        case 'N':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (N): Nenhum condutor aceitou a solicitação.`)
            fluxo_name = 'notifica-corrida-nao-atendida'
            break;
        case 'A':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (A): Solicitação aceita por um condutor. ${e.motorista ? e.motorista.nome : ''}`)
            event_corrida.get_position = true;
            fluxo_name = 'notifica-corrida-aceita'
            break;
        case 'S':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (S): Solicitação em espera até a conclusão de uma anterior.`)
            fluxo_name = 'notifica-motorista-em-liberacao'
            break;
        case 'E':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (E): Corrida iniciada.`)
            event_corrida.get_position = false;
            fluxo_name = 'notifica-corrida-iniciada'
            break;
        case 'F':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (F): Corrida concluída.`)
            //RemoveCorrida(e.id_mch)
            event_corrida.get_position = false;

            fluxo_name = 'notifica-corrida-finalizada'
            break;
        case 'C':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} - ${origin} | (C): Solicitação cancelada.`)
            event_corrida.get_position = false;

            fluxo_name = 'notifica-corrida-cancelada'
            //RemoveCorrida(e.id_mch)
            break;
        default:
            console.log('\x1b[31m%s\x1b[0m', `${e.id_mch} - ${origin} | (${e.status_solicitacao}): event not handled ;-;`)
            break;
    }

    event_corrida.current_solicitacao_status = e.status_solicitacao
    if(event_corrida != null && fluxo_name != null) SendPulseFlowToken(event_corrida.bot_id, event_corrida.contact_id, fluxo_name, e.id_mch)
}


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
        //console.log(flow_selected_on_status)

        //get list of flows successful, RUN flow
        SendPulseFlowRun(_bot_id, _contact_id, flow_selected_on_status, _corrida_id)
    } catch (error) {
        //get list of flows NOT successful
        if (error.status === 401) {
            //status 401 not auth, which means that the current SENDPULSE TOKEN it's invalid and tries to get a new one
            try {
                //console.log('401 - post get token')
                // console.log(_bot_id)
                // console.log(bot_headers[_bot_id])
                const response = await axios.post(`${sendpulse_base_url}/oauth/access_token`, {
                    'grant_type': 'client_credentials',
                    'client_id': `${bot_headers[_bot_id].client_id}`,
                    'client_secret': `${bot_headers[_bot_id].client_secret}`
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                
                //console.log(`${_bot_id}: sendpulse new token: ${response.data.access_token}`)

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
    try {
        //console.log('SendPulse Flow: Run!');  // 
        if(_contact_id == '') throw "Contact ID is invalid"
        if(_flow == undefined) throw "Couldn't find Flow. Flow undefined."

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
                'Authorization': `Bearer ${bot_headers[_bot_id].sendpulse_tkn}`
            }
        })
        console.log(`${_corrida_id} - SendPulse Flow: ${_flow.name} Success!`);  // 
    } catch (error) {
        console.error('Error runing SendPulse Flow:', error);  // 
    }
}


//
async function MachineGetPosicaoCondutor(_corrida, _corrida_idx) {
    try {
        if(_corrida.get_position == false) throw "Can't get position";
        if(_corrida.current_solicitacao_status == 'C' || _corrida.current_solicitacao_status == 'F'){
            _corrida.get_position = false
            throw "Can't get position, corrida cancelada/concluída"
        }

        // console.log('MachineGetPosicaoCondutor',  _corrida)
        // console.log(bot_headers[_corrida.bot_id].api_key)
        // console.log(bot_headers[_corrida.bot_id].auth)

        const response = await axios.get(`${taxi_base_url}/posicaoCondutor?id_mch=${_corrida.id_corrida}`, {
        //const response = await axios.get(`http://193.203.182.20:3000/posicaoCondutor`, {
            headers: {
                'api-key': `${bot_headers[_corrida.bot_id].api_key}`,
                'Authorization': `${bot_headers[_corrida.bot_id].auth}`
            }
        });

        // console.log('\x1b[42m%s\x1b[0m', 'POSICAO CONDUTOR')
        // console.log(response.data)
        // console.log(response.data.response)

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
      //  console.log('0 corridas esperando processamento.')
        return; //nothing to process
    }

   // console.log(corridas_to_process)
    const promises = Array.from(corridas_to_process).map( (corrida, idx) => MachineGetPosicaoCondutor(corrida, idx));
    try {
        const results = await Promise.allSettled(promises);
        const successful_results = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        //const rejected_results = results.filter(result => result.status === 'rejected').map((result, index) => ({ id: Array.from(corridas_to_process)[index], error: result.reason }));

        if (successful_results.length > 0) {
            console.log("Posição dos motoristas:")
            successful_results.map(pos => {
                //console.log(`Posições dos motoristas:`)
                const is_in_range = IsInRange(pos);
                if (is_in_range) {
                    SendPulseFlowToken(pos.bot_id, pos.contact_id, 'notifica-motorista-chegou', pos.id_corrida)
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
    //console.log('Corrida removida', remove_id)
    //corridas_to_process.splice(corridas_to_process.findIndex((c) => c.id_corrida === remove_id), 1); 
}

function IsInRange(_pos){
    //console.log(`${_pos.bot_id}: `, _pos.lat_condutor, _pos.lng_condutor, _pos.lat_partida, _pos.lng_partida)

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


// Set up the recurring process
setInterval(ProcessCorridas, process.env.CHECK_INTERVAL);
