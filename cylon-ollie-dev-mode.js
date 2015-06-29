var Cylon = require('cylon');

var uuid = 'efbdbb95ed5c';

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
        console.log("Setting to #AAA");
        my.ollie.setRGB(0xAAAAAA);
        after(1000, function() {
          console.log("Setting to #000");
          my.ollie.setRGB(0x000000);
          after(1000, function() {
            console.log("Setting to #F00");
            my.ollie.setRGB(0xFF0000);
          });
        });
      });
//      after(1000, function(){
//        my.ollie.stop();
//      });
    
    });
  } 
}).start();
