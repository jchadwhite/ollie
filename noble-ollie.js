

var uuid = 'efbdbb95ed5c';

  var OllieBLEService = "22bb746f2bb075542d6f726568705327",
    WakeMainProcessor = "22bb746f2bbf75542d6f726568705327",
    TXPower = "22bb746f2bb275542d6f726568705327",
    AntiDos = "22bb746f2bbd75542d6f726568705327",
    OllieRobotControlService = "22bb746f2ba075542d6f726568705327",
    Roll = "22bb746f2ba175542d6f726568705327",
    Notify = "22bb746f2ba675542d6f726568705327";

var params = {
  OllieBLEService: "22bb746f2bb075542d6f726568705327",
  WakeMainProcessor: "22bb746f2bbf75542d6f726568705327",
  TXPower: "22bb746f2bb275542d6f726568705327",
  AntiDos: "22bb746f2bbd75542d6f726568705327",
  OllieRobotControlService: "22bb746f2ba075542d6f726568705327",
  Roll: "22bb746f2ba175542d6f726568705327",
  Notify: "22bb746f2ba675542d6f726568705327",
};

bleConnect = require("noble");
isConnected = false;
connectedPeripherals = {};

// AntiDos string
var str = "011i3";
var bytes = [];

// AntiDos bytes
for (var i = 0; i < str.length; ++i)  {
  bytes.push(str.charCodeAt(i));
}

bleConnect.on("discover", function(peripheral) {
  console.log("Found peripheral: "+peripheral.uuid);
  if (peripheral.uuid === uuid) {
    var p = { peripheral: peripheral, connected: false };
    connectedPeripherals[peripheral.uuid] = p;
    bleConnect.stopScanning();
    peripheral.connect(function() {
      peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
        services.forEach(function(s) {
          console.log(s.uuid);
        });
        characteristics.forEach(function(c) {
          if (c.uuid === AntiDos) {
            console.log("ANTIDOS");
            c.write(new Buffer(bytes), false, function() {
              console.log("Wrote anti dos!");
              characteristics.forEach(function(d) {
                if (d.uuid === WakeMainProcessor) {
                  console.log("WAKE MAIN PROCESSOR");
                  d.write(new Buffer(1), false, function() {
                    console.log("Wrote wake processor");
                    characteristics.forEach(function(e) {
                      if (e.uuid === TXPower) {
                        console.log("Setting TX Power");
                        e.write(new Buffer(7), function(f) {
                          console.log("TX Power Set");
                          // This isn't working.
                          if (f.uuid === Roll) {
                            console.log("This should be a roll");
                            var packet = setRGB(0xFF0000);
                            var rollPacket = roll(60, 0, 1);
                            var stopPacket = roll(0, 0, 1);
                            console.log("Packet: "+packet);
                            f.write(packet, false, function() {
                              console.log("Color should be red now!");
                              f.write(rollPacket, false, function() {
                                console.log("should be rolling");
                                //c.write(stopPacket, false, function() {
                                //  console.log("Should be stopped");
                                //}); 
                              });
                            });
                          }
                        });
                      }
                    });
                  });
                }
              });
            });
          }
        });
       // console.log("Characteristics");
       // console.log(characteristics);
      });


      console.log("Connected");
      //bleConnect.write(uuid, OllieBLEService, AntiDos, bytes, function() {
        console.log("Wrote bytes");
      //});
    });
    isConnected = true;
  }
});

bleConnect.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("State changed to powered on.  Starting scan");
    bleConnect.startScanning();
  } else {                                                                                                                                                                                     
    bleConnect.stopScanning();                                                                                                                                                                      
  }                                                                                                                                                                                            
});               


var setRGB = function(color, persist, options) {
  var packet = createPacket(0x20, options);
  packet.DATA = new Buffer([
    (color >> 16) & 0xFF,
    (color >> 8)  & 0xFF,
    color & 0xFF,
    persist?0x01:0x00
  ]);
  var result = packetBuilder(packet);
  return result;
};

var getRGB = function(options) {
  var packet = createPacket(0x22, options);
  var result = packetBuilder(packet);
  return result;
};

var minimumCommandPacketSize = 7; //Smallest command packets are 7 bytes long
var spheroCommandTemplate = {
  SOP1: 0,
  SOP2: 1,
  DID:  2,
  CID:  3,
  SEQ:  4,
  DLEN: 5, //Two Bytes
  DATA: 6,
  CHK:  6 //The checksum offset must be adjusted if DLEN > 1
};

var packetBuilder = function(packet) {
  packet.DID = packet.DID || 0x00;
  packet.CID = packet.CID || 0x00;
  packet.SEQ = packet.SEQ || 0x00;
  packet.DATA = packet.DATA || new Buffer(0);
  packet.resetTimeout = packet.resetTimeout || false;
  packet.requestAcknowledgement = packet.requestAcknowledgement || false;
  var SOP2 = 0xFC | (packet.resetTimeout && 0x02) | (packet.requestAcknowledgement && 0x01);

  var buffer = new Buffer(packet.DATA.length + minimumCommandPacketSize);
  buffer.writeUInt8(0xff, spheroCommandTemplate.SOP1);
  buffer.writeUInt8(SOP2, spheroCommandTemplate.SOP2);
  buffer.writeUInt8(packet.DID, spheroCommandTemplate.DID);
  buffer.writeUInt8(packet.CID, spheroCommandTemplate.CID);
  buffer.writeUInt8(packet.SEQ, spheroCommandTemplate.SEQ);
  buffer.writeUInt8(packet.DATA.length+1, spheroCommandTemplate.DLEN);
  packet.DATA.copy(buffer, spheroCommandTemplate.DATA);
  var checksum = calculateChecksum(buffer.slice(spheroCommandTemplate.DID, minimumCommandPacketSize + packet.DATA.length - 1));
  buffer.writeUInt8(checksum, spheroCommandTemplate.CHK + packet.DATA.length);
  return buffer;
};

var calculateChecksum = function(aBuffer) { 
  var calculatedChecksum = 0; 
  for (var _i = 0; _i < aBuffer.length; _i++) { 
    calculatedChecksum += aBuffer.readUInt8(_i); 
  } 
  calculatedChecksum = calculatedChecksum & 0xFF ^ 0xFF; 
  return calculatedChecksum; 
};



var createPacket = function(did, cid, options) {
  var _packet = {}; 
  for (var _i in options) {
    if (options.hasOwnProperty(_i)) {
      _packet[_i] = options[_i];
    }
  }
  _packet.DID = did;
  _packet.CID = cid;
 
  return _packet;
};

var roll = function(speed, heading, state, options) {
  var packet = createPacket(0x30, options);
  packet.DATA = new Buffer(4);
  packet.DATA.writeUInt8(speed, 0);
  packet.DATA.writeUInt16BE(heading, 1);
  packet.DATA.writeUInt8(state, 3);
  var result = packetBuilder(packet);
  return result;
};


