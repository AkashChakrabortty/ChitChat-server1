const express = require('express');
const cors = require('cors');
require('dotenv').config();
const {MongoClient, ServerApiVersion} =  require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middle wares
app.use(cors());
app.use(express.json());

// mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kusbv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
     const userCollection = client.db('chitchat').collection('user');

     //insert every new user
     app.post('/create', async(req,res)=> {
        const user = req.body;
        console.log(user)
        const result = await userCollection.insertOne(user);
        res.send(result);
     })
     
  }
  catch{
    (err => console.log(err) )
  }
}

run().catch(err => console.log(err))


app.listen(port, ()=> {
    console.log('server running')
})