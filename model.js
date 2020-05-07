const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');



// MONGOOSE MODEL \\

mongoose.connect('mongodb+srv://dillanj:hellbent@bbq-qpyke.mongodb.net/test?retryWrites=true&w=majority',
{ useNewUrlParser: true, useUnifiedTopology: true } )


var recipeSchema = new Schema({
    name: { type: String, required: [true, "Your Recipe Must Have a Name"]},
    description: { type: String, required: [true, "Briefly Describe The Recipe"] },
    ingredients:  [{ _id: false, measurement: String, ingredient: String }],
    directions: { type: [String], required: [true, "Break your cook into steps."] },
    times: { prep: String, cook: String },
    category: { type: String, required: [true, "Adding A Category helps all users find recipes"] },
    date: { type: Date, default: Date.now },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "You must be logged in to create a new Recipe."]}
});
var Recipe = mongoose.model( 'Recipe', recipeSchema );


var userSchema = new Schema({
    firstName : {
        type: String,
        require: true
    },
    lastName : {
        type: String,
        require: true
    },
    email : {
        type: String,
        require: true,
        unique: true
    }, 
    encryptedPassword : {
        type: String,
        require: true
    }

});

//this will allow me to call these methods on instances of the user
userSchema.methods.setEncryptedPassword = function(plainPassword, callBackFunction) {
    // 'this' is the user instance
    bcrypt.hash(plainPassword, saltRounds=12).then(hash => {
        // 'this' is still the user instance because of arrow function
        this.encryptedPassword = hash;
        callBackFunction();
    });
};

userSchema.methods.verifyPassword = function(plainPassword, callBackFunction) {
    console.log("plainPassword in verifyPassword: ", plainPassword);
    bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
        callBackFunction(result);
    });
};


var User = mongoose.model('User', userSchema);


// MONGOOSE MODEL \\


// Export module
module.exports = {
    Recipe: Recipe,
    User: User
}