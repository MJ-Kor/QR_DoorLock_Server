var express  = require('express');
var util     = require('../util');
var router   = express.Router();
var jwt      = require('jsonwebtoken')
var Admins   = require('../models/admins');
var Gong7    = require('../models/Gong7');
var Gong6    = require('../models/Gong6');
var ReQuest6  = require('../models/request6');
var ReQuest7  = require('../models/request7');
require("dotenv").config({path:"variables.env"});

// 회원가입
router.post('/adnew',
  function(req,res,next){
    var newAdmin = new Admins(req.body);
    newAdmin.save(function(err, admin){
      res.json(err||!admin? util.successFalse(err): util.successTrue(admin));
    })
  }
);

// 로그인
router.post('/adlogin',
  function(req,res,next){
    var isValid = true;
    var validationError = {
      name:'ValidationError',
      errors:{}
    };
    // 아이디가 없으면..
    if(!req.body.name){
      isValid = false;
      validationError.errors.stdId = {message:'Name is required!'};
    }
    // 패스워드가 없으면..
    if(!req.body.password){
      isValid = false;
      validationError.errors.password = {message:'Password is required!'};
    }

    if(!isValid) return res.json(util.successFalse(validationError));
    else next();
  },
  function(req,res,next){
    //입력한 아이디를 스키마에서 찾음
    Admins.findOne({stdId:req.body.stdId})
    .select({password:1,stdId:1,name:1})
    // 패스워드 일치 여부 판단
    .exec(function(err,admin){
      // 에러
      if(err) return res.json(util.successFalse(err));
      // 패스워드 불일치
      else if(!admin||!admin.authenticate(req.body.password))
         return res.json(util.successFalse('stdId or Password is invalid'));
      // 로그인 성공
      else {
        var payload = {
          _id : admin._id,
          name: admin.name
        }; // token에 저장될 정보
        var secretOrPrivateKey = process.env.JWT_SECRET;                            // hash 생성에 사용되는 key문자열, 해독 시 생성에 같은 문자열을 사용해야 해독할 수 있다.
        var options = {expiresIn: 60*60*24};                                               // 24시간이 지나면 token이 무효
        // token 생성 함수
        jwt.sign(payload, secretOrPrivateKey, options, function(err, token){
          if(err) return res.json(util.successFalse(err));
          res.json(util.successTrue(token));
        });
      }
    });
  }
);

// 공6 출입 권한 요청자 목록
router.get('/requested6', util.isLoggedin,
  function(req,res,next){
    ReQuest6.find({})
      .sort({name:1})
      .exec(function(err, students){
        res.json(err||!students? util.successFalse(err): util.successTrue(students));
      });
  }
);

// 공7 출입 권한 요청자 목록
router.get('/requested7', util.isLoggedin,
  function(req,res,next){
    ReQuest7.find({})
      .sort({name:1})
      .exec(function(err, students){
        res.json(err||!students? util.successFalse(err): util.successTrue(students));
      });
  }
);


// 사용자 삭제
router.delete('/:stdId/studentdel', util.isLoggedin,
  function(req,res,next){
    Gong6.findOneAndRemove({stdId:req.params.stdId})
    .exec(function(err1){
      if(err1){
        res.json(util.successFalse(err1));
      }
      else{
        Gong7.findOneAndRemove({stdId:req.params.stdId})
        .exec(function(err2,student2){
          res.json(err2||!student2? util.successFalse(err2): util.successTrue(student2));
        });
      }
    });
  }
);

// 출입 권한 부여 이거 이대로 괜찮나?
router.put('/:stdId/:building/useraccept', util.isLoggedin,
  function(req,res,next){
    if(req.params.building == '공6'){
      Gong6.findOne({stdId:req.params.stdId})
      .exec(function(err1, student){
        student.accept = 'T';
        ReQuest6.findOneAndRemove({stdId:student.stdId})
        .exec(function(err2){
          if(err2){
            res.json(util.successFalse(err2));
          }
          else{
            student.save(function(err3,student1){
              if(err3){
                res.json(util.successFalse(err3))
              }
              else{
                res.json(err1||!student? util.successFalse(err1): util.successTrue("권한 부여 성공"))
              }
            });
          }
        });
      });
    }
    else{
      Gong7.findOne({stdId:req.params.stdId})
      .exec(function(err1, student){
        student.accept = 'T';
        ReQuest7.findOneAndRemove({stdId:student.stdId})
        .exec(function(err2){
          if(err2){
            res.json(util.successFalse(err2));
          }
          else{
            student.save(function(err3,student1){
              if(err3){
                res.json(util.successFalse(err3))
              }
              else{
                res.json(err1||!student? util.successFalse(err1): util.successTrue("권한 부여 성공"))
              }
            });
          }
        });
      });
    }
  })

//TODO : 출입 요청 DB에서 출입 요청을 허락하는 방법 

module.exports = router;