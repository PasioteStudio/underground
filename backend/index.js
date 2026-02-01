require('dotenv').config();
const express = require('express');
const cors = require("cors")
const { authRouter } = require("./route/login");
const { userRouter } = require("./route/user");
const { testRouter } = require("./route/test");

const PORT = process.env.PORT ? process.env.PORT : 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy')
app.use(cors({
    origin:process.env.NODE_ENV == "production" ? "*" : [process.env.FRONTEND_URL],
    credentials:true,
    exposedHeaders: ['Set-Cookie']
}))

app.use("/", authRouter);
app.use("/user",userRouter)
app.use("/test",testRouter)

app.listen(PORT, () => {
    console.log(process.env.PORT,process.env.PORT | 3000)
    console.log(`Server running at http://localhost:${PORT}`);
});