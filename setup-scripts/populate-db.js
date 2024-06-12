const dbclient = require('../helpers/db')
const { getSchemas } = require('../helpers/schemas')
const productServices = require('../products/products.service.js')
const accountServices = require('../accounts/accounts.service.js')
const orderServices = require('../orders/orders.service.js')


let collection 
(async () => { collection = await dbclient.collections() })();
// semi-colon is required here ^ since next line ambiguously starts with (), otherwise error.
// see:  https://stackoverflow.com/questions/42036349/uncaught-typeerror-intermediate-value-is-not-a-function


(async () => {
    let schemas = await getSchemas()  // don't catch error and it should barf, like we want

    await asyncForEach(schemas.custAccount.examples, async obj => {
        await accountServices.newAccount(obj)
        .catch(err => {
            console.log('=== err: ', err)
            process.exit(-1)
        })
        console.log(`${obj.username} was inserted into Account db successfully`)
    })
    .then( async () => {
        await asyncForEach(schemas.product.examples, async obj => {
            await productServices.newProduct(obj)
            .catch(err => {
                console.log('=== err: ', err)
                process.exit(-1)
            })
            console.log(`${obj.name} was inserted into Product db successfully`)
        })
    })
    // .then( async () => {  // *** uncomment section when order/order.service.js is usable
    //     await asyncForEach(schemas.order.examples, async obj => {
    //         await orderServices.newOrder(obj)  // *** is the function called newOrder?
    //         .catch(err => {
    //             console.log('=== err: ', err)
    //             process.exit(-1)
    //         })
    //     console.log(`an order with accountId of ${obj.accountId} was inserted into Order db successfully`)
    // })
    .then( () => {
        console.log("=== done ===")
        process.exit(0)  // without this, the event loop never quits, probably because of open db connection
    })
})()

async function asyncForEach(array, callback) {  // from:  https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}
