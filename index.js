// Set up Express
const express = require('express')
const app = express()
// Tell Express that we support JSON parsing
app.use(express.json('*/*'))
// More Express setup is below the main runloop

// Set up MongoDB and associated variables
const db = require("mongodb")
const dbLink = "mongodb://localhost:27017"
const MongoClient = db.MongoClient

const mongoClient = new MongoClient(dbLink, { useNewUrlParser: true } )
const mongoDBName = 'PizzaTime'
var mongoDB
var collection = {}

// Use Assert for error checking
const assert = require('assert')

// Connect to the database; once connected, we'll start our HTTP (express) listener
mongoClient.connect(function(err) {
    assert.equal(null, err)
    console.log("Connected to Mongo")
    // Get a handle to our database
    mongoDB = mongoClient.db(mongoDBName)

    // Convenience tool: get a handle to all of the collections
    const collList = ['Accounts','Orders','Products','Pages']
    collList.some(element => {
        // Store the handles in the "collections" object, making it easier to access them
        collection[element] = mongoDB.collection(element)
    })

    // Start Express
    app.listen("8080", () => {
        console.log("Server started on 8080")
    })

})

///////////////////////////////////////////////////////////////
// Items below this comment are Express API calls (event registrations)
// and the functions used by those API calls
///////////////////////////////////////////////////////////////

// Helper functions used by the API event handlers below
function respondOK(res,obj) {
    obj = { ...obj, "resultCode" : 200, "result": "OK" }
    res.send(JSON.stringify(obj))
}

function retrieveOne(collection,key,value,cb) {
    collection.findOne({[key]: value}).then(cb)
}

// ToDo: refactor all the insertOne functions here

////////////////// API and DB calls ///////////////////////////

/////-----      customer
app.post('/account/newuser', (req, res) => {
    let accountData = req.body
    // Todo: sanitize the data and do security checks here.
    if (!accountData.firstName) { console.log("Missing first name")}
    registerNewUser(accountData,(returnedData) => respondOK(res,returnedData))
    // Normally, if there was an error, we wouldn't respondOK...
    // IOW, put some error-checking/handling code here
})

function registerNewUser(accountData,cb) {
    collection.Accounts.insertOne(accountData).then( 
        (myResult) => 
            cb({ ops: myResult.ops, 
                 insertedCount: myResult.insertedCount, 
                 insertedId: myResult.insertedId})
    )
}

app.get('/account/detail/:accountNum', (req, res) => {
    let num = parseInt(req.params.accountNum)
    retrieveOne(collection.Accounts,"accountNum", num, (obj) => respondOK(res,obj))
})

// Preliminary search function

app.get('/account/search/:searchParam', (req, res) => {
    let searchParam = req.params.searchParam
    //console.log("Search param: '" + searchParam + "'")
    searchUser(searchParam,  (obj) => respondOK(res,obj)  )
})

function searchUser(searchParam,cb) {
    let pattern = searchParam
    collection.Accounts.find({
        $or: [
            { firstName: { $regex: pattern, $options: 'i'}},
            { lastName: { $regex: pattern, $options: 'i'}},   
            ]
    }, (err, cursor) => cursor.toArray((err, items) => cb(items)) )
}

/////-----      products
app.post('/product/newitem', (req, res) => {
    let productData = req.body
    // Todo: sanitize the data and do security checks here.
    registerNewItem(productData,(respObj) => respondOK(res,respObj))
})

function registerNewItem(productData,cb) {
    collection.Products.insertOne(productData).then( 
        (myResult) => 
            cb({ ops: myResult.ops, 
                 insertedCount: myResult.insertedCount, 
                 insertedId: myResult.insertedId})
    )
}

app.get('/product/detail/:productNum', (req, res) => {
    let num = parseInt(req.params.productNum)
    retrieveOne(collection.Products, "productNum",num,(obj) => respondOK(res,obj))
})

/////-----      orders
app.post('/order/newitem', (req, res) => {
    let orderData = req.body
    // Todo: sanitize the data and do security checks here.
    registerNewOrder(orderData,(obj) => respondOK(res,obj))
})

function registerNewOrder(orderData,cb) {
    collection.Orders.insertOne(orderData).then( 
        (myResult) => 
            cb({ ops: myResult.ops, 
                 insertedCount: myResult.insertedCount, 
                 insertedId: myResult.insertedId})
    )
}

app.get('/order/detail/:orderNum', (req, res) => {
    let num = parseInt(req.params.orderNum)
    retrieveOne(collection.Orders,"orderNum", num,(obj) => respondOK(res,obj))
})