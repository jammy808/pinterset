var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const upload = require('./multer')

const localStratergy = require('passport-local');
const passport = require('passport');
passport.use(new localStratergy(userModel.authenticate()));

const { MongoClient } = require('mongodb');  //
const { GridFSBucket } = require('mongodb');
const { createReadStream } = require('fs');
const Datauri = require('datauri');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    client.connect();
    const database = client.db('your-database-name');
    const bucket = new GridFSBucket(database); //


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

router.post('/createpost', isLoggedIn , upload.single('postImg') , async function(req, res, next) { //
  try {

    const user = await userModel.findOne({ username: req.session.passport.user });

    const uploadStream = bucket.openUploadStream(req.file.filename);
    const readStream = createReadStream(req.file.path);

    readStream.pipe(uploadStream);

    uploadStream.on('finish', async () => {
      const post = await postModel.create({
        user: user._id,
        title: req.body.title,
        description: req.body.description,
        image: req.file.filename,
      });

      user.posts.push(post._id);
      await user.save();

      res.redirect('/profile');
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } 

  
  res.redirect('/profile');

});

router.get('/show', isLoggedIn ,async function(req, res, next) { //
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  
  const postsWithImages = await Promise.all(user.posts.map(async (post) => {
    const downloadStream = bucket.openDownloadStreamByName(post.image);
    
    let imageBase64 = '';
    downloadStream.on('data', (chunk) => {
      imageBase64 += chunk.toString('base64');
    });

    await new Promise((resolve) => {
      downloadStream.on('end', () => {
        post.imageBase64 = `data:image/jpeg;base64,${imageBase64}`;
        console.log(`Image Base64 for ${post.title}: ${post.imageBase64}`);
        resolve();
      });
    });
    
    return post;
  }));

  res.render('show', { user, nav: true, postsWithImages });
});

router.get('/feed', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user});
  const posts = await postModel.find().populate('user');
  res.render('feed',{user , posts, nav : true });
});

module.exports = router;
