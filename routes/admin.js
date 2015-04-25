var express = require('express');
var router = express.Router();

var user = require('./schema/userSchema').userModel;
var blogpost = require('./schema/userSchema').blogPostModel;
var Admin = require('./schema/userSchema').adminModel;

router.post('/login',function(req,res){
  Admin.findOne({username : req.body.username,password : req.body.password},function(err,admin){
      if(admin){
        var result ={};
        result.admin = admin;
        blogpost.find({}).populate({path :'createdBy',select : '_id name'}).exec(function(err,blogs){
          result.blogs = blogs;
          res.send(result);
        });
      }else{
        res.send(err);
      }
    });
});

router.post('/register',function(req,res){
  Admin.findOne({username : req.body.username,password : req.body.password},function(err,admin){
      if(admin){
        res.send("User alread present with Id");
      }else{
          var newAdmin = new Admin();
          newAdmin.username = req.body.username;
          newAdmin.username = req.body.username;
          newAdmin.password = req.body.password;
          newAdmin.name = req.body.name;
          newAdmin.save(function(err,admin){
             if(admin){
               var result = {};
               blogpost.find({}).populate({path :'createdBy',select : '_id name'}).exec(function(err,blogs){
                 result.blogs = blogs;
                 result.admin = admin;
                 res.send(result);
               });
             }
           });
      }
  });
});


router.patch('/verifyPost',function(req,res){
  Admin.findOne({_id : req.header('adminId')},function(err,admin){
    if(admin){
      blogpost.update({_id : req.body.blogId},{$set : {verified : req.body.isVerified}},function(err,blog){
        res.send('record updated successfully');
      });
    }else
      res.send(err);
  })
});

module.exports = router;
