var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// 스키마
var studentSchema = mongoose.Schema({
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
  },
  password:{
    type:String,
    required:[true,'Password is required!'],
    select:false
  },
  accept:{
    type:String,
    default:'F'
  }
},{
  toObject:{virtuals:true}
});
 studentSchema.virtual('passwordConfirmation')
.get(function(){return this._passwordConfirmation;})
.set(function(value){this._passwordConfirmation=value;});
 studentSchema.virtual('originalPassword')
.get(function(){return this._originalPassword;})
.set(function(value){this._originalPassword=value;});
 studentSchema.virtual('currentPassword')
.get(function(){return this._currentPassword;})
.set(function(value){this._currentPassword=value;});
 studentSchema.virtual('newPassword')
.get(function(){return this._newPassword;})
.set(function(value){this._newPassword=value;});

var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = '알파벳과 숫자를 섞어 8자 이상으로 입력해주세요.'; studentSchema.path('password').validate(function(v){
  var student = this;

  if(student.isNew){
    if(!student.passwordConfirmation){
      student.invalidate('passwordConfirmation', '암호 재 확인을 해주세요.');
    }
    if(!passwordRegex.test(student.password)){
      student.invalidate('password', passwordRegexErrorMessage);
    }
    else if(student.password !== student.passwordConfirmation){
      student.invalidate('passwordConfirmation', '두 암호가 일치하지 않습니다.');
    }
  }
    // 유저 업데이트 : 관리자 기능
    if(!student.isNew){
      if(!student.currentPassword){
        student.invalidate('currentPassword', 'Current Password is required!');
      }
      if(student.currentPassword && !bcrypt.compareSync(student.currentPassword, student.originalPassword)){
        student.invalidate('currentPassword', 'Current Password is invalid!');
      }
      if(student.newPassword && !passwordRegex.test(student.newPassword)){
        student.invalidate('newPassword', passwordRegexErrorMessage);
      } else if(student.newPassword !== student.passwordConfirmation) {
        student.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
      }
    }
});

// 패스워드 암호화 
studentSchema.pre('save', function (next){
  var student = this;
  if(!student.isModified('password')){
    return next();
  } else {
    student.password = bcrypt.hashSync(student.password);
    return next();
  }
});

// model methods 
studentSchema.methods.authenticate = function (password) {
  var student = this;
  return bcrypt.compareSync(password,student.password);
};

var Gong6 = mongoose.model('Gong6', studentSchema);
module.exports = Gong6;