var Cylon = require('cylon');

var uuid = 'f45ca1058664';

Cylon.config({
  logging: {
    level: 'debug'
  } 
}); 
    
Cylon.robot({
  connections: {
    bluetooth: { adaptor: 'central', uuid: uuid, module: 'cylon-ble'}
  },

  devices: { 
    ollie: { driver: 'ollie'}
  },

  work: function(my) {
    my.ollie.devModeOn(function(err, data){ 
      console.log("In dev mode");
   
//        my.ollie.roll(60, 0, 1);
      after(1000, function() {
        console.log("\n\n\n\n\n\n\n\n\n\n\n\n");
        console.log("Setting to #AAA");
        my.ollie.setRGB(0xFF6600);
        console.log("\n\n\n\n\n\n\n\n\n\n\n\n");
      });
//      after(1000, function(){
//        my.ollie.stop();
//      });
    
    });
  } 
}).start();
