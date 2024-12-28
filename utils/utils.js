const geolib = require('geolib');

function isInRange(_pos){
    //console.log(_pos.lat_condutor, _pos.lng_condutor, _pos.lat_partida, _pos.lng_partida)
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

module.exports = { isInRange, isValidNumericalString };