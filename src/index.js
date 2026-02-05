import express from "express";
import { matchrouter } from "./routes/matches.js";

const app = express();

app.use(express.json());

app.use("/matches", matchrouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
