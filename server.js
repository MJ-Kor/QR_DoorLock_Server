var express       = require('express');
var path          = require('path');
var mongoose      = require('mongoose');
var bodyParser    = require('body-parser');
var mqtt          = require('mqtt');
var app           = express();
require("dotenv").config({path:"variables.env"});

// DB 연결
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_DB_LOGIN_API, {useNewUrlParser:true, useUnifiedTopology: true});
var db = mongoose.connection;
db.once('open', function () {
  console.log('DB connected!');
});
db.on('error', function (err) {
 console.log('DB ERROR:', err);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) {
 res.header('Access-Control-Allow-Origin', '*');
 res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
 res.header('Access-Control-Allow-Headers', 'content-type, x-access-token'); //1
 next();
});

// API
app.use('/api/user', require('./api/user'));
app.use('/api/admin', require('./api/admin'));   

// Server
var port = 3000;
app.listen(port, function(){
 console.log('listening on port:' + port);
});


//mqtt broker ip
var client = mqtt.connect("mqtt://172.20.10.3");                // mqtt broker의 ip주소로 broker와 연결

//mqtt subscriber - QR 인식을 담당하는 라즈베리파이에서 넘어오는 QR코드 정보를 받는 subscriber
client.on("connect",()=> {
 console.log("mqtt connect")
 client.subscribe("QR");
})

// 도어락에서 넘어온 QR 정보가 파싱 가능한 형식인가 판단하는 함수
function isJson(str) {
 try{
   JSON.parse(str);
 } catch (e) {
     return false;
 }
 return true;
}

// QR 정보를 받고 나서 진행할 함수
client.on("message", async(topic, message)=> {
 TF = isJson(message);
 if(TF)                                                           // QR에 담긴 정보가 JSON 파싱 가능한 형태이면
 {
   var obj = JSON.parse(message);
   console.log(obj.username)                              // 터미널에 QR에 담겨있는 학번 출력
   // 해당 학번이 데이터베이스에 있는 사용자인지 확인하는 함수
   User.findOne({'username':obj.username}).exec(function(err,user){
   console.log(user.accept);                                 // 터미널에 accept 값 출력
   if (user != null)                                             // 사용자가 데이터베이스에 있는 경우
   {
     if (user.accept == "T")                                  // 출입 권한이 있으면 result Topic에 OPEN 송신
     {
       client.publish("result", "OPEN")
     }
     else                                                         // 출입 권한이 없으면 result Topic에 CLOSE 송신
     {
       client.publish("result", "CLOSE")
     }
   }
   else                                                          // 사용자가 데이터 베이스에 없는 경우 result Topic에 CLOSE 송신
   {
     client.publish("result", "CLOSE")
   }
   })
 }
 else                                                            // QR에 담긴 정보가 JSON 파싱 불가능한 형태이면 result Topic에 CLOSE 송신
 {
   client.publish("result", "CLOSE")
 }
})
