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

const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, }
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

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

  const exercise = new Exercise({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: dateStringFormat.toDateString()
  });

  user.description = exercise.description;
  user.duration = exercise.duration;
  user.date = exercise.date;

  exercise.save(function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.json(user);
    }
  });

});

app.get('/api/users/:_id/logs', async function (req, res) {
  const user = await User.findById(req.params._id).lean().exec();
  const exercises = await Exercise.find({username: user.username}).lean().exec();
  const numberOfExercises = await Exercise.find({username: user.username}).count().exec();


  exercises.forEach(element => {
    element.date = element.date.toString()
  });

  user.count = numberOfExercises;
  user.log = exercises;
  res.json(user);
});

app.get('/api/exercises', function (req, res) {
  Exercise.find({}, function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
