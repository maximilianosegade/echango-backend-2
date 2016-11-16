var express = require('express');
var router = express.Router();
var dbPublicaPreciosActualizados = 'precios_por_comercio';
var nano     = require('nano')({
  url: 'https://webi.certant.com/echango',
  parseUrl: false})
  , username = 'echango'
  , userpass = 'echango2016';
var bluebird = require('bluebird');

bluebird.promisifyAll(nano);  
var preciosPorComercio = bluebird.promisifyAll(nano.use(dbPublicaPreciosActualizados));

/* 
 * Listar todas las promociones
 */
var promocionesListado = function (req, res, next) {
  var comercios = []
  
  preciosPorComercio.listAsync().then(function(resp){
    var i
    var idComercios = []

    for (i=0; i<resp.rows.length; i++){
      idComercios.push(resp.rows[i].id);
    }

    return idComercios.reduce(function(seq, id){
      return preciosPorComercio.getAsync(id).then(function(resp){
        var promociones = []
        
        for (ean in resp.precios){
          if (resp.precios[ean].promociones && resp.precios[ean].promociones.length){
            promociones.push({
              ean: ean,
              promociones: resp.precios[ean].promociones
            })
          }
        }

        if (promociones.length){ 
          comercios.push({
            id: id,
            articulos: promociones
          })          
        }
        
        return Promise.resolve()
      })
    }, Promise.resolve())
  }).then(function(resp){
    res.render('promociones', { comercios: comercios });
  }).catch(function(err){
    next(err);
  });

}

/* 
 * Agregar promociones (formulario)
 */
var addPromocionesForm = function (req, res, next) {
  res.render('promociones_add');
}

/* 
 * Agregar promociones
 */
var addPromociones = function (req, res, next) {
  var comercios = req.body['comercios'].split(';')
  var productos = req.body['productos'].split(';')
  var promociones = JSON.parse(req.body['promociones'])

  console.log('Insertar promociones...')
  console.log('Comercios: ', comercios)
  console.log('Productos: ', productos)
  console.log('Promociones: ', promociones)

  comercios.forEach(function(idComercio){

    preciosPorComercio.getAsync(idComercio).then(function(comercio){
      var i

      for(i=0; i<productos.length; i++){
        comercio.precios[productos[i]].promociones = promociones
      }

      return preciosPorComercio.insertAsync(comercio)
    }).then(function(resp){
      res.end('Se insertaron OK.');
    }).catch(function(err){
      next(err);
    });

  })
}

var removePromociones = function (req, res, next) {
  var idComercio = req.query['comercio']
  var productos = req.query['productos'].split(';')
  var promociones = 
    req.query['promociones'] ? req.query['promociones'].split(';') : []

  console.log('Eliminar promociones...')
  console.log('Comercio: ', idComercio)
  console.log('Productos: ', productos)
  console.log('Promociones: ', promociones)

  preciosPorComercio.getAsync(idComercio).then(function(comercio){
    var i

    for(i=0; i<productos.length; i++){
      if (promociones.length){
        var promocionesDepuradas = []
        var j

        for (j=0; j<comercio.precios[productos[i]].promociones.length; j++){
          if (promociones.indexOf(j.toString()) == -1){
            promocionesDepuradas.push(
              comercio.precios[productos[i]].promociones[j]
            )
          }
        }        

        comercio.precios[productos[i]].promociones = 
          promocionesDepuradas
      }else{
        comercio.precios[productos[i]].promociones = []
      }
    }

    return preciosPorComercio.insert(comercio)
  }).then(function(resp){
    res.end('Se eliminaron correctamente');
  }).catch(function(err){
    next(err);
  });

}

router.get('/all', promocionesListado);
router.get('/add', addPromocionesForm);
router.post('/add', addPromociones);
router.get('/remove', removePromociones);

module.exports = router