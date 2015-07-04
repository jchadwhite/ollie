var NobleDevice = require('noble-device');

var uuid = 'f45ca1058664';
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

var OllieBLEService = "22bb746f2bb075542d6f726568705327",
    WakeMainProcessor = "22bb746f2bbf75542d6f726568705327",
    TXPower = "22bb746f2bb275542d6f726568705327",
    AntiDos = "22bb746f2bbd75542d6f726568705327",
    OllieRobotControlService = "22bb746f2ba075542d6f726568705327",
    Roll = "22bb746f2ba175542d6f726568705327",
    Notify = "22bb746f2ba675542d6f726568705327";

var pretty = {
    "22bb746f2bb075542d6f726568705327": 'OllieBLEService',
    "22bb746f2bbf75542d6f726568705327": 'WakeMainProcesor',
    "22bb746f2bb275542d6f726568705327": 'TXPower',
    "22bb746f2bbd75542d6f726568705327": 'AntiDos',
    "22bb746f2ba075542d6f726568705327": 'OllieRobotControlService',
    "22bb746f2ba175542d6f726568705327": 'Roll',
    "22bb746f2ba675542d6f726568705327": 'Notify'
}

var Ollie = function(peripheral) {
  NobleDevice.call(this, peripheral);
}

// inherit noble device
NobleDevice.Util.inherits(Ollie, NobleDevice);



// you could send some data
Ollie.prototype.send = function(serviceUuid, charUuid, data, done) {
  console.log('Sending ' + pretty[serviceUuid] +':'+pretty[charUuid]);
  this.writeDataCharacteristic(serviceUuid, charUuid, new Buffer(data), done);
};

// read some data
Ollie.prototype.receive = function(serviceUuid, charUuid, callback) {
  this.readDataCharacteristic(serviceUuid, charUuid, callback);
};


// Fun times
Ollie.prototype.antiDos = function(callback) {
  // AntiDos string
  var str = "011i3";
  var bytes = [];

  // AntiDos bytes
  for (var i = 0; i < str.length; ++i)  {
    bytes.push(str.charCodeAt(i));
  }
  this.send(OllieBLEService, AntiDos, bytes, function() {
    callback();
  });
}

Ollie.prototype.setTXPower = function(callback) {
  this.send(OllieBLEService, TXPower, 7, function() {
    callback();
  });
}

Ollie.prototype.wakeUp = function(callback) {
  this.send(OllieBLEService, WakeMainProcessor, 1, function() {
    callback();
  });
}

Ollie.prototype.devMode = function(callback) {
  this.antiDos(function() {
    this.setTXPower(function() { 
      this.wakeUp(function() {
        console.log("Dev mode complete.");
        callback();
      });
    }.bind(this));
  }.bind(this));
}

Ollie.prototype.setRGB = function(color, persist, options) {
  console.log("Setting RGB to "+color);
  var packet = createPacket(0x20, options);
  packet.DATA = new Buffer([
    (color >> 16) & 0xFF,
    (color >> 8)  & 0xFF,
    color & 0xFF,
    persist?0x01:0x00
  ]);
  var result = packetBuilder(packet);
  this.send(OllieRobotControlService, Roll, result, function() {
    console.log("Color changed?");

  });
  return result;
};

Ollie.prototype.roll = function(speed, heading, state, options) {
  var packet = createPacket(0x30, options);
  packet.DATA = new Buffer(4);
  packet.DATA.writeUInt8(speed, 0);
  packet.DATA.writeUInt16BE(heading, 1);
  packet.DATA.writeUInt8(state, 3);
  var result = packetBuilder(packet);
  this.send(OllieRobotControlService, Roll, result, function() {
    console.log("Rolling?");
  });
};

Ollie.prototype.stop = function(callback) {
  this.roll(0, 0, 1, callback);
}

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

module.exports = Ollie;

