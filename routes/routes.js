const express = require('express');
const router = express.Router();
const { handleCorridaSetup, handleMachineStatus, ...otherHandlers } = require('../handlers');

router.post('/webhook_un_humaita', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Humaitá | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Humaitá`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_un_ariquemes', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Ariquemes | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Ariquemes`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_un_boituva', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Boituva | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;  
    HandleMachineStatus(event, `UN - Boituva`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_popcar', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Pop Car | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body; 
    HandleMachineStatus(event, `Pop Car`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_epitacio_leva', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Epitacio Leva | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Epitácio Leva`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_bora_la_go', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Bora Lá GO | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Bora Lá GO`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_rocar', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Rocar | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Rocar`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_vai_e_volta', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Vai e Volta - Corridas | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Vai e Volta - Corridas`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_win_cars', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Win Cars | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Win Cars`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_un_novo_progresso', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `UN - Novo Progresso | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `UN - Novo Progresso`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_rota_pop', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Rota Pop | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Rota Pop`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_center_taxi', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Center Taxi | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Center Taxi`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_to_indo', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `To Indo | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `To Indo`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_vrdrive', (req, res) => {
    console.log('\x1b[43m%s\x1b[0m', `VRDRIVE | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `VRDRIVE`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_igo_mobilidade', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `iGO Mobilidade | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `iGO Mobilidade`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_go', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `GO | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `GO`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_iupe', (req, res) => {
    console.log('\x1b[43m%s\x1b[0m', `iupe! | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `iupe!`)
    res.status(200).send('Event received');
});
//
router.post('/webhook_chama_aracruz', (req, res) => {
    //console.log('\x1b[43m%s\x1b[0m', `Chama | ${new Date().toLocaleString('pt-BR')}`)
    const event = req.body;
    HandleMachineStatus(event, `Chama`)
    res.status(200).send('Event received');
});


module.exports = router;