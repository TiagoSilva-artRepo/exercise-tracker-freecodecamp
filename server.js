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
  exercices: [
      {
        description: { type: String },
        duration: { type: Number },
        date: { type: String, required: false }
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
    date: dateStringFormat.toDateString()
  };

  User.findByIdAndUpdate(req.params._id, {$push: { exercices: exercise } }, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      user.description = exercise.description;
      user.duration = exercise.duration;
      user.date = exercise.date;
      delete user.exercices;
      res.json(user);
    }
  });
});

app.get('/api/users/:_id/logs', async function (req, res) {
  const user = await User.findById(req.params._id).lean().exec();

  var query = {
      username: user.username
  };

  if (req.query.from && req.query.to) {
    query.date = { $gte: req.query.from, $lte: req.query.to }
  } else if (req.query.from) {
    query.date = { $gte: req.query.from };
  } else if (req.query.to) {
    query.date = { $lte: req.query.to };
  };

  let exercises = {};

  if (req.query.limit) {
    exercises = await User.find(query).limit(parseInt(req.query.limit)).lean().exec();
  } else {
    exercises = await User.find(query).lean().exec();
  };

  const numberOfExercises = await User.find({username: user.username}).count().exec();

  exercises.forEach(element => {
    element.date = element.date.toDateString()
  });

  user.count = numberOfExercises;
  user.log = exercises;
  res.json(user);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
