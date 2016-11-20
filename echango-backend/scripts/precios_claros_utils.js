// Script config.
const hostname = '8kdx6rx8h4.execute-api.us-east-1.amazonaws.com'
const key = 'zIgFou7Gta7g87VFGL9dZ4BEEs19gNYS1SOQZt96'
const headers = {
  'Accept':'application/json, text/plain, */*',
  'Accept-Encoding':'gzip, deflate, sdch, br',
  'Accept-Language':'en-US,en;q=0.8,es;q=0.6,pt-BR;q=0.4,pt;q=0.2,pt-PT;q=0.2',
  'Connection':'keep-alive',
  'Host': hostname,
  'Origin':'https://www.preciosclaros.gob.ar',
  'Referer':'https://www.preciosclaros.gob.ar/',
  'User-Agent':'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36',
  'x-api-key': key
}
// End config.

const https = require('https')


var obtenerPreciosPorProductoYComercio = function(ean, idSuc){
  return new Promise(function(resolve, reject){

    var path = '/prod/producto?limit=30&id_producto='+ ean +'&array_sucursales=' + idSuc;

    var options = {
      hostname: hostname,
      path: path,
      method: 'GET',
      headers: headers
    }

    var req = https.get(options, (res) => {
      var body = ''

      res.on('data', (d)=> {
        body += d;
      });

      res.on('end', () => {
        var respData = JSON.parse(body);
        
        try{          
          var precio = respData.sucursales[0].preciosProducto.precioLista
          resolve(precio);
        } catch (err) {
          reject(err);
        }

      });

      res.on('error', (err) => {
        reject(err);
      });

      req.end();

    });

  });

}

var obtenerPreciosPorComercio = function(idComercio, productos, delay){

  var total = productos.length;
  var precios = {
    _id: idComercio,
    precios: {}
  }
 
  var productos_relevados = 0;

  return new Promise(function(resolve, reject){

    productos.forEach(function(prod){
      setTimeout(function(){

        productos_relevados++;
        console.log(idComercio, ' => ' , productos_relevados, '/', total);
        
        obtenerPreciosPorProductoYComercio(prod.ean, idComercio).then(function(precio){
          precios.precios[prod.ean] = {
            precio: precio
          }
          if (productos_relevados == total){            
            resolve(precios);
          }
        }).catch(function(err){
          if (productos_relevados == total){
            resolve(precios);
          }
        })

      }, delay * Math.random() + 1000);
    });

  });

}

module.exports = {
  obtenerPreciosPorProductoYComercio: obtenerPreciosPorProductoYComercio,
  obtenerPreciosPorComercio: obtenerPreciosPorComercio
}