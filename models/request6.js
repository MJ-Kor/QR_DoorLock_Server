var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// 스키마
var requestSchema = mongoose.Schema({
  name:{
    type:String,
    required:[true,'Name is required!']
  },
  department:{
    type:String,
    required:[true,'Department is required!']
  },
  stdId:{
    type:String,
    required:[true,'Student-id is required!'],
    match:[/^.{6}$/,'학번은 6자입니다!'],
    trim:true,
    unique:true
  }
});

var ReQuest6 = mongoose.model('request6', requestSchema);
module.exports = ReQuest6;