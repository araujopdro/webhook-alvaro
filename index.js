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
    

    // axios.post(`${taxi_base_url}/cadastrarWebhook`, data)
    // .then(response => {

    //     console.log(response.data);
    
    
    // })
    // .catch(error => {
    //     console.error('Error making POST request:', error);
    // });

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
    
    console.log('Received Status event:');
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


//
function HandleMachineStatus(e){
    switch(e.status_solicitacao){
        case 'D':
            console.log(`${e.id_mch} (D): Solicitação aberta e ainda não atribuída a um condutor.`)
        case 'G':
            console.log(`${e.id_mch} (G): Esperando um condutor aceitar a solicitação.`)
        case 'P':
            console.log(`${e.id_mch} (P): Solicitação não aceita, aguardando aceitação.`)
        case 'N':
            console.log(`${e.id_mch} (N): Nenhum condutor aceitou a solicitação.`)
        case 'A':
            console.log(`${e.id_mch} (A): Solicitação aceita por um condutor.`)
        case 'S':
            console.log(`${e.id_mch} (S): Solicitação em espera até a conclusão de uma anterior.`)
        case 'E':
            console.log(`${e.id_mch} (E): Corrida iniciada.`)
        case 'R':
            console.log(`${e.id_mch} (R): Parada concluída.`)
        case 'S':
            console.log(`${e.id_mch} (S): Solicitação finalizada pelo condutor.`)
        case 'F':
            console.log(`${e.id_mch} (F): Corrida concluída.`)
        case 'E':
            console.log(`${e.id_mch} (C): Solicitação cancelada.`)
        case 'E':
            console.log(`${e.id_mch} (R): Pagamento pendente de confirmação.`)
        default:
            console.log("event not handled ;-;")
    }
}


//
// function GetSendPulseToken(){
//     axios.post(`${sendpulse_base_url}/oauth/access_token`, data)
//     .then(response => {
//         console.log(response.data);
//         if(response.data) sendpulse_tkn = response.data.access_token
//         return response.data
//     })
//     .catch(error => {
//         console.error('Error making POST request:', error);
//     });
// }
//eived webhook event: {



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
    