require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
const cors = require('cors');

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fc0zsls.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {

        const ShopCollection = client.db('Inventory-Management-System').collection('ShopCollection');
        const UserCollection = client.db('Inventory-Management-System').collection('UserCollection');
        const ProductCollection = client.db('Inventory-Management-System').collection('ProductCollection');


        // Get all data from ProductCollection
        app.get('/products', async (req, res) => {
            const cursor = ProductCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // Get single product from ProductCollection
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ProductCollection.findOne(query);
            res.send(result);
        })

        /// Delete product from ProductCollection
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ProductCollection.deleteOne(query);
            res.send(result);
        });

        // update product
        app.put('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updateProduct = req.body;

                const {
                    productName,
                    productImage,
                    productQuantity,
                    productLocation,
                    productCost,
                    productProfit,
                    productDiscount,
                    productDescription,
                } = updateProduct;

                const updatedProduct = {
                    $set: {
                        productName: productName,
                        productImage: productImage,
                        productQuantity: productQuantity,
                        productLocation: productLocation,
                        productCost: productCost,
                        productProfit: productProfit,
                        productDiscount: productDiscount,
                        productDescription: productDescription,
                    }
                };

                const result = await ProductCollection.updateOne(filter, updatedProduct);

                if (result.matchedCount === 1 && result.modifiedCount === 1) {
                    res.status(200).json({ message: 'Product successfully updated', modifiedCount: result.modifiedCount });
                } else {
                    res.status(404).json({ message: 'Product not found' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });


        // insert product in the ProductCollection
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await ProductCollection.insertOne(product);
            res.send(result);
        })

        // Get all data from UserCollection
        app.get('/users', async (req, res) => {
            const cursor = UserCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // insert user in the ShopCollection
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await UserCollection.insertOne(user);
            res.send(result);
        })

        // Change the User role
        app.patch('/updateUserRole', async (req, res) => {
            try {
                const { email } = req.body;
                const { insertedId } = req.body.shop; // Assuming you pass the shop details in the request body

                const result = await UserCollection.updateOne(
                    { email: email },
                    { $set: { role: 'manager', shop_id: insertedId, ShopName: req.body.shop.ShopName, ShopLogo: req.body.shop.LogoUrl } }
                );

                res.json({ updatedCount: result.modifiedCount });
            } catch (error) {
                console.error('Error updating user role:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // Update productLimit for the user
        app.patch('/updateProductLimit', async (req, res) => {
            try {
                const { email } = req.body;

                const result = await UserCollection.updateOne(
                    { email: email },
                    { $inc: { productLimit: 1 } }
                );

                res.json({ updatedCount: result.modifiedCount });
            } catch (error) {
                console.error('Error updating productLimit:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // Get all data from ShopCollection
        app.get('/shops', async (req, res) => {
            const cursor = ShopCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // insert shop in the ShopCollection
        app.post('/shops', async (req, res) => {
            const shop = req.body;
            const result = await ShopCollection.insertOne(shop);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('IMS server is running');
});

app.listen(port, () => {
    console.log(`IMS server is running on port ${port}`);
});