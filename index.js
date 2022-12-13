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
    methods: ["GET", "POST", "DELETE",'PATCH'],
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
    const editCollection = client.db("chitchat").collection("edit");
    const likeCollection = client.db("chitchat").collection("like");
    const commentCollection = client.db("chitchat").collection("comment");

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

    //insert user comment
    app.post("/comment", async (req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    //insert own user's like
    app.patch("/like/:id", async (req, res) => {
      const like = req.body;
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const ownerLike = {
        $set: {
          ownerLike: like.like,
        },
      };
      const result = await postCollection.updateOne(query, ownerLike);
      res.send(result);
    });

    //insert user's like to his friends post
    app.post("/friendPostLike", async (req, res) => {
      const likeInfo = req.body;
      // console.log(likeInfo)
      const query = {
        previous_id: likeInfo.previous_id,
        like_giver_email: likeInfo.like_giver_email,
      };
      const result = await likeCollection.findOne(query);
      // console.log(result)
      if (result) {
        const deleteLike = await likeCollection.deleteOne(query);
        // res.send(deleteLike);
        res.send({ acknowledged: false });
      } else {
        const result1 = await likeCollection.insertOne(likeInfo);
        res.send(result1);
      }
      // const like = req.body;
      // const id = req.params.id;
      // const query = {_id : ObjectId(id)}
      // const ownerLike = {
      //   $set: {
      //     ownerLike: like.like
      //   },
      // };
      // const result = await postCollection.updateOne(query,ownerLike)
      // res.send(result);
    });

    //insert user's edit
    app.post("/edit/:email", async (req, res) => {
      const edit = req.body;
      const email = req.params.email;
      // console.log(edit.name)
      // console.log(edit.photoUrl)
      const queryEdit = { email: email };
      const deletePreviousEdit = await editCollection.deleteOne(queryEdit);
      //update user collection
      const queryUser = { email: email };
      const updateUser = {
        $set: {
          name: `${edit.name}`,
          photoUrl: `${edit.photoUrl}`,
        },
      };
      const updateNameFromUserCol = await userCollection.updateOne(
        queryUser,
        updateUser
      );

      //update post collection
      const queryPost = { user_email: email };
      const updatePost = {
        $set: {
          user_name: `${edit.name}`,
          user_photo: `${edit.photoUrl}`,
        },
      };
      const updateNameFromPostCol = await postCollection.updateMany(
        queryPost,
        updatePost
      );

      //update story collection
      const queryStory = { user_email: email };
      const updateStory = {
        $set: {
          user_name: `${edit.name}`,
          user_photo: `${edit.photoUrl}`,
        },
      };
      const updateNameFromStoryCol = await storyCollection.updateMany(
        queryStory,
        updateStory
      );

      //update friend collection
      const queryFriend = { user_email: email };
      const updateFriend = {
        $set: {
          user_name: `${edit.name}`,
        },
      };
      const updateNameFromFriendCol = await friendCollection.updateMany(
        queryFriend,
        updateFriend
      );

      //  //update request collection
      //  const queryRequest = {rece_email:email}
      //  const updateFriend = {
      //    $set: {
      //      user_name: `${edit.name}`
      //    },
      //  };
      //  const updateNameFromFriendCol = await friendCollection.updateMany(queryFriend,updateFriend)

      const result = await editCollection.insertOne(edit);
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
    //get user photo
    app.get("/userPhoto/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //get user's edit profile ingo
    app.get("/profileInfo/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await editCollection.findOne(query);
      res.send(result);
    });

    // //get user name
    // app.get("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const result = await userCollection.findOne(email);
    //   res.send(result);
    // });

    //get user's friends info
    app.get("/friend/:email", async (req, res) => {
      const email = req.params.email;
      const query = { user_email: email };
      const cursor = friendCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //get user's friends post
    app.get("/friendsPost/:email", async (req, res) => {
      const email = req.params.email;
      const startIndex = req.query.startIndex;

      let friendArray;

      //find all posts
      const cursor = postCollection.find({}).sort({ milliseconds: -1 });
      const allPostArray = await cursor.toArray();
      const result = [];

      //find if user all like
      const likeCheckQuery = {
        like_giver_email: email,
      };
      const cursorlike = likeCollection.find(likeCheckQuery);
      const allLikeArray = await cursorlike.toArray();

      //find user friends
      const findFriendQuery = { user_email: email };
      const cursorFriend = friendCollection.find(findFriendQuery);
      const array1 = await cursorFriend.toArray();

      if (array1.length == 0) {
        const findFriendQuery = { friend_email: email };
        const cursorFriend = friendCollection.find(findFriendQuery);
        const array2 = await cursorFriend.toArray();
        friendArray = array2;

        //filter post array sothat only get friends post
        const friendsPost = allPostArray.filter(freindCheck);

        function freindCheck(post) {
          friendArray.map((element) => {
            if (element.user_email === post.user_email) {
              // console.log(post)

              //find post id
              const id = post._id;
              const stringId = JSON.stringify(id);
              const exactId = stringId.slice(1, -1);

              //check if user give like in specific post sothat show blue mark perfectly
              allLikeArray.map((element) => {
                console.log(element);
                if (element.previous_id === post._id) {
                  post.ownerLike = true;
                  result.push(post);
                }
              });
              result.push(post);
            }
          });
        }
      } else {
        friendArray = array1;

        //filter post array sothat only get friends post
        const friendsPost = allPostArray.filter(freindCheck);

        function freindCheck(post) {
          friendArray.map((element) => {
            if (element.friend_email === post.user_email) {
              //find post id
              const id = post._id;
              const stringId = JSON.stringify(id);
              const exactId = stringId.slice(1, -1);

              //check if user give like in specific post sothat show blue mark perfectly

              allLikeArray.map((element) => {
                if (element.previous_id === exactId) {
                  post.ownerLike = true;
                }
              });
              result.push(post);
            }
          });
        }
      }

      const limitArray = [];

      for (let i = startIndex; i < startIndex + 2; i++) {
        if (i > startIndex + 2) {
          break;
        } else {
          limitArray.push(result[i]);
        }
      }
      const total = result.length;
      // console.log(result)
      // console.log(total)

      const filterLimitArray = limitArray.filter(Boolean);

      res.send({ filterLimitArray, total });
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

      //find user all post
      const cursorAllPost = postCollection.find(query).sort({ milliseconds: -1 });
      const allPostArray = await cursorAllPost.toArray();

      //find if user all like
      const likeCheckQuery = {
        like_giver_email: email,
      };
      const cursorlike = likeCollection.find(likeCheckQuery);
      const allLikeArray = await cursorlike.toArray();

      const result = []

      allPostArray.filter(checkLike);
      function checkLike (singlePost){
        //find singlePost id
        const id = singlePost._id;
        const stringId = JSON.stringify(id);
        const exactId = stringId.slice(1, -1);
        //check if user give like in specific post sothat show blue mark perfectly
        allLikeArray.map((element) => {
          if (element.previous_id === exactId) {
            singlePost.ownerLike = true;
          }
        });
        result.push(singlePost);
      }

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

    //get specific post's comments
    app.get("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { previous_id: id };
      const cursor = commentCollection.find(query);
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

    //delete friend
    app.delete("/friendDeleted/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = friendCollection.deleteOne(query);
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
