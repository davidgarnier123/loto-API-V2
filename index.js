require('dotenv').config();
const cron = require('node-cron');
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const scraper = require('./scraper.js');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uhczq5i.mongodb.net/loto?retryWrites=true&w=majority`;
let db;
let myDatabase;
let results = [];

async function connect() {
    try {
        db = await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        myDatabase = db.connection.db;

        const resultsCollection = myDatabase.collection('results');
        results = await resultsCollection.find({}).toArray();
    } catch (error) {
        console.error(error);
    }
}

connect().then( () => {
    app.listen(8000, () => {
        console.log("Server started on port 8000");
    
    });
    
})

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});


app.get('/results', async (req, res) => {
    try {

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

async function addResultsToDatabase(results) {
    const resultsCollection = myDatabase.collection('results');
    const result = await resultsCollection.insertMany(results);
    console.log(`Added ${result.insertedCount} results to database`);
}

function deleteAllResults() {
    const resultsCollection = mongoose.connection.db.collection('results');
    resultsCollection.deleteMany({})
        .then((result) => {
            console.log(`Deleted ${result.deletedCount} documents results`);
        })
        .catch((error) => {
            console.error(error);
        });
}

function scrapeAll() {
    try {
        scraper.scrapeAllData().then((result) => {
            console.log(result.data.length + ' resultats');
            addResultsToDatabase(result.data)
        })
    } catch (error) {
        console.error(error);
    }
}


function scrapeLastResult() {
    let scrapedLast;
    scraper.scrapeLast().then((result) => {
        scrapedLast = result.data;
        getLastResultFromDb().then((result) => {
            stockedResult = result;
            if (scrapedLast.date === stockedResult.date) {
                console.log('Same')
            } else {
                const resultsCollection = myDatabase.collection('results');
                resultsCollection.insertOne(scrapedLast);
                results = [];
                results = resultsCollection.find({}).toArray();
                console.log(`Added 1 result to database`);
            }
        })
    })
}

async function getLastResultFromDb() {
    const resultsCollection = myDatabase.collection('results');

    const program = await resultsCollection.findOne({}, { sort: { date: -1 }, limit: 1 });
    return program;
}

cron.schedule('0 4 * * *', () => {
    console.log('CRON TRIGGERED')
    scrapeLastResult();
});