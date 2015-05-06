var wifi = require('wifi-cc3000');
var tessel = require('tessel');
var Stomp = require('stompjs');
 
var url="/topic/14309331869746ec633d011e946d187b637babcd4a6fd.actions";

var led1 = tessel.led[0].output(0); // Green -- Sensing
var led2 = tessel.led[1].output(0); // Blue  -- Pushing data

var client = Stomp.overTCP('api.servioticy.com', 1883);

var config = require('./config')

var network = config.wifi_ssid; // put in your network name here
var pass = config.wifi_pass; // put in your password here, or leave blank for unsecured
var security = ''; // other options are 'wep', 'wpa', or 'unsecured'


function connect() {
  console.log("Connecting to WiFi");
  wifi.reset();
  wifi.connect({
      security: security
      , ssid: network
      , password: pass
      , timeout: 60 // in seconds
  }); 
}

/************** Handlers ********************/

wifi.on('connect', function(data){
  console.log("connected to WiFi", data);
  console.log("subscription url: "+url);
  client.connect('compose', 'shines', function(frame) {
	client.subscribe(url, function(message) {
			console.log(message.body);
	        if(JSON.parse(message.body).description.name == "led_blue")
	        	led2.toggle();
	        if(JSON.parse(message.body).description.name == "led_green")
	        	led1.toggle();
	  });
	});
});


wifi.on('disconnect', function(data){
  console.log("disconnect emitted", data);
  connect();
});

wifi.on('error', function(err){
  console.log("error emitted", err);
});

connect();


        