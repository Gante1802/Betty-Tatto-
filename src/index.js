require("dotenv").config();

const app = require("./app");
const { connectToMongo } = require("./database/mongoClient");

const port = process.env.PORT || 9000;

async function startServer() {
  await connectToMongo();

  app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
  });
}

startServer().catch((error) => {
  console.error("No se pudo iniciar la aplicacion:", error.message);
  process.exit(1);
});
