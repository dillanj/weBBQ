## Resource - BBQ Recipes
This single page interface allows users to view bbq recipes, create & edit their own recipes for other users to see. You can view the app here: https://bbq-lovin-db.herokuapp.com/

Each Recipe consists of:
* Name
* Description
* Ingredients : { 'measurement', 'ingredient' }
* Directions
* Times : { 'prep', 'cook'}
* Category
* Date

## Database Schema: 
The data is stored in a MongoDB, using the Mongoose Library. 
The Recipe Model has a schema:
* recipeSchema = {    
                _id: Unique Identifier,    
                name: { type: String, required: true},    
        description: { type: String, required: true },  
        ingredients:  [{ _id: false, measurement: String, ingredient: String }],
        directions: { type: [String], required: true },  
        times: { prep: String, cook: String },  
        category: { type: String, required: [true, "Adding A Category helps all users find recipes"] },  
        date: { type: Date, default: Date.now }  
}

#### REST 
NAME | HTTP METHOD | PATH | DETAILS
-----|-------------|------|--------
Create | POST | /recipes | This Request is sent when a user wants to create a new recipe, the request contains validated data, but is also validated on the server.
List | GET | /recipes |  This Request will return a list of every recipe saved in the application's database. 
Retrieve | GET | /recipes/recipeId | This Request is sent when wanting to retrieve a single recipe, by recipe 
Delete | DELETE | /recipes/recipeId | This Request will delete the recipe by recipeId.
Replace | PUT | /recipes/recipeId | This Request requires a body containing the new data for the recipe at recipeId. The data will be validated on both the client and server.


## Heroku
The web application is deployed using heroku.

