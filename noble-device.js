var Ollie = require('./Ollie');

Ollie.discover(function(ollie) {

  // you can be notified of disconnects
  ollie.on('disconnect', function() {
    console.log('we got disconnected! :( ');
  });

  // you'll need to call connect and set up
  ollie.connectAndSetUp(function(error) {
    console.log("we're connected!");
    ollie.devMode(function() {
      console.log("In dev mode");
      ollie.setRGB(0xFF0000, function() {
        console.log("Color changed!");
      });
//      ollie.roll(60,0,0);
//      setTimeout(function() {
//        ollie.stop();
//      }.bind(this), 1000);
    }); 
  });

});
