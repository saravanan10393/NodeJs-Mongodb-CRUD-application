var express = require('express');
var router = express.Router();

var user = require('./schema/userSchema').userModel;
var blogpost = require('./schema/userSchema').blogPostModel;

/* GET users listing. */
router.post('/register',function(req,res){

      var newuser = new user({
        username : req.body.username,
        password : req.body.password,
        name : req.body.name
      });
      user.findOne({username : req.body.username, password : req.body.password},function(err,data){
        if(data)
           res.send("User already registered with this id");
         else{
           newuser.save(function(err,data){
             var results = {user : {"_id":data._id,"name":data.name}};
             blogpost.find({verified:true},function(err,blogs){
               results.blogs = blogs;
               res.send(results);
             });
           });
         }
      });
});

router.post('/login',function(req,res){
  user.findOne({username : req.body.username, password : req.body.password})
              .populate('posts').exec(function(err,data){
                  console.log("fetched result",data);
                  var result = {user : {"id":data._id,"name":data.name}}
                  blogpost.find({verified:true},function(err,blogs){
                    result.blogs = blogs;
                    res.send(result);
                  });
                  
              });

});

router.post('/createNewPost',function(req,res){
  user.findOne({_id : req.header('userId')},function(err,user){
            if(err)
              res.send(err)
            else{
                blogpost.findOne({title : req.body.title , tag : req.body.tag,question : req.body.question},function(err,data){
                   if(data){
                     var result ={
                       err : "You have already asked the same question" ,
                       data : data
                     }
                     res.send(result);
                   }else{
                     var post = new blogpost({
                       title : req.body.title,
                       tag : req.body.tag,
                       question : req.body.question,
                       verified : false,
                       createdBy : user._id
                     });
                     post.save(function(err,data){
                         if(data){
                           user.posts.push(data._id);
                           user.save();
                           res.send(data);
                         }else
                            res.send(err);
                     });
                   }
              });
            }
  });
});

router.post('/getblogs',function(req,res){
  user.findOne({_id : req.header('userId')},function(err,data){
    if(data){
      blogpost.find({verified : true}).populate({path : 'createdBy',select : '_id name'}).populate({path :'comment.user',select : '_id name'}).exec(function(err,data){
        if(data)
          res.send(data);
        else
          res.send(err);
      });
    }
  });
});

router.patch('/updateBlog',function(req,res){
     user.findOne({_id : req.header('userId')},function(err,user){
       if(user){

         var blog = {};

         if(req.body.title != "")
            blog.title = req.body.title;
         if(req.body.tag != "")
            blog.tag = req.body.tag;
         if(req.body.question != "")
            blog.question = req.body.question;
         if(req.body.answer != "")
            blog.answer = req.body.answer;

         blogpost.update({_id : req.body.blogId,createdBy : user._id,verified : true},{$set :blog},function(err,blog){
           if(blog)
              res.send(blog);
           else
              res.send("Error in updating blog");
         });
       }
     });
});

router.delete('/deleteBlog',function(req,res){
    user.update({_id: req.header('userId')}, {$pull: {'posts': req.body.blogId}}, function(err, updateuser) {
        if(err)
          res.send(err);
        else {
             console.log("finded user",updateuser._id);
             blogpost.remove({_id : req.body.blogId,createdBy : req.header('userId')},function(err,data){
                if(data){
                  res.send(data);
                }else{
                  res.send("error in deleting blog");
                }
             });
        }
    });
});

router.post('/postAnswer',function(req,res){
   user.findOne({_id : req.header('userId')},function(err,user){
     if(user){
       if(req.body.answer == "" || !req.body.answer){
         res.send("Required Field is missing");
       }else{
         blogpost.update({_id:req.body.blogId,verified : true},{$set:{answer : req.body.answer}},function(err,blog){
            if(blog)
              res.send(blog);
            else
              res.send(err);
         });
       }
     }
   })
});

// router.post('/updateAnswer',function(req,res){
//    user.findOne({_id : req.header('userId')},function(err,user){
//      if(user){
//        if(req.body.answer == "" || !req.body.answer){
//          res.send("Required Field is missing");
//        }else{
//          blogpost.update({_id:req.body.blogId,verified : true},{$set:{answer : req.body.answer}},function(err,blog){
//             if(blog)
//               res.send(blog);
//             else
//               res.send(err);
//          });
//        }
//      }
//    })
// });


router.post('/createComment',function(req,res){
  user.findOne({_id : req.header('userId')},function(err,user){
    if(user){
      blogpost.findOneAndUpdate({_id:req.body.blogId,verified : true},{$push:{comment : {id : {$inc : {id : 1}},message : req.body.message, user : user._id}}},{new : true},function(err,blog){
        if(blog){
          blog.populate({path : 'createdBy',select : '_id name'}).populate({path :'comment.user',select : '_id name'})
          res.send(blog);
        }else
          res.send(err);
      });
    }
  });
});

router.patch('/updateComment',function(req,res){
  user.findOne({_id : req.header('userId')},function(err,user){
    if(user){
      blogpost.update({_id:req.body.blogId,verified : true,"comment.user":user._id,"comment._id":req.body.commentId},{$set : {"comment.$.message":req.body.message}},function(err,blogpost){
        if(blogpost)
          res.send(blogpost);
        else
          res.send(err);
      });
    }
  });
});

router.delete('/deleteComment',function(req,res){
  user.findOne({_id : req.header('userId')},function(err,user){
    if(user){

      blogpost.update({_id:req.body.blogId,"comment.user":user._id},{$pull :{comment:{"commnet.$._id":req.body.comentId}}},function(err,blog){
        if(blog){
          res.send(blog);
        }else{
          res.send(err);
        }

      });
    }
  });
});

router.get('/findblogs',function(req,res){
    console.log(req.query);
    blogpost.find({$or : [{title : {$regex : req.query.keyWord}},{tag : {$regex : req.query.keyWord}},{question : {$regex : req.query.keyWord}}],verified : true},function(err,blogpost){
      if(blogpost.length != 0)
          res.send(blogpost);
      else
          res.send("No Record Found");

    });
});


module.exports = router;
