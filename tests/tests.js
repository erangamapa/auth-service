const request = require('supertest');
const proxyquire = require('proxyquire-2');
const expect = require('chai').expect;


describe('Should be able to register users and authenticate them properly', function() {
  let app = null;
  it('Should return 422 when trying to register user with empty username and/or password', function (done) {
    //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              return {username: 'rightusername', password: 'rightpasswordhash'};
            },
            insert: () => {
              return true;
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          cb(null, true);
        },
        hash: (password, saltrounds, cb) => {
          cb(null, 'passwordhash');
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/register')
      .send({ username: '', password: ''})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(422);
        expect(res.body).to.have.property('message');
        expect(res.body.success).to.equal(false);
        done(err);
      });
  });
  it('Should return 500 when error occoured in the server', function (done) {
    //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              return {username: 'rightusername', password: 'rightpasswordhash'};
            },
            insert: () => {
              return true;
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          cb(null, true);
        },
        hash: (password, saltrounds, cb) => {
          cb({message: 'error'}, null);
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/register')
      .send({ username: 'rightusername', password: 'rightpasswordhash'})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(500);
        expect(res.body).to.have.property('message');
        expect(res.body.success).to.equal(false);
        done(err);
      });
  });
  it('Should return 201 when trying to register user with proper username and password', function (done) {
     //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              return {username: 'rightusername', password: 'rightpasswordhash'};
            },
            insert: () => {
              //mock insert success
              return true;
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          cb(null, true);
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/register')
      .send({ username: 'rightusername', password: 'rightpassword'})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(201);
        expect(res.body).to.have.property('message');
        expect(res.body.success).to.equal(true);
        done(err);
      });
  });
  it('Should return 403 when sending wrong username', function (done) {
     //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              //should not be able to find the user in database
              return null;
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          cb(null, true);
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/login')
      .send({ username: 'worngusername', password: 'rightpassword'})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(403);
        expect(res.body).to.have.property('message');
        expect(res.body.success).to.equal(false);
        done(err);
      });
  });
  it('Should return 403 when sending wrong password', function (done) {
     //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              //should be able to find the user
              return {username: 'rightusername', password: 'rightpasswordhash'};
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          //passwords should not be matched
          cb(null, false);
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/login')
      .send({ username: 'rightusername', password: 'wrongpassword'})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(403);
        expect(res.body).to.have.property('message');
        expect(res.body.success).to.equal(false);
        done(err);
      });
  });
  it('Should return 500 when error occours in the server', function (done) {
    //mock dependencies in server
   app = proxyquire('../server', { 
     lokijs: class loki{
       constructor(){

       }
       addCollection() {
         return {
           findOne: () => {
             //should be able to find the user
             return {username: 'rightusername', password: 'rightpasswordhash'};
           }
         }
       }
     },
     bcrypt: {
       compare: (expected, actual, cb) => {
         //passwords should not be matched
         cb({message: 'error'}, false);
       }
     },
     jsonwebtoken: {
       sign: () => {
         return 'token';
       }
     }
   });
   request(app)
     .post('/login')
     .send({ username: 'rightusername', password: 'wrongpassword'})
     .end(function(err, res) {
       expect(res.statusCode).to.equal(500);
       expect(res.body).to.have.property('message');
       expect(res.body.success).to.equal(false);
       done(err);
     });
 });
  it('Should return 200 with jwt token when sending correct login details', function (done) {
     //mock dependencies in server
    app = proxyquire('../server', { 
      lokijs: class loki{
        constructor(){

        }
        addCollection() {
          return {
            findOne: () => {
              //should be able to find the user
              return {username: 'rightusername', password: 'rightpasswordhash'};
            }
          }
        }
      },
      bcrypt: {
        compare: (expected, actual, cb) => {
          //passwords should be matched
          cb(null, true);
        }
      },
      jsonwebtoken: {
        sign: () => {
          return 'token';
        }
      }
    });
    request(app)
      .post('/login')
      .send({ username: 'rightusername', password: 'rightpassword'})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('token');
        expect(res.body.token).to.equal('token');
        expect(res.body.success).to.equal(true);
        done(err);
      });
  });
});