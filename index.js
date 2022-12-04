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
     const postCollection = client.db('chitchat').collection('post');
     const storyCollection = client.db('chitchat').collection('story');
     //insert every new user
     app.post('/create', async(req,res)=> {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
     })

     //insert user post
     app.post('/post', async(req,res)=>{
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
     })
      //insert user story
      app.post('/story', async(req,res)=>{
        const story = req.body;
        const result = await storyCollection.insertOne(story);
        res.send(result);
       })
     //get user name
     app.get('/user/:email', async(req,res)=>{
      const email = req.params.email;
      const result = await userCollection.findOne(email);
      res.send(result);
     })
     
      //get specific user's post
      app.get('/post/:email', async(req,res)=>{
        const email = req.params.email;
        const query = {user_email: email}
        const cursor = postCollection.find(query).sort( { "milliseconds": -1 } );
        const result = await cursor.toArray();
        res.send(result);
       })

        //get specific user's story
      app.get('/story/:email', async(req,res)=>{
        const email = req.params.email;
        const query = {user_email: email}
        const cursor = storyCollection.find(query).sort( { "milliseconds": -1 } );
        const result = await cursor.toArray();
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