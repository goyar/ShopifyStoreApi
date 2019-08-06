const shop = require('../services/shopify-service');
const ddb = require('../services/dynamodb-service');

const DISCOUNT = 0.15;

module.exports = {
    updateCatalog:
        ()=>{
            return new Promise((resolve, reject)=>{
                ddb.cleanLocalCatalog()
                .then(()=>{
                    return shop.getProducts()
                })
                .then((productList)=>{
                    return ddb.updateLocalCatalog(productList);
                })
                .then((result)=>{
                    resolve(result);
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },
    getCatalog:
        ()=>{
            return new Promise((resolve, reject)=>{
                ddb.getLocalCatalog()
                .then((catalog)=>{
                    catalog.forEach((item) => {applyDiscount(item)});
                    resolve(catalog);
                })
                .catch((err)=>{
                    reject(err)
                })
            });
        },
    placeOrder:
        (orderItems)=>{
            return new Promise((resolve, reject) => {
                ddb.validateItems(orderItems)
                .then((items)=>{
                    return shop.createOrder(items);
                })
                .then((order)=>{
                    resolve(getDetails(order));
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        }
}
//////////////////////////////////////////////
// helper functions
var applyDiscount = 
(item) =>{
    item.finalPrice = item.variants[0].price * (1 - DISCOUNT);
}

var getDetails = 
(order) => {
    let orderDatails = {
        order_id: order.id,
        detailLines: [],
        totalQProductos: 0,
        subtotal_price: order.subtotal_price,
        total_tax: order.total_tax,
        total_price: order.total_price
    }
    order.line_items.forEach((line)=>{
        let disc = line.applied_discount === null;
        let detail = {
            product_id: line.product_id,
            variant_id: line.variant_id,
            title: line.title,
            quantity: line.quantity,
            price: line.price,
            sub_tot_price: line.price * line.quantity,
            disc_perc: disc ? 0: line.applied_discount.value,
            disc_amount: disc ? 0: line.applied_discount.amount,
            taxes: line.tax_lines[0].price,
            tot_price: (line.price * line.quantity) - (disc ? 0: line.applied_discount.amount)
        }
        orderDatails.totalQProductos += detail.quantity;
        orderDatails.detailLines.push(detail);
    })
    return orderDatails;
}