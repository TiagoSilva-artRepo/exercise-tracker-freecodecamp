const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var mongoose = require('mongoose');
const { response } = require('express');
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json())
app.use(express.urlencoded({ extended: true}))

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema({
  username: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.post('/api/users', function (req, res) {

  if (!req.body.username || req.body.username.length === 0) {
    return res.status(400).json({error : "Required field username."});
  }
  
  try {    
    const user = new User({
      username: req.body.username
    });
  
    user.save();
  
    res.json(user);
  } catch (error) {
    res.status(500).send(error)
  }

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
