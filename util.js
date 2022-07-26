const e = require('express');
var jwt = require('jsonwebtoken');
require("dotenv").config({path:"variables.env"});
var util = {};

util.successTrue = function(data){
  console.log("success");
  return {
    success:true,
    message:null,
    errors:null,
    data:data      
  };
}

util.successFalse = function(err, message){
  if(!err&&!message) message = 'data not found';
  return {
    success:false,
    message:message,
    errors:(err)? util.parseError(err):null,
    data:null
  };
};

util.parseError = function(errors){
  var parsed = {};
  console.log(errors)
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message};
    }
  } else if(errors.code == '11000' && errors.errmsg.indexOf('stdId')>0) {
    parsed.stdId = { message:'This stdId already exists!' };
  } else {
    parsed.unhandled = errors;
  }
  return parsed;
};

util.isLoggedin = function(req,res,next){
  var token = req.headers['x-access-token'];
  if(!token) return res.json(util.successFalse(null,'token is required!'));
  else{
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if(err) return res.json(util.successFalse(err));
      else{
        req.decoded = decoded;
        next();
      }
    });
  }
};

module.exports = util;