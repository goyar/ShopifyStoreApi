const AWS = require('aws-sdk');

const aws_config = {
    region: env_cfg.REGION,
    endpoint: env_cfg.ENDPOINT
}

AWS.config.update(aws_config);

let AWSdoc = new AWS.DynamoDB.DocumentClient();

module.exports = {
    
    updateLocalCatalog:
        (list)=>{
            return new Promise((resolve, reject)=>{
                if(list === undefined){
                    reject('Catalog is undefined');
                } else if(list.length == 0){
                    resolve('Catalog is empty');
                } else {
                    let params = {
                        RequestItems: {
                            'Products': makePutRequests(list)
                        }
                    }
                    AWSdoc.batchWrite(params, (err, result)=>{
                        if(err){
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                }
            });
        },
    getLocalCatalog:
        ()=>{
            return new Promise((resolve, reject)=>{
                AWSdoc.scan({TableName: 'Products'}, (err, data)=>{
                    if(err){
                        reject(err);
                    } else {
                        resolve(data.Items);
                    }
                });
            });
        },
    cleanLocalCatalog:
        ()=>{
            return new Promise((resolve, reject)=>{
                AWSdoc.scan({TableName: 'Products'},(err, result)=>{
                    if(err) {
                        reject(err);
                    }
                    if(result.Items === undefined){
                        reject('Local catalog is undefined');
                    } else if(result.Items.length == 0){
                        resolve('Local catalog is empty');
                    } else {
                        let params = {
                            RequestItems: {
                                'Products': makeDeleteRequests(result.Items)
                            }
                        }
                        AWSdoc.batchWrite(params, (err, result)=>{
                            if(err) {
                                reject(err);
                            }
                            resolve(result);
                        });
                    }
                });
            });
        },
    validateItems:
        (list) => {
            return new Promise((resolve, reject)=>{
                if(list === undefined){
                    reject('Order list is undefined');
                } else if(list.length == 0){
                    resolve('Order list is empty');
                } else {
                    list.forEach((item)=>{
                        AWSdoc.get(
                            {TableName: 'Products', Key: {'id': item.id}},// params
                            (err, result)=>{
                                if(err){
                                    reject(err);
                                } else if (result) {
                                    if (item.title !== result.title && 
                                        item.variants[0].price !== result.Item.variants[0].price){
                                            reject();
                                        }
                                }
                            }
                        )
                    });
                    resolve(list);
                }
            });
        }
};

/////////////////////
// helper functions

// Strips object from empty attributes
var ridOfEmpty = (obj) => {
    for (let key in obj) {
        if (typeof obj[key] === 'object') {// dive deeper in
            ridOfEmpty(obj[key]);
        } else if(obj[key] === '') {// delete elements that are empty strings
        delete obj[key];
        }
    }
    return obj;
}

// Generates an array of put requests for each element in list 
var makePutRequests = (list)=>{
    let req = [];
    list.forEach(e => {
        let request = {
            PutRequest: {
                Item: ridOfEmpty(e)
            }
        };
        req.push(request);
    });
    return req;
}

// Generates an array of delete requests for each element in list
var makeDeleteRequests = (list) => {
    let req = [];
    list.forEach(e => {
        let request = {
            DeleteRequest: {
                Key: { id: e.id}
            }
        };
        req.push(request);
    });
    return req;
};