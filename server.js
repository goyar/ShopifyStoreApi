// load environment variables for configuration
require('dotenv').config();
global.env_cfg = process.env;

// imports the store logic
const store = require('./controllers/store');

// express initialization
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const HTTP_PORT = env_cfg.HTTP_PORT;
app.use(bodyParser.json());
app.use(cors());

// request loging middleware
const logRequests = function(req, res, next){
    let reqTag = Math.random().toString(36).substring(7);
    console.info(`${Date.now()}: ${reqTag} - ${req.method}: ${req.originalUrl} - From: ${req.hostname}`);
    res.on('finish', ()=>{
        console.info(`${Date.now()}: ${reqTag} - ${res.statusCode}: ${res.statusMessage} - From: ${req.hostname}`);
    })
    next();
}
app.use(logRequests);

// routes
app.get('/products', (req, res)=>{
    store.updateCatalog()
    .then((result)=>{
        // todo: check result for failed updates!
        return store.getCatalog();
    })
    .then((catalog)=>{
        res.json({Items: catalog});
    })
    .catch((err)=>{
        console.info(err);
        res.status(500).end();
    });
});

app.get('/productsTest', (req, res)=>{
    store.getCatalog()
    .then((catalog)=>{
        res.json({Items: catalog});
    })
    .catch((err)=>{
        console.info(err);
        res.status(500).end();
    });
});

app.post('/order', (req, res) =>{
    store.placeOrder(req.body.orderItems)
    .then((order)=>{
        res.status(200).json(order);
    })
    .catch((err)=>{
        console.info(err);
        res.status(500).end();
    })
});

app.listen(HTTP_PORT,()=>{
    console.log(`API server listening at port ${HTTP_PORT}!`);
});