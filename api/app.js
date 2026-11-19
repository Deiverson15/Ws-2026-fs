import express from "express";
import "dotenv/config";
import AccountRoutes from './src/routes/account.route.js';




const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use('/accounts', AccountRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API disponible" });
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});