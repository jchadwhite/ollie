var Cylon = require('cylon');

var uuid = 'efbdbb95ed5c';

Cylon.robot({
  connections: {
    bluetooth: { adaptor: 'central', uuid: uuid, module: 'cylon-ble'}
  },

  devices: {
    ollie: { driver: 'ollie'}
  },

  work: function(my) {
    my.ollie.wake(function(err, data){
      console.log("wake");

      after(200, function() {
        my.ollie.setRGB(0x00FFFF);
      });

      after(500, function() {
        my.ollie.setRGB(0xFF0000);
//        my.ollie.roll(60, 0, 1);

        after(1000, function(){
//          my.ollie.roll(60, 90, 1);
            my.ollie.setRGB(0x00FF00);

          after(1000, function(){
            my.ollie.stop();
          });
        });
      });
    });
  }
}).start();

