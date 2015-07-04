var bleConnect = require("noble");

bleConnect.on("discover", function(peripheral) {
  console.log(peripheral.advertisement);
  console.log(peripheral.address);
});

bleConnect.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("State changed to powered on.  Starting scan");
    bleConnect.startScanning();
  } else {                                                                                                                                                                                     
    bleConnect.stopScanning();                                                                                                                                                                      
  }                                                                                                                                                                                            
});               

