const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/db");
const cookieParser = require("cookie-parser");
const path = require('path')
const authRoute = require('./routes/userRoute')
const mangaRoute = require('./routes/mangaRoute')
const recommendationRoute = require('./routes/recommendationRoute')
const challengeRoute = require('./routes/challengeRoute')
const achievementRoute = require('./routes/achievementRoute')


require("dotenv").config();

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: "GET,POST,PUT,DELETE",
    credentials: true, 
  })
);

app.use('/api/auth',authRoute)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/api/manga',mangaRoute)
app.use('/api/recommend',recommendationRoute)
app.use('/api/challenge',challengeRoute)
app.use('/api/achievements',achievementRoute)

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));