const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/pintersetDB");

const userSchema = mongoose.Schema({
  usernamme : String,
  name : String,
  email : String,
  password : String,
  profileImg : String,

  boards : {
    type : Array,
    default : []
  },
  
  posts : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "Post"
  }]
})

userSchema.plugin(plm);

module.exports = mongoose.model('User',userSchema);