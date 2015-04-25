var express = require('express');
var mongoose = require('mongoose');

var blogpostSchema =  new mongoose.Schema({
    title : {type:String,required : true},
    tag : {type:String,required : true},
    question : {type:String,required : true},
    answer : {type:String},
    comment : [{
      id : {type : Number,default : 0},
      user : {type : mongoose.Schema.Types.ObjectId , ref : 'User'},
      message : {type : String}
    }],
    verified : Boolean,
    createdBy : {type : mongoose.Schema.Types.ObjectId , ref : 'User'}
});

var userSchema = new mongoose.Schema({
  username : {type : String , required : true},
  password : {type : String , required : true},
  name : {type : String , required : true},
  posts : [{type : mongoose.Schema.Types.ObjectId , ref : 'Blogpost'}]
});

var adminSchema = new mongoose.Schema({
  username : {type : String , required : true},
  password : {type : String , required : true},
  name : {type : String , required : true}
});

var user = mongoose.model('User',userSchema);
var blogpost = mongoose.model('Blogpost',blogpostSchema);
var admin = mongoose.model('Admin',adminSchema);

module.exports = {
  userModel : user,
  blogPostModel : blogpost,
  adminModel : admin
}
