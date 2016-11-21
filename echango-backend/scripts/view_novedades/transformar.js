function view(doc) {

  	if (doc.fecha) {

		var compraModificada = {
			'usuario': doc.usuario,
			'comercio': doc.comercio._id,
			'fecha_compra': doc.fecha,
			'detalle_compra': {
			'articulos': []
			}
		}

		for (var i=0; i<doc.productos.length; i++){
			compraModificada.detalle_compra.articulos.push({
				'ean': doc.productos[i].ean,
				'precio_lista': doc.productos[i].precio_lista
			});
		}

	}

  	emit(doc.fecha, compraModificada);
}

console.log(view.toString())
var fs = require('fs')
var compraOriginal = JSON.parse(fs.readFileSync('compra_test.js'))
console.log('Compra modificada:');
console.log(JSON.stringify(view(compraOriginal)));