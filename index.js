require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

const taxi_base_url = "https://api.taximachine.com.br/api/integracao";
const sendpulse_base_url = "https://api.sendpulse.com";
const corridas = [];

let sendpulse_tkn;


//
app.use(bodyParser.json());
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//
app.post('/corrida_setup', (req, res) => {
    const data = req.body;
    console.log(`corrida cadastrada pelo bot: ${data.id_corrida}`)
    corridas.push({...data})
    res.status(200).send({ status: 'success', body: {...req.body} });
});


//
app.post('/get_sendpulse_token', (req, res) => {
    const data = req.body;
    console.log(data);
    //let sendpulse_response = GetSendPulseToken()
    
    res.status(200).send({ status: 'success', body: {...sendpulse_response} });
});


//
app.post('/webhook_listener', (req, res) => {
    const event = req.body;  
    
    //console.log(event);
    HandleMachineStatus(event)
    
    res.status(200).send('Event received');
});

//
app.post('/webhook_listener_posicao', (req, res) => {
    const event = req.body;  
    
    console.log('Received Posicao event:', event);
    //HandleMachineStatus(event)
    
    res.status(200).send('Event received');
});

//
app.get('/are_you_there', (req, res) => {
    console.log('Yes');
    
    res.status(200).send('Event received');
});


// 
// Arredores local (A): Condutor próximo ao local de embarque.
// Cheguei ao local (C): Condutor chegou ao local de embarque.
// Entrada do passageiro (E): Passageiro entrou no veículo.
// Partida prolongada (O): Passageiro demorou para embarcar.
// Alteração de trajeto (T): Passageiro alterou o trajeto.

// {
//     "success": true,
//     "response": {
//         "lat_taxi": "-30.847289096",
//         "lng_taxi": "-51.802969872",
//         "lat_condutor": "-30.847289096",
//         "lng_condutor": "-51.802969872",
//         "condutor_id": "1081033"
//     }
// }

// {
//     "success": true,
//     "response": {
//         "lat_taxi": "-30.848417046",
//         "lng_taxi": "-51.799381077",
//         "lat_condutor": "-30.848417046",
//         "lng_condutor": "-51.799381077",
//         "condutor_id": "1081033"
//     }
// }

// {
//     "success": true,
//     "response": {
//         "lat_taxi": "-30.848414512",
//         "lng_taxi": "-51.799343526",
//         "lat_condutor": "-30.848414512",
//         "lng_condutor": "-51.799343526",
//         "condutor_id": "1081033"
//     }
// }

//
function HandleMachineStatus(e){
    const event_corrida_idx = corridas.findIndex((c) => c.id_corrida === e.id_mch)
    const event_corrida = event_corrida_idx >= 0 ? corridas[event_corrida_idx] : null
    if(event_corrida == null) return;
    
    let flow

    switch(e.status_solicitacao){
        case 'D':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (D): Solicitação aberta e ainda não atribuída a um condutor.`)
            flow = 
            break;
        case 'G':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (G): Esperando um condutor aceitar a solicitação.`)
            break;
        case 'P':
            console.log('\x1b[43m%s\x1b[0m', `${e.id_mch} (P): Solicitação não aceita, aguardando aceitação.`)
            break;
        case 'N':
            console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (N): Nenhum condutor aceitou a solicitação.`)
            break;
        case 'A':
            console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (A): Solicitação aceita por um condutor.`)
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
            break;
        case 'F':
            console.log('\x1b[42m%s\x1b[0m', `${e.id_mch} (F): Corrida concluída.`)
            break;
        case 'C':
            console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (C): Solicitação cancelada.`)
            break;
        case 'R':
            console.log('\x1b[41m%s\x1b[0m', `${e.id_mch} (R): Pagamento pendente de confirmação.`)
            break;
        default:
            console.log('\x1b[31m%s\x1b[0m', `${e.id_mch} (${e.status_solicitacao}): event not handled ;-;`)
            break;
    }
}

//https://api.sendpulse.com/whatsapp/flows?bot_id=671c1c15e2674ddd100159df
function SendPulseFlowRun(bot_id){
    ///checks the validity of the current sendpulse token
    axios.get(`${sendpulse_base_url}/whatsapp/flows/?bod_id=${bot_id}`, {
        headers: {
            'Authorization': `Bearer ${sendpulse_tkn}`
        }
    })
    .then(function (response) {
        // handle success
        console.log(response);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })

//    GetSendPulseToken()
}

// {
//     "contact_id": "string",
//     "flow_id": "string",
//     "external_data": {
//       "tracking_number": "1234-0987-5678-9012"
//     }
//   }


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

//eived webhook event: {

// {
//    id_mch: '00000000',
//    status_solicitacao: 'D',
//    data_hora_solicitacao: '2024-12-18T18:34:54+00:00',
//    chave_trajeto: '4d004765899aeeaf7c7ba406ed777a4a2e87897ca42d432621f0e2cab22184fd',
//    com_retorno: false,
//    motorista: {
//      id: '1080570',
//      nome: 'Cléuton Dione Neumann Da Silva',
//      vtr: '',
//      telefone: '(051) 99770-9270',
//      cpf: '001.686.680-09',
//      categoria: 'pop promo',
//      modelo: 'Hb20 ',
//      placa: 'RTM0G40'
//    }
//  }


// Received webhook event: {
//   id_mch: '474443408',
//   id_externo: '122927',
//   status_solicitacao: 'G',
//   data_hora_solicitacao: '2024-12-17T19:14:00+00:00',
//   chave_trajeto: '8341edd7e82a4989a9ac5a64b1e4b12bba2f760bbb07b41cc52960e4ec50fc9e',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:14:09+00:00',
//     lat_aceite: '-30.853821072',
//     lng_aceite: '-51.807996332',
//     estimativa_aceite_seg: '68',
//     estimativa_aceite_km: '0.322',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:14:10+00:00'
//   }
// }
// Event Handled
// Received webhook event: {
//   id_mch: '474443408',
//   id_externo: '122927',
//   status_solicitacao: 'A',
//   data_hora_solicitacao: '2024-12-17T19:14:00+00:00',
//   chave_trajeto: '8341edd7e82a4989a9ac5a64b1e4b12bba2f760bbb07b41cc52960e4ec50fc9e',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:14:09+00:00',
//     lat_aceite: '-30.853821072',
//     lng_aceite: '-51.807996332',
//     estimativa_aceite_seg: '68',
//     estimativa_aceite_km: '0.322',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:14:10+00:00'
//   }
// }
// Event Handled
// Received webhook event: {
//   id_mch: '474443408',
//   id_externo: '122927',
//   status_solicitacao: 'C',
//   data_hora_solicitacao: '2024-12-17T19:14:00+00:00',
//   chave_trajeto: '8341edd7e82a4989a9ac5a64b1e4b12bba2f760bbb07b41cc52960e4ec50fc9e',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:14:09+00:00',
//     lat_aceite: '-30.853821072',
//     lng_aceite: '-51.807996332',
//     estimativa_aceite_seg: '68',
//     estimativa_aceite_km: '0.322',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:14:10+00:00'
//   },
//   cancelamento: {
//     cancelada_por: 'C',
//     motivo_cancelamento: 'Outros casos',
//     data_hora: '2024-12-17T19:16:35+00:00'
//   }
// }
// Event Handled
// Received webhook event: {
//   id_mch: '474444645',
//   id_externo: '44132',
//   status_solicitacao: 'G',
//   data_hora_solicitacao: '2024-12-17T19:16:44+00:00',
//   chave_trajeto: 'a7a7fd3e9cdbfc7f1cdb6ab715d6fa66bb46d711eb812bee87597e831924c1df',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:16:54+00:00',
//     lat_aceite: '-30.855060551',
//     lng_aceite: '-51.810093820',
//     estimativa_aceite_seg: '120',
//     estimativa_aceite_km: '0.016',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:16:56+00:00'
//   }
// }
// Event Handled
// Received webhook event: {
//   id_mch: '474444645',
//   id_externo: '44132',
//   status_solicitacao: 'A',
//   data_hora_solicitacao: '2024-12-17T19:16:44+00:00',
//   chave_trajeto: 'a7a7fd3e9cdbfc7f1cdb6ab715d6fa66bb46d711eb812bee87597e831924c1df',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:16:54+00:00',
//     lat_aceite: '-30.855060551',
//     lng_aceite: '-51.810093820',
//     estimativa_aceite_seg: '120',
//     estimativa_aceite_km: '0.016',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:16:56+00:00'
//   }
// }
// Event Handled
// Received webhook event: {
//   id_mch: '474444645',
//   id_externo: '44132',
//   status_solicitacao: 'C',
//   data_hora_solicitacao: '2024-12-17T19:16:44+00:00',
//   chave_trajeto: 'a7a7fd3e9cdbfc7f1cdb6ab715d6fa66bb46d711eb812bee87597e831924c1df',
//   com_retorno: false,
//   motorista: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   condutor: {
//     id: '1080631',
//     nome: 'Carlos Evanir Vieira Toledo',
//     vtr: '',
//     telefone: '(051) 99777-1264',
//     cpf: '927.517.410-53',
//     categoria: 'pop promo',
//     modelo: 'Ford ka se',
//     placa: 'IWQ-3847'
//   },
//   andamento: {
//     data_hora_aceite: '2024-12-17T19:16:54+00:00',
//     lat_aceite: '-30.855060551',
//     lng_aceite: '-51.810093820',
//     estimativa_aceite_seg: '120',
//     estimativa_aceite_km: '0.016',
//     estimativa_corrida_km: '0.530',
//     estimativa_corrida_min: '3',
//     estimativa_corrida_valor: '10.46',
//     data_hora_arredores_local: '2024-12-17T19:16:56+00:00'
//   },
//   cancelamento: {
//     cancelada_por: 'C',
//     motivo_cancelamento: 'Outros casos',
//     data_hora: '2024-12-17T19:18:06+00:00'
//   }
// }
    