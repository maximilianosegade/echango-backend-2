var expect = require('chai').expect;
var td = require('testdouble');
var mockery = require('mockery');

var mongodbMock = {
	MongoClient: {
    	connect: function(){
    		console.log('Mock MongoClient!');    		
    	}
	}
};

describe('Consulta de comercios cercanos.', function() {

	beforeEach(function() {
		mockery.registerAllowable('../routes/comercios');
    	mockery.registerMock('mongodb', mongodbMock);
    	mockery.enable({ useCleanCache: true });
    	mockery.warnOnUnregistered(false);
	});

	afterEach(function() {
		mockery.disable();
    	mockery.deregisterAll();
    });

	describe('Consulta de 1 comercio, sin comercios cercanos.', function() {
	  
	  it('Devuelve un array vacio de comercios, asociado al comercio indicado.', function() {
	  	var req = {
	  		params: {
	  			lat0: '-34.454645',
            	long0: '-58.54564654'
	  		}
	  	}
	    var res = {
	    	setHeader: td.function(),
	    	end: td.function()
	    }
	    var comercios = [{
	    	lat: '-34.454645',
            long: '-58.54564654',
	    	comerciosCercanos: []
	    }];		
	    
		var comerciosCercanos = require('../routes/comercios').comerciosCercanos;
		comerciosCercanos(req, res, null);

		td.verify(res.setHeader('Content-Type', 'application/json'), {times: 1});
		td.verify(res.end(JSON.stringify(comercios)) , {times: 1});
	  });

	});

	describe('Consulta de 1 comercio, con varios comercios cercanos.', function() {
	  
	  it('Devuelve un array de ID de comercios, asociados al comercio indicado.', function() {
	    var req = {
	  		params: {
	  			lat0: '-34.454645',
            	long0: '-58.54564654'
	  		}
	  	}
	  	var res = {
	    	setHeader: td.function(),
	    	end: td.function()
	    }
	    var comercios = [{
	    	lat: '-34.454645',
            long: '-58.54564654',
	    	comerciosCercanos: []
	    }];
		
	    //comerciosCercanos(req, res, null);

		//td.verify(res.setHeader('Content-Type', 'application/json'), {times: 1});
		//td.verify(res.end(JSON.stringify(comercios)) , {times: 1});
	  });

	});

});