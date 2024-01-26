const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

const uri = "mongodb+srv://soham:soham@cluster1.4rc4s.mongodb.net/pintrest?retryWrites=true&w=majority";

mongoose.connect(uri);

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
