/* the wifi-cc3000 library is bundled in with Tessel's firmware,
 * so there's no need for an npm install. It's similar
 * to how require('tessel') works.
 */
var wifi = require('wifi-cc3000');
var tessel = require('tessel');
var http = require('http'); 
var rfidlib = require('rfid-pn532');

var config = require('./config')

var network = config.wifi_ssid; // put in your network name here
var pass = config.wifi_pass; // put in your password here, or leave blank for unsecured
var security = ''; // other options are 'wep', 'wpa', or 'unsecured'
var timeouts = 0;
var ready = false;

var time_between_reads_ms = 5000; 

var API_KEY = 'MWRiODFmZjAtMWQyYS00MDQ0LTg1ZDQtZGE2NzVkMGYwNDYzOGM2YjE1NTUtZmNjNi00MGYyLWI4NTEtNzdiMjQxMDZhZWEz';
var SO_ID = '14308373689150d3cf4839fc04cdb942dc6d682718af2';


var rfid = rfidlib.use(tessel.port['A']);
var led1 = tessel.led[0].output(0); // Green -- Sensing
var led2 = tessel.led[1].output(0); // Blue  -- Pushing data

/************** Functionalities ********************/
 
function pushData(jsondata, id, stream) {

  console.log("Pushing to ID ("+id+") data ("+jsondata+")");

  var options = {
    hostname: 'api.servioticy.com',
    port: 80,
    path: '/'+id+'/streams/'+stream,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY
    }
  };

  var req = http.request(options, function(res) {
    console.log('Status Code: ' + res.statusCode);
    led2.toggle();
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('Returned: ' + chunk);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  led2.toggle();
  req.write(jsondata);
  req.end();
}

function connect() {
  console.log("Connecting to WiFi");
  wifi.reset();
  wifi.connect({
      security: security
      , ssid: network
      , password: pass
      , timeout: 30 // in seconds
  }); 
}


/************** Handlers ********************/

wifi.on('connect', function(data){
  console.log("connected to WiFi", data);
});

rfid.on('error', function(err) {
  console.log('error connecting module', err);
});


wifi.on('disconnect', function(data){
  console.log("disconnect emitted", data);
});

wifi.on('error', function(err){
  console.log("error emitted", err);
});



/**********************/

rfid.on('ready', function () {
  console.log('RFID reader ready');
  ready = true;
  if(!wifi.isConnected())
    connect();
});

rfid.on('data', function (card) {
  led1.toggle();
  if(ready && wifi.isConnected()) {
    var jsondata='{"channels": {"uid": {"current-value":"'+card.uid.toString('hex')+'"}}, "lastUpdate":'+Date.now()+'}'
    pushData(jsondata,SO_ID, "rfid");
    console.log(jsondata);
  }
  led1.toggle();
});




