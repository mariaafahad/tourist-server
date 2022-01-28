const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
require("dotenv").config();
const port = process.env.PORT || 5000;
const fileUpload = require("express-fileupload");



app.use(cors());
app.use(express.json({ limit: "50mb" }))
app.use(fileUpload());

const uri = "mongodb+srv://travelers-blog:dvCiMhsDfyOSoahQ@cluster0.fzvfh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



async function run() {
    try {
        await client.connect();
        console.log("Database Connected");
        const database = client.db("travelDB");
        const blogsCollection = database.collection("blogs");
        const usersCollection = database.collection("users");
        const commentsCollection = database.collection("comments");

        // get all blogs from db
        app.get("/allBlog", async (req, res) => {
            const blogs = await blogsCollection.find({}).toArray();
            res.send(blogs);
        });

        // get the 10 blogs from db collection
        app.get("/blogs", async (req, res) => {
            const query = { status: "Approved" };
            const cursor = blogsCollection.find(query);
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let blogs;

            const count = await cursor.count();

            if (page) {
                blogs = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                blogs = await cursor.toArray();
            }

            res.send({ count, blogs });
        });

        // get the single blog from db
        app.get("/blog/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const blog = await blogsCollection.findOne(query);
            res.send(blog);
        });

        // blog approved to db
        app.put("/blog/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: "Approved",
                },
            };
            const result = await blogsCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        // save user to database
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // check admin or not
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        app.put("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });

        // post blog to DB
        app.post("/addBlog", async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });

        // specific my blogs find api
        app.get("/myBlogs/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const blogs = await blogsCollection.find(query).toArray();
            res.send(blogs);
        });

        // delete blog api
        app.delete("/deleteBlog/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogsCollection.deleteOne(query);
            res.send(result);
        });

        // users make an admin
        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            if (query) {
                const updateDoc = {
                    $set: {
                        role: "admin",
                    },
                };
                const result = await usersCollection.updateOne(query, updateDoc);
                res.send(result);
            }
        });

        // comment post of the blog
        app.post('/comment', async (req, res) => {
            const comment = req.body;
            const result = await commentsCollection.insertOne(comment);
            res.send(result);
        })

        // get comments specific blog
        app.get('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { blogId: id };
            const comments = await commentsCollection.find(query).toArray();
            res.send(comments);
        })

        // delete comment api
        app.delete('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await commentsCollection.deleteOne(query);
            res.send(result);
        })

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running')
})
app.listen(port, (req, res) => {
    console.log("Server running on port: ", port);
});