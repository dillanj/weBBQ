const BASE_URL =  "https://bbq-lovin-db.herokuapp.com";
// const BASE_URL = "http://localhost:8080";


const express = require('express');
const session = require('express-session');
const bP = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const passportLocal = require('passport-local');

const model = require('./model');
const app = express();
const port = process.env.PORT || 8080;



// MIDDLEWARE \\  
app.use( bP.urlencoded({extended: false}) );
app.use( bP.json() );
// app.use( cors() );
app.use(cors({
    origin: `null, ${BASE_URL}`,
    credentials: true,
}));
// below allows the app to serve up files (front end) in the 'public' directory
// therefore it is only needed if the client is uploaded to same place as server
app.use( express.static('public') ); 
//these three below need to be in this order
app.use( session({ secret: 'kasjdf83jklasndsd', resave: false, saveUninitialized: true}) );
app.use( passport.initialize() );
app.use( passport.session() );

// MIDDLEWARE \\ 


// PASSPORT CONFIGURATION
passport.use( new passportLocal.Strategy({
    //configurations (these come from client)
    usernameField: 'email',
    passwordField: 'plainPassword'
}, function(email, plainPassword, done){
    // AUTHENTICATION ALGORITHM:
    // [async]find the User in the DB, by email
    model.User.findOne({ email: email}).then(function (user) {
        if (!user) {
            return done( null, false, {message: "Email or Password are incorrect."} );
        } 
        else {
        // [async]compare given plainPassword to the hashed pw in DB
            user.verifyPassword( plainPassword, function(result) {
            // if the password matches
                if (result){
                    return done(null, user)
                } else {
                    return done(null, false);
                }
            });
        }
    }).catch(function (err) {
        done(err);
    });
}));

// PASSPORT SERIALIZATION & DESERIALIZATION
passport.serializeUser( function(user, done){
    // called when the user is SUCCESSFULLY authentication. 
    // save the userID into the session
    done(null, user._id);

});

passport.deserializeUser( function(userId, done) {
    // called when the user makes any request following successful authentication
    // read the user's ID from the session, and load the user from the DB
    model.User.findOne({_id: userId}).then(function(user){
        done(null, user);
    }).catch(function(err) {
        done(err);
    });
});



// how to use google login
// passport.use( new googlePassport.Strategy({}))

//PASSPORT CONFIG

// RESTful authenticate route

//creating a session for the user
app.post('/session', passport.authenticate('local'), function(req, res) {
    // authenticaton has succeeded, and the user is now logged in.
    // only runs if the authentication is successful.
    // otherwise a 301 status is implicitly returned
    res.sendStatus(201);
});

app.delete('/session', function(req,res){
    req.logout();
    res.sendStatus(200);
});


// checking if they are logged in
app.get('/session', function(req,res){
    if ( req.user ){
        console.log("get/session req.user", req.user);
        res.status(201).json(req.user);
    } else {
        res.sendStatus(401);
    }
});





// ROUTING \\ 

app.post('/users', function( req, res){
    let user = new model.User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
    });
    user.setEncryptedPassword(req.body.plainPassword, function () {
        // by placing this code as part of a function, it will be called
        // once the promise has been completed (async finished)
        user.save().then( function() {
            res.status(201).json(user);
            console.log("usersaved");
        }).catch( function (err) {
            if (err.errors){
                var messages = {};
                for ( let e in err.errors){
                    messages[e] = err.errors[e].message;
                }
                console.log("errors, gonna send a 422");
                res.status(422).json(messages);
            } else {
                res.sendStatus(500);
            }
        });
    });
    
});





app.post('/recipes', function( req, res){
    // console.log("CREATE RECIPE USER IS: ", req.user);
    console.log("CREATE RECIPE BODY IS: ", req.body);
    if ( !req.user ){
        res.sendStatus(401);
        return;
    }
    //create an instance of the Recipe Model
    let recipe = new model.Recipe({
        name: req.body.name,
        description: req.body.description,
        ingredients: req.body.ingredients,
        directions: req.body.directions,
        times: req.body.times,
        category: req.body.category,
        user_id: req.user._id
    });
    console.log("RECIPE Model: ", recipe);
    // start async saving of the recipe
    recipe.save().then( function() {
        res.status(201).json(recipe);
        console.log("recipe saved");
    }).catch( function (err) {
        if (err.errors){
            var messages = {};
            for ( let e in err.errors){
                messages[e] = err.errors[e].message;
            }
            res.status(422).json(messages);
        } else {
            res.sendStatus(500);
        }
    });
});


app.get('/recipes', function( req, res){
    // console.log("user", req.user);
    let dbQuery = {};
    if (req.query.category) {
        dbQuery.category = req.query.category;
    }

    model.Recipe.find(dbQuery).then( function (recipes) {
        res.json(recipes);
    }).catch( function (err) {
        console.log("Failed to get recipes. Error is: ", err);
        res.sendStatus(400);
    });
});

app.get('/recipes/:recipeId', function(req, res){
    let recipeId = req.params.recipeId;
    model.Recipe.findOne({_id: recipeId}).then(function (recipe){
        // data is loaded
        if (recipe){
            res.json(recipe);
        } else {
            res.sendStatus(404);
        }
    }).catch(function (){
        console.log("error retrieving recipe from server").
        res.sendStatus(400);
    });
});

app.delete('/recipes/:recipeId', function(req, res) {
    if (!req.user){
        res.sendStatus(403);
    }
    let recipeId = req.params.recipeId;
    model.Recipe.findOneAndDelete({_id: recipeId}).then( function (recipe){
        if (recipe){
            res.json(recipe);
        } else {
            res.sendStatus(404);
        }
    }).catch(function() {
        res.sendStatus(400);
    })
});

app.put('/recipes/:recipeId', function(req, res){
    if (!req.user){
        res.sendStatus(403);
    }
    let recipeId = req.params.recipeId;
    var i = req.body.ingredients;
    // this method will find the recipe if it exists. 
    // if it does, it returns the object, then we wll modify
    // and save it. By using save() we enable validation checking
    model.Recipe.findOne({_id: recipeId}).then(function (recipe) {
        if (recipe) {
            recipe.name = req.body.name;
            recipe.description = req.body.description;
            recipe.ingredients = req.body.ingredients,
            recipe.directions = req.body.directions,
            recipe.times = req.body.times,
            recipe.category = req.body.category,
            recipe.save().then(function () {
                res.json(recipe);
            });
        } else { 
            res.sendStatus(404);
        }
    }).catch(function() {
        console.log("error updating");
        res.sendStatus(400);
    });
});


app.listen(port, function() {
    console.log(`Example app listening on port ${port}!`);
})


