var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const upload = require('./multer')

const localStratergy = require('passport-local');
const passport = require('passport');
passport.use(new localStratergy(userModel.authenticate()));


router.get('/profile', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  res.render('profile',{user , nav : true });
});

router.get('/add', isLoggedIn ,async function(req, res, next) {
  res.render('add',{nav : true });
});

router.get('/', function(req, res, next) {
  res.render('index',{nav : false});
});

router.get('/register', function(req, res, next) {
  res.render('register', {nav : false});
});

router.post('/register', function(req, res, next) {
  var userData = new userModel({
    username : req.body.username,
    name : req.body.name,
    email : req.body.email
  })
  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res , function(){
      res.redirect('/profile');
    })
  })
});

router.post('/logon', passport.authenticate("local" , {
  successRedirect : "/profile",
  failureRedirect : "/"
}) , function(req, res, next){});

router.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/");
}

router.post('/fileupload', isLoggedIn , upload.single('image') , async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user});
  user.profileImg = req.file.filename;
  await user.save();
  res.redirect('/profile');
});

router.post('/createpost', isLoggedIn , upload.single('postImg') , async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user});
  const post = await postModel.create({
    user : user._id,
    title : req.body.title,
    description : req.body.description,
    image : req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');

});

router.get('/show', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  res.render('show',{user , nav : true });
});

router.get('/feed', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user});
  const posts = await postModel.find().populate('user');
  res.render('feed',{user , posts, nav : true });
});

module.exports = router;
