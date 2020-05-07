var BASE_URL =  "https://bbq-lovin-db.herokuapp.com";
// const BASE_URL = "http://localhost:8080";


// ModalEnum is used to keep track of the modals that are displayed
var ModalEnum = {
    SIGN_IN: 0,
    REGISTER: 1,
    OFF: 2
  };


// ComponentType are the different types of components that are displayed 
// throughout the application. This data type is used to effieciently 
// turn on/off the component
var ComponentType = {
    NEW_RECIPE: 0,
    EDIT_RECIPE: 1,
    ALL_RECIPES: 2,
    SINGLE_RECIPE: 3,
    SIGN_IN: 4,
    REGISTER: 5, 
    ERRORS: 6
};




// * Server Requests * \\

var createRecipeOnServer = function( recipe ){
    var data = JSON.stringify(recipe);
    return fetch( `${BASE_URL}/recipes`, {
        body: data, 
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
};

var getRecipesFromServer = function(cat) {
    if (!cat){
        return fetch(`${BASE_URL}/recipes`);
    }
    var category = encodeURIComponent(cat);
    return fetch(`${BASE_URL}/recipes?category=${category}`);
    
};

var getRecipeFromServer = function(recipeId) {
    return fetch(`${BASE_URL}/recipes/${recipeId}`);
}

var deleteRecipeFromServer = function(recipeId){
    return fetch(`${BASE_URL}/recipes/${recipeId}`, {
        method: "DELETE"
    });
}

var editRecipeOnServer = function( recipe ) {
    var data = JSON.stringify(recipe);
    // console.log("data right before being sent to server:", data);
    return fetch(`${BASE_URL}/recipes/${recipe.id}`, {
        body: data,
        method: "PUT",
        headers: {
            "Content-Type" : "application/json"
        }
    });
};

var authorizeUserOnServer = function ( data ) {
    // console.log(data);
    return fetch(`${BASE_URL}/session`, {
        body: data,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
};

var createUserOnServer = function ( user ) {
    // console.log("got to createUser funciton, user is: ",user);
    return fetch( `${BASE_URL}/users`, {
        body: user, 
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
};

var checkSessionOnServer = function(){
    return fetch( `${BASE_URL}/session`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
};

var deleteSessionOnServer = function() {
    return fetch(`${BASE_URL}/session`, {
        method: "DELETE"
    });
};






// VUE \\



var app = new Vue({
    el: "#VUEapp",
    data: {
        showNewRecipeForm: false, 
        showEditRecipeForm: false, 
        showAllRecipes: true,
        showRecipe: false, 
        showSignInForm: false,
        showRegisterForm: false,
        showModal: false,
        showErrors: false,
        allRecipesData: {
            recipes: [],
            categoryFilter: ""
        },
        newRecipeData: { 
            nameInput: "",
            prepTimeInput: "",
            cookTimeInput: "",
            descriptionInput: "",
            directionInput: "",
            measurementInput: "",
            ingredientInput: "",
            categoryInput: '',
            directions: [],
            ingredients: []
        },
        recipeData: {
            recipe: {},
            isOwner: false
        },
        newUserData: {
            firstNameInput: "",
            lastNameInput: "",
            emailInput: "",
            plainPasswordInput: ""
        },
        authorizeUserData: {
            emailInput: "",
            plainPasswordInput: ""
        },
        currentUserData: {
            firstName: "",
            lastName: "",
            email: "",
            id: "",
            loggedIn: false
        },
        validationErrors: [] 
    },
    methods: {
        createRecipe: function() {
            this.showComponent(ComponentType.NEW_RECIPE);
        },
        createRecipeButtonClicked: function() {
            if ( this.validateRecipeInputs() == false ){
                this.showErrors = true;
            } else {
                this.showErrors = false;
                if (this.currentUserData.loggedIn ){
                    var data = {
                        name: this.newRecipeData.nameInput,
                        description: this.newRecipeData.descriptionInput,
                        ingredients: this.newRecipeData.ingredients,
                        directions: this.newRecipeData.directions,
                        times: { prep: this.newRecipeData.prepTimeInput, cook: this.newRecipeData.cookTimeInput },
                        category: this.newRecipeData.categoryInput,
                    }
                    createRecipeOnServer( data ).then((response)=> {
                            if ( response.status == 201 ){
                                response.json().then((recipe) => {
                                    this.clearRecipeInputs();
                                    this.getRecipe(recipe);
                                });
                                console.log("Success creating recipe");
                            } else if ( response.status == 401){
                                this.validationErrors.push("You must be logged in to create a recipe");
                                this.configModal(ModalEnum.SIGN_IN);
                                this.showErrors = true;
                                console.log("user must be logged in to create a recipe");
                            } else {
                                console.log("error creating recipe");
                                response.json().then((errors) => {
                                    // console.log("Your errors are: ", errors);
                                    this.validationErrors = errors;
                                    // console.log("validation errors are: ", this.validationErrors);
                                });
                            }
                    });
                } else { 
                    this.validationErrors.push("You must be logged in to create a recipe");
                    this.configModal(ModalEnum.SIGN_IN);
                    this.showErrors = true;
                    // console.log("user must be logged in to create a recipe");
                }
            }
        }, // function
        addDirectionButtonClicked: function() {
            // this.newRecipeData.directions.push("HI");
            this.newRecipeData.directions.push( this.newRecipeData.directionInput );
            this.newRecipeData.directionInput = "";
        }, // function
        addIngredientButtonClicked: function() {
            this.newRecipeData.ingredients.push( { measurement: this.newRecipeData.measurementInput, ingredient: this.newRecipeData.ingredientInput} );
            this.newRecipeData.ingredientInput = "";
            this.newRecipeData.measurementInput = "";
        }, // function
        getRecipe: function(recipe) {
            id = recipe._id;
            if (id == undefined){
                id = recipe.id;
            }
            getRecipeFromServer(id).then((response) => {
                response.json().then((recipe) => {
                    // console.log("in getRecipe, after server call recipe is", recipe);
                    
                    this.recipeData.recipe = recipe;
                    if ( this.currentUserData.id == recipe.user_id ){
                        this.recipeData.isOwner = true;
                    } else {
                        this.recipeData.isOwner = false;
                    }
                    this.showComponent(ComponentType.SINGLE_RECIPE);
                });
            });
        },//function
        getRecipes: function( cat ) {
            if (cat == undefined) {
                getRecipesFromServer().then((response) => {
                    response.json().then((Recipes) => {
                        this.allRecipesData.recipes = Recipes; 
                    });
                });
            } else {
                getRecipesFromServer( cat ).then((response) => {
                    response.json().then((Recipes) => {
                        this.allRecipesData.recipes = Recipes; 
                    });
                });
            }
            console.log("")
            this.showComponent(ComponentType.ALL_RECIPES);
        },// function
        deleteRecipe: function(recipe) {
            id = recipe._id
            deleteRecipeFromServer(id).then((response) => {
                if ( response.status == 200 ) {
                    // TODO: LET USER KNOW IT WAS DELETED
                    console.log("recipe deleted successfully");
                    this.getRecipes();
                } else {
                    //TODO: LET THE USER KNOW THAT IT WAS NOT DELETED
                    console.log("error deleting recipe. Status: ", response.status);
                }
            });
        },//function
        editRecipe: function(recipe) {
            this.showComponent(ComponentType.EDIT_RECIPE);
            // setting the defaults to what the recipe currently is
            this.newRecipeData.nameInput = recipe.name;
            this.newRecipeData.descriptionInput = recipe.description;
            this.newRecipeData.localIngredients = recipe.ingredients;
            this.newRecipeData.localDirections = recipe.directions;
            this.newRecipeData.prepTimeInput = recipe.times.prep;
            this.newRecipeData.cookTimeInput = recipe.times.cook;
            this.newRecipeData.categoryInput = recipe.category;
        },//function
        editCompleteButtonClicked: function(id) {
            if ( this.validateRecipeInputs() == false ){
                this.showComponent(ComponentType.ERRORS);
            } else {
                // this.showErrors = false;
                var data = {
                    id: id,
                    name: this.newRecipeData.nameInput,
                    description: this.newRecipeData.descriptionInput,
                    ingredients: this.newRecipeData.localIngredients,
                    directions: this.newRecipeData.localDirections,
                    times: { prep: this.newRecipeData.prepTimeInput, cook: this.newRecipeData.cookTimeInput },
                    category: this.newRecipeData.categoryInput
                }
            editRecipeOnServer(data).then((response)=> {
                if (response.status == 200){
                    this.getRecipe(data);
                    this.clearRecipeInputs();
                    console.log("edited recipe successfully");
                } else {
                    console.log("error editing the recipe");
                }
            });
        }
        }, //function
        searchByCategory: function(category){
            console.log("the cateogry param is:", category);
            this.getRecipes(category);

        }, // function
        clearRecipeInputs: function() {
            this.newRecipeData.nameInput = "";
            this.newRecipeData.descriptionInput = "";
            this.newRecipeData.localIngredients = "";
            this.newRecipeData.localDirections = "";
            this.newRecipeData.prepTimeInput = "";
            this.newRecipeData.cookTimeInput = "";
            this.newRecipeData.categoryInput = "";
        }, // function
        validateRecipeInputs: function() {
            this.validationErrors = [];
            if (this.validateName() == false ){  console.log("validate name is false");this.validationErrors.push("Recipe Needs a Name.");}
            if (this.validateCategory() == false ){ this.validationErrors.push("Recipe Needs a Category.");}
            if (this.validateDescription() == false ){ this.validationErrors.push("Recipe Needs Description.");}
            if (this.validationErrors.length > 0){ return false;} 
            return true;
        },
        validateName: function() {
            if ( !this.newRecipeData.nameInput ){
                return false;
            }
            return true;
        },
        validateCategory: function() {
            if ( !this.newRecipeData.categoryInput ){
                return false;
            }
            return true;
        },
        validateDescription: function() {
            if (!this.newRecipeData.descriptionInput){
                console.log("description is empty");
                return false;
            }
            return true;
        },
        deleteIngredient: function(index) {
            this.newRecipeData.ingredients.splice(index, 1);
        },
        deleteDirection: function(index) {
            this.newRecipeData.directions.splice(index,1);
        },
        navRecipesClicked: function() {
            this.getRecipes();
        },
        navSignInClicked: function() {
            this.configModal(ModalEnum.SIGN_IN);
        },
        navRegisterClicked: function() {
            this.configModal(ModalEnum.REGISTER);
        },
        navSignOutClicked: function() {
            console.log("user wants to sign out");
            deleteSessionOnServer().then((response)=> {
                if (response.status == 200 ){
                    this.clearUserData();
                    this.getRecipes();
                    this.isUserLoggedIn();
                    alert("You have been signed out.");
                } else {
                    console.log("Unforseen error signing you out. Try again.")
                }
            });
        },
        configModal: function(type) {
            this.showModal = true;
            this.showErrors = false;
            this.clearCredentialInputs();
            if ( type == ModalEnum.SIGN_IN ){
                this.showComponent(ComponentType.SIGN_IN);
            } else if ( type == ModalEnum.REGISTER ){
                this.showComponent(ComponentType.REGISTER);
            } else if ( type == ModalEnum.OFF ){
                this.showSignInForm = false;
                this.showRegisterForm = false;
                this.showModal = false;
            } else {
                this.showModal = false;
            }
        },
        exitModalClicked: function() {
            this.configModal(ModalEnum.OFF);
        },
        authenticateUser: function() {
            this.showErrors = false;
            if ( this.validateCredentialInputs() ){
                var data = "email=" + encodeURIComponent(this.authorizeUserData.emailInput); 
                data += "&plainPassword=" + encodeURIComponent(this.authorizeUserData.plainPasswordInput);
                authorizeUserOnServer( data ).then((response)=> {
                        if ( response.status == 201 ){
                            this.clearCredentialInputs();
                            this.configModal(ModalEnum.OFF);
                            this.isUserLoggedIn();
                            console.log("user authenticated");
                        } else {
                            console.log("error authorizing user");
                            this.validationErrors = [];
                            this.validationErrors.push("There was an error logging in. Check your email and password.");
                            this.showComponent(ComponentType.ERRORS);
                        }
                }).catch(function(errors){
                    console.log("error authenticating user.", errors);
                }); 
            } else {
                this.showComponent(ComponentType.ERRORS);
            }

        },
        createUser: function() {
            this.showErrors = false;
            if ( this.validateCredentialInputs() ){
                var data = "firstName=" + encodeURIComponent(this.newUserData.firstNameInput); 
                data += "&lastName=" + encodeURIComponent(this.newUserData.lastNameInput);
                data += "&email=" + encodeURIComponent(this.newUserData.emailInput); 
                data += "&plainPassword=" + encodeURIComponent(this.newUserData.plainPasswordInput);
                console.log("data in createUser before sending to server: ", data);
                createUserOnServer( data ).then((response)=> {
                    if ( response.status == 201 ){
                        response.json().then((user) => {
                            console.log("user: ", user);
                            this.clearCredentialInputs();
                            // this.isUserLoggedIn();
                            this.configModal(ModalEnum.SIGN_IN);
                            // this.getRecipes();
                        });
                        console.log("user created");
                    } else if ( response.status == 422 ) {
                        console.log("error creating user");
                        response.json().then((errors) => {
                            console.log("Your errors are: ", errors);
                            // TODO: print erros to user
                        });
                    } else {
                        // status is likely 500
                        this.validationErrors = [];
                        this.validationErrors.push("There was an error creating the user. Have you already registered an account?");
                        this.showErrors = true;
                        console.log("error creating user");
                    }
                }); 
            } else {
                this.showComponent(ComponentType.ERRORS);
            }

        },
        isUserLoggedIn: function() {
            checkSessionOnServer().then((response) => {
                if ( response.status == 201 ){
                    response.json().then((user) => {
                        // console.log("user is logged in");
                        // console.log("user: ", user);
                        this.currentUserData.loggedIn = true;
                        this.currentUserData.firstName = user.firstName;
                        this.currentUserData.lastName = user.lastName;
                        this.currentUserData.email = user.email;
                        this.currentUserData.id = user._id;
                    });
                } else {
                    this.currentUserData.loggedIn = false;
                }

            }).catch(function(error){
                console.log("error validating user is logged in");
            });
        },
        clearUserData: function() {
            this.currentUserData.firstName = "";
            this.currentUserData.lastName = "";
            this.currentUserData.email = "";
            this.currentUserData.id = "";
            this.currentUserData.loggedIn = false;
            this.isUserLoggedIn();
        },
        clearCredentialInputs: function() {
            if ( this.showSignInForm ) {
                this.authorizeUserData.emailInput = "";
                this.authorizeUserData.plainPasswordInput = "";
            } else if ( this.showRegisterForm ){
                this.newUserData.firstNameInput = "";
                this.newUserData.lastNameInput = "";
                this.newUserData.emailInput = "";
                this.newUserData.plainPasswordInput = "";
            }
        },
        validateCredentialInputs: function() {
            this.showErrors = false;
            if ( this.showRegisterForm ){
                return this.validateRegistrationForm()
            } else if ( this.showSignInForm ){
                return this.validateSignInForm()
            }
        },
        validateRegistrationForm: function() {
            this.validationErrors = [];
            if ( !this.newUserData.firstNameInput ){
                this.validationErrors.push("First Name is Required.");
            }
            if ( !this.newUserData.lastNameInput ){
                this.validationErrors.push("Last Name is Required.");
            }
            if ( !this.newUserData.emailInput ){
                this.validationErrors.push("An Email is Required.");
            }
            if ( !this.newUserData.plainPasswordInput ){
                this.validationErrors.push("A password is Required.");
            }
            if ( this.validationErrors.length > 0 ) {
                return false;
            } else {
                return true;
            }
        },
        validateSignInForm: function() {
            this.validationErrors = [];
            if ( !this.authorizeUserData.emailInput ){
                this.validationErrors.push("You must fill out an email. Use the email you registered with.");
            }
            if ( !this.authorizeUserData.plainPasswordInput ){
                this.validationErrors.push("You must fill out a password. This is not a guessing game.");
            }
            if ( this.validationErrors.length > 0 ) {
                return false;
            } else{
                return true;
            }

        }, 
        showComponent: function( type ){
            this.clearCredentialInputs();
            this.clearRecipeInputs();
            switch (type){
                case ComponentType.NEW_RECIPE:
                    this.showNewRecipeForm = true;
                    this.showEditRecipeForm = false;
                    this.showAllRecipes = false;
                    this.showRecipe = false;
                    this.showErrors = false;
                    this.showSignInForm = false;
                    this.showRegisterForm = false;
                    this.showModal = false;
                    this.showErrors = false;
                    break;
                
                case ComponentType.EDIT_RECIPE:
                    this.showNewRecipeForm = false;
                    this.showEditRecipeForm = true;
                    this.showAllRecipes = false;
                    this.showRecipe = false;
                    this.showSignInForm = false;
                    this.showRegisterForm = false;
                    this.showModal = false;
                    this.showErrors = false;
                    break;
                
                case ComponentType.ALL_RECIPES:
                    this.showNewRecipeForm = false;
                    this.showEditRecipeForm = false;
                    this.showAllRecipes = true;
                    this.showRecipe = false;
                    this.showSignInForm = false;
                    this.showRegisterForm = false; 
                    this.showModal = false;
                    this.showErrors = false;
                    break;
                
                case ComponentType.SINGLE_RECIPE:
                    this.showNewRecipeForm = false;
                    this.showEditRecipeForm = false;
                    this.showAllRecipes = false;
                    this.showRecipe = true;      
                    this.showSignInForm = false;
                    this.showRegisterForm = false;
                    this.showModal = false;
                    this.showErrors = false;
                    break;

                case ComponentType.SIGN_IN:
                    this.showRegisterForm = false;
                    this.showSignInForm = true;
                    break;
                
                case ComponentType.REGISTER:
                    this.showRegisterForm = true;
                    this.showSignInForm = false;
                    break;

                case ComponentType.ERRORS: 
                    this.showErrors = true;
                    break;
                default:
                    this.showComponent(ALL_RECIPES);
            } // end of switch

        }// function
    }, 
    created: function() {
        this.getRecipes();
        this.isUserLoggedIn();
        console.log("Vue App Loaded");
    }
});