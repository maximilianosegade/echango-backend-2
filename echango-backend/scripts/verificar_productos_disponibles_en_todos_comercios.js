var dbutils = require('../util/mongo')
var productos = [
	{id:'7790895000997', descripcion: ''},
	{id:'7790895003301', descripcion: ''},
	{id:'7790387015508', descripcion: ''},
	{id:'7622300840259', descripcion: ''},
	{id:'7790070318077', descripcion: ''},
	{id:'7790070411716', descripcion: ''},
	{id:'7790250014904', descripcion: ''},
	{id:'7794000960091', descripcion: ''}	
]

var queryComercios = dbutils.find('ultima_snapshot',{})

queryComercios.then(function(comercios){
	console.log('Cantidad de comercios con precios: ', comercios.length)
	
	productos.forEach(function(prod){
		var selector = {}
		selector['precios.' + prod.id] = {$exists: true};
		var queryExisteProducto =
			dbutils.find('ultima_snapshot', selector)

		queryExisteProducto.then(function(res){
			console.log(prod.id, ' | ', prod.descripcion,
				' => ', res.length == comercios.length ? 'SI' : 'NO',
				' (', res.length, '/', comercios.length, ')')
		})

	})
})