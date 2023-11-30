require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const CartCollection = client.db('Inventory-Management-System').collection('CartCollection');
        const SaleCollection = client.db('Inventory-Management-System').collection('SaleCollection');
        const PdfCollection = client.db('Inventory-Management-System').collection('PdfCollection');
        const payCollection = client.db('Inventory-Management-System').collection('payCollection');
        const PaymentCollection = client.db('Inventory-Management-System').collection('PaymentCollection');

        //payment
        app.get('/payment', async (req, res) => {
            const cursor = PaymentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/payment', async (req, res) => {
            const product = req.body;
            const result = await PaymentCollection.insertOne(product);
            res.send(result);
        })


        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            // const price = 10;
            const amount = parseInt(price * 100);
            console.log('Stripe Amount:', amount);
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.get('/cards/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await payCollection.findOne(query);
            res.send(result);
        })

        app.get('/cards', async (req, res) => {
            const cursor = payCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/pdf', async (req, res) => {
            const product = req.body;
            const result = await PdfCollection.insertOne(product);
            res.send(result);
        })


        // Get all data from CartCollection
        app.get('/pdf', async (req, res) => {
            const cursor = PdfCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // insert product in the SaleCollection
        app.post('/sale', async (req, res) => {
            try {
                const product = req.body;
                console.log('Received Data:', product);
                const result = await SaleCollection.insertOne(product);
                res.send(result);
            } catch (error) {
                console.error('Error inserting into CartCollection:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // Get all data from SaleCollection
        app.get('/sale', async (req, res) => {
            const cursor = SaleCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Get data from ProductCollection
        app.get('/cart', async (req, res) => {
            try {
                const userEmail = req.query.email;

                if (userEmail) {
                    const cursor = CartCollection.find({ userEmail: userEmail });
                    const result = await cursor.toArray();
                    res.send(result);
                } else {
                    const cursor = CartCollection.find();
                    const result = await cursor.toArray();
                    res.send(result);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // Get data from ProductCollection
        app.get('/products', async (req, res) => {
            try {
                const userEmail = req.query.email;

                if (userEmail) {
                    const cursor = ProductCollection.find({ userEmail: userEmail });
                    const result = await cursor.toArray();
                    res.send(result);
                } else {
                    const cursor = ProductCollection.find();
                    const result = await cursor.toArray();
                    res.send(result);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Get single product from ProductCollection
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ProductCollection.findOne(query);
            res.send(result);
        })
        // update productQuantity && saleCount
        app.patch('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updateProduct = req.body;
                const { operationType } = updateProduct;

                if (operationType === 'increaseSaleCount') {
                    // Increase sales count
                    const result = await ProductCollection.updateOne(filter, { $inc: { saleCount: 1 } });

                    if (result.matchedCount === 1 && result.modifiedCount === 1) {
                        res.status(200).json({ message: 'Sales count increased successfully', modifiedCount: result.modifiedCount });
                    } else {
                        res.status(404).json({ message: 'Product not found' });
                    }
                } else if (operationType === 'decreaseQuantity') {
                    // Decrease product quantity
                    const result = await ProductCollection.updateOne(filter, { $inc: { productQuantity: - 1 } });

                    if (result.matchedCount === 1 && result.modifiedCount === 1) {
                        res.status(200).json({ message: 'Product quantity decreased successfully', modifiedCount: result.modifiedCount });
                    } else {
                        res.status(404).json({ message: 'Product not found' });
                    }
                } else {
                    // Handle other update operations if needed
                    const result = await ProductCollection.updateOne(filter, updateProduct);

                    if (result.matchedCount === 1 && result.modifiedCount === 1) {
                        res.status(200).json({ message: 'Product updated successfully', modifiedCount: result.modifiedCount });
                    } else {
                        res.status(404).json({ message: 'Product not found' });
                    }
                }
            } catch (error) {
                console.error('Error updating product:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // Delete products in the pdf based on user's email
        app.delete('/pdf/clear', async (req, res) => {
            try {
                const userEmail = req.query.email;
                if (userEmail) {
                    const result = await PdfCollection.deleteMany({ userEmail: userEmail });
                    res.status(200).json({ message: 'pdf cleared successfully', deletedCount: result.deletedCount });
                } else {
                    res.status(400).json({ message: 'Email parameter is missing' });
                }
            } catch (error) {
                console.error('Error clearing pdf:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Delete products in the cart based on user's email
        app.delete('/cart/clear', async (req, res) => {
            try {
                const userEmail = req.query.email;
                if (userEmail) {
                    const result = await CartCollection.deleteMany({ userEmail: userEmail });
                    res.status(200).json({ message: 'Cart cleared successfully', deletedCount: result.deletedCount });
                } else {
                    res.status(400).json({ message: 'Email parameter is missing' });
                }
            } catch (error) {
                console.error('Error clearing cart:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });



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

        // Get data from CartCollection
        app.get('/cart', async (req, res) => {
            try {
                const userEmail = req.query.email;

                if (userEmail) {
                    const cursor = CartCollection.find({ userEmail: userEmail });
                    const result = await cursor.toArray();
                    res.status(200).json(result);
                } else {
                    const cursor = CartCollection.find();
                    const result = await cursor.toArray();
                    res.status(200).json(result);
                }
            } catch (error) {
                console.error('Error fetching data from cart:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });


        // insert product in the CartCollection
        app.post('/cart', async (req, res) => {
            const product = req.body;
            const result = await CartCollection.insertOne(product);
            res.send(result);
        })

        // Get all data from CartCollection
        app.get('/cart', async (req, res) => {
            const cursor = CartCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


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

        // update limit


        // Change the User role
        app.patch('/updateUserRole', async (req, res) => {
            try {
                const { email } = req.body;
                const { insertedId } = req.body.shop;

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
            try {
                const userEmail = req.query.email;

                if (userEmail) {
                    const cursor = ShopCollection.find({ OwnerEmail: userEmail });
                    const result = await cursor.toArray();
                    res.send(result);
                } else {
                    const cursor = ShopCollection.find();
                    const result = await cursor.toArray();
                    res.send(result);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

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