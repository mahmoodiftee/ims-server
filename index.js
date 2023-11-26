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