const Shopify = require('shopify-api-node');

const options = {
    shopName: env_cfg.SHOPNAME,
    apiKey: env_cfg.APIKEY,
    password: env_cfg.PASSWORD
};

const shopify = Shopify(options);

module.exports = {
    getProducts: 
        () => {
            return new Promise((resolve, reject) => {
                shopify.product.list().then((list) => {
                    resolve(list);
                }).catch((err)=>{
                    reject(err);
                })
            })
        },
    createOrder:
        (items) => {
            return new Promise((resolve, reject) => {
                if(items === undefined){
                    reject('List of items is undefined');
                } else if(items.length == 0){
                    reject('List of items is empty');
                } else {
                    let newOrder= {
                        line_items: []
                      };
                    items.forEach((item)=>{
                        if(item.q !== undefined){
                            if(item.q > 0){
                                let q = item.q;
                                let discPercentage = 15;
                                let obj = {
                                    product_id: item.id,
                                    variant_id: item.variants[0].id,
                                    price: item.variants[0].price,
                                    title: item.title,
                                    quantity: q,
                                    applied_discount: {
                                        'value_type': 'percentage',
                                        'value': discPercentage,
                                        'amount': Math.floor(item.variants[0].price * q * (discPercentage)) / 100,
                                        'title': 'Custom'
                                    }
                                }
                                newOrder.line_items.push(obj);
                            }
                        }
                    });
                    if (newOrder.line_items.length > 0){
                        shopify.draftOrder.create(newOrder).then((order) => {
                            resolve(order);
                        }).catch((err)=>{
                            reject(err);
                        })
                    } else {
                        reject('No items found in order request!')
                    }
                }

            })
        }
}