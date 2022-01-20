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
  username: { type: String, required: true },
  log: [
      {
        description: { type: String },
        duration: { type: Number },
        date: { type: Date, required: false }
      }
    ]
});

const User = mongoose.model("User", userSchema);

app.post('/api/users', function (req, res) {

  if (!req.body.username || req.body.username.length === 0) {
    return res.status(400).json({error : "Required field username."});
  }
 
  const user = new User({
      username: req.body.username
  });
  
  user.save(function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
    
});

app.get('/api/users', function (req, res) {
  User.find({}, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

app.post('/api/users/:_id/exercises', async function (req, res) {

  if (!req.params._id || req.params._id ===0) {
    return res.status(400).json({error : "Insert valid Id."});
  }

  const user = await User.findById(req.params._id).lean().exec();

  if (!user) {
    return res.status(400).json({error : "User doesn't exist."});
  }

  if (!req.body.description || req.body.description.length === 0) {
    return res.status(400).json({error : "Required field description."});
  }

  if (!req.body.duration || req.body.duration.length <= 0) {
    return res.status(400).json({error : "Invalid field duration."});
  }

  const dateStringFormat = req.body.date ? new Date(req.body.date) : new Date();

  const exercise = { 
    description: req.body.description,
    duration: Number(req.body.duration),
    date: dateStringFormat
  };

  User.findByIdAndUpdate(req.params._id,
    {$push: { log: exercise } },
    { new: true},
     function(err, result) {
    if (err) {
      res.send(err);
    } else {
      let returnObj ={
        "_id":req.params._id,
        "username":user.username,
        "date":exercise.date.toDateString(),
        "duration":parseInt(exercise.duration),
        "description":exercise.description
      }
      return res.json(returnObj)      
    }
  });
});

app.get('/api/users/:_id/logs', async function (req, res) {
  const user = await User.findById(req.params._id).lean().exec();
  const numberOfExercises = Object.keys(user.log).length;

 /*var query = {
      username: user.username,
      log: ""
  };  
  
  if (req.query.from && req.query.to) {
    query.log = { $gte: req.query.from, $lte: req.query.to };
  } else if (req.query.from) {
    query.log = { $gte: req.query.from };
  } else if (req.query.to) {
    query.log = { $lte: req.query.to };
  };
  
  var fromDate = new Date(req.query.from);
  var toDate = new Date(req.query.to);
  
  var query = {"username": user.username, "log.date": { $gte: fromDate } };
  
  console.log(query);
  
  let result = {};
  
  if (req.query.limit) {
    result = await User.find(query).limit(parseInt(req.query.limit)).lean().exec();
  } else {
    result = await User.find(query).lean().exec();
  };
  
  console.log(result);
  */

  user.log.forEach(element => {
    element.date = element.date.toDateString()
  });

  user.count = numberOfExercises;
  res.json(user);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
