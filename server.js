const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
let jwt = require('jsonwebtoken');
const loki = require('lokijs');
let bcrypt = require('bcrypt');

//number of salt rounds for password hashing for deving
const TEST_SALT_ROUNDS = 5;
//Jwt secret for deving
const TEST_SECRET = 'MYTESTSECRET';
//in memory database
let db = new loki('loki.json');
let users = db.addCollection('users');


class RequestHandlers {
  register (req, res) {
    if(!req.body.username || !req.body.password){
      return res.status(422).json({
        success: false,
        message: 'Username or password missing'
      });
    }
    bcrypt.hash(req.body.password, parseInt(process.env.SALT_ROUNDS) || TEST_SALT_ROUNDS, function(err, hash) {
      if(err){
        return res.status(500).json({
          success: false,
          message: 'Error occourd from server'
        });
      }
      users.insert({username: req.body.username, password: hash});
      return res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });
    });
  }
  login (req, res) {
    let user = users.findOne({username: req.body.username});
    if(!user){
      return res.status(403).json({
        success: false,
        message: 'Incorrect username or password'
      });
    }
    bcrypt.compare(req.body.password, user.password, function(err, matched) {
      if(err){
        return res.status(500).json({
          success: false,
          message: 'Error occourd from server'
        });
      }
      if(!matched){
        return res.status(403).json({
          success: false,
          message: 'Incorrect username or password'
        });
      }
      let token = jwt.sign({username: req.body.username},
        process.env.SECRET || TEST_SECRET,
        { expiresIn: process.env.EXPIRE || '2m' // expires in 2mins
        }
      );
      // return the JWT token for the future API calls
      res.json({
        success: true,
        message: 'Authenticated Successfully',
        token: token
      });
    });
  }
}


let app = express();
const port = process.env.PORT || 6010;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let handlers = new RequestHandlers();

// Routes & Handlers
app.post('/register', handlers.register);
app.post('/login', handlers.login);

if(process.env.ENV != 'TEST'){
  //init swagger
  const swaggerDocument = yaml.load('./swagger.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  //run app
  app.listen(port, () => console.log(`Server is listening on port: ${port}\n
  Visit /api-docs on how to use the API`));
}

//Export app mainly for testing
module.exports = app;