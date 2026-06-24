require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let db;

//Conectar con MongoDB
async function connectDB() {
  await client.connect();
  db = client.db("Betty_Tatto");
  console.log("Conectado a la base de datos");
}

//prueba
app.get("/", (req, res) => {
  res.send("backend funcionando");
});

//crear usuario
app.post("/users", async (req, res) => {
  const result = await db.collection("users").insertOne(req.body);
  res.json(result);
});

//ejecutar server
const port = process.env.PORT || 3000;

app.listen(process.env.PORT, () => {
  console.log(`Servidor escuchando en el puerto ${process.env.PORT}`);
});
