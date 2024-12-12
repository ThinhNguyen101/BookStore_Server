const express = require("express");
const app = express();
require('dotenv').config();

// Truy cập các biến môi trường
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const port = process.env.PORT || 3000;

const cors = require("cors");
const bodyParser = require("body-parser");
const { connect } = require("./config/db");
const productRoutes = require('./routes/productRoutes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3003',
  credentials: true,
}));

connect()
  .then(() => {
    console.log("Connected to the database.");
  })
  .catch((error) => {
    console.log("Database connection failed!");
    console.error(error);
  });

app.use(express.json());
app.use("/api/products", productRoutes);


app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});