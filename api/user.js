var express  = require('express');
var util     = require('../util');
var jwt      = require('jsonwebtoken')
var router   = express.Router();
var Gong6    = require('../models/Gong6');
var Gong7    = require('../models/Gong7');
var ReQuest6  = require('../models/request6');
var ReQuest7  = require('../models/request7');
var QRcode   = require('qrcode');
require("dotenv").config({path:"variables.env"});


// 회원가입
router.post('/new',
  function(req,res,next){
    var newGong6 = new Gong6(req.body);
    var newGong7 = new Gong7(req.body);
    newGong6.save(function(err){
      if(err){
        res.json(util.successFalse(err));
      }
      else{
        newGong7.save(function(err,student2){
          res.json(err||!student2? util.successFalse(err): util.successTrue(student2));
      });
      }
      
  });
    
});

// 로그인
router.post('/login',
  function(req,res,next){
    var isValid = true;
    var validationError = {
      name:'ValidationError',
      errors:{}
    };
    // 아이디가 없으면..
    if(!req.body.stdId){
      isValid = false;
      validationError.errors.stdId = {message:'stdId is required!'};
    }
    // 패스워드가 없으면..
    if(!req.body.stdId){
      isValid = false;
      validationError.errors.stdId = {message:'stdId is required!'};
    }

    if(!isValid) return res.json(util.successFalse(validationError));
    else next();
  },
  function(req,res,next){
    Gong7.findOne({stdId:req.body.stdId})
    .select({password:1, stdId:1, name:1})
    .exec(function(err, student){
      if(err) return res.json(util.successFalse(err));
      else if (!student||!student.authenticate(req.body.password))
        return res.json(util.successFalse('stdId or Password is invaild!'));
      else {
        var payload = {
          _id : student._id,
          stdId: student.stdId
        };
        var secretOrPrivateKey = process.env.JWT_SECRET;
        var options = {expiresIn: 60*60*24};
        // token 생성 함수
        jwt.sign(payload, secretOrPrivateKey, options, function(err, token){
          if(err) return res.json(util.successFalse(err));
          res.json(util.successTrue(token));
        });
      }
    });
  }
);

// 내정보
router.get('/me', util.isLoggedin,
  function(req,res,next){
    Gong7.findById(req.decoded._id)
    .exec(function(err, student){
      if(err||!student) return res.json(util.successFalse(err));
      res.json(util.successTrue(student));
    })
  }
);

// 출입 권한 요청
router.post('/:building/request', util.isLoggedin,
  function(req,res,next){
    if(req.params.building == "공6"){
      var newReQuest6 = new ReQuest6(req.body);
      newReQuest6.save(function(err, student){
        res.json(err||!student? util.successFalse(err): util.successTrue("요청 완료"));
      });
    }
    else if(req.params.building == "공7"){
      var newReQuest7 = new ReQuest7(req.body);
      newReQuest7.save(function(err, student){
        res.json(err||!student? util.successFalse(err): util.successTrue("요청 완료"));
      });
    }
    else{
      res.json(util.successFalse("해당 건물은 존재하지 않습니다."))
    }
    
  }
);

// QR 코드 생성
router.get('/qr', util.isLoggedin,
  function(req,res,next){
    let inputStr = "stdId :" + req.decoded.stdId;
    QRcode.toDataURL(inputStr, function(err, url){
      let line = url.replace(/.*,/,'');
      res.json(util.successTrue(line));
    })
  }
);
module.exports = router;