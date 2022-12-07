const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { disconnect } = require("process");
const app = express();
const port = process.env.PORT || 5000;
const expressServer = http.createServer(app);
//middle wares
app.use(cors());
app.use(express.json());

const io = new Server(expressServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  },
});

// mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kusbv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const userCollection = client.db("chitchat").collection("user");
    const postCollection = client.db("chitchat").collection("post");
    const storyCollection = client.db("chitchat").collection("story");
    const requestCollection = client.db("chitchat").collection("request");
    const friendCollection = client.db("chitchat").collection("friend");

    //insert every new user
    app.post("/create", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //insert user post
    app.post("/post", async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
    });
    //insert user story
    app.post("/story", async (req, res) => {
      const story = req.body;
      const result = await storyCollection.insertOne(story);
      res.send(result);
    });

    //insert every accepted friend request
    app.post("/reqAccepted/:id", async (req, res) => {
      const reqAcceptedInfo = req.body;
      const id = req.params.id;
      const result = await friendCollection.insertOne(reqAcceptedInfo);
      const query = { _id: ObjectId(id) };
      const deleteFromReqCol = await requestCollection.deleteOne(query);
      res.send(result);
    });

    //insert user's friend req info
    app.post("/addFriend", async (req, res) => {
      const reqInfo = req.body;
      const query = {
        receiver_email: reqInfo.receiver_email,
        sender_email: reqInfo.sender_email,
      };
      const result = await requestCollection.findOne(query);

      if (result) {
        res.send({ acknowledged: false });
      } else {
        const result1 = await requestCollection.insertOne(reqInfo);
        res.send(result1);
      }
    });
    //get user name
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne(email);
      res.send(result);
    });

    //get user's friends info
    app.get("/friend/:email", async (req, res) => {
      const email = req.params.email;
      const query = {user_email:email} 
      const cursor = friendCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //get all users
    app.get("/peoples", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    //get specific user's post
    app.get("/post/:email", async (req, res) => {
      const email = req.params.email;
      const query = { user_email: email };
      const cursor = postCollection.find(query).sort({ milliseconds: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });
    //get specific user's friend request
    app.get("/request/:email", async (req, res) => {
      const email = req.params.email;
      const query = { receiver_email: email };
      const cursor = requestCollection.find(query).sort({ milliseconds: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    //delete friend request
    app.delete("/reqDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = requestCollection.deleteOne(query);
      res.send(result);
    });
    //   //get specific user's story
    // app.get('/story/:email', async(req,res)=>{
    //   const email = req.params.email;
    //   const query = {user_email: email}
    //   const cursor = storyCollection.find(query).sort( { "milliseconds": -1 } );
    //   const result = await cursor.toArray();
    //   res.send(result);
    //  })
  } catch {
    (err) => console.log(err);
  }
}

run().catch((err) => console.log(err));

// app.listen(port, ()=> {
//     console.log('server running')
// })

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnect");
  });
});

expressServer.listen(port, () => {
  console.log(`socket server running${port}`);
});
