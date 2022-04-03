#!/usr/bin/env node
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authRoute = require("./routes/auth.ts");
const cors = require("cors");
require("dotenv").config();

const PORT = parseInt(process.env.PORT || "", 10) | 3000;

/**
 * connect to mongodb
 */
mongoose.connect(process.env.DB_CONNECT, () => {
  console.log("Connected to this db:", process.env.DB_CONNECT);
});

app.use(express.json());
app.use(cors());

/**
 * Root Route as /api/user
 */
app.use("/api/user", authRoute);

/**
 * listen on port 3000
 */
app.listen(PORT, () => console.log("Server Running on Port", PORT));
