require('dotenv').config();
const express = require('express');
const cors = require("cors")
const { authRouter } = require("./route/login");
const { userRouter } = require("./route/user");
const { testRouter } = require("./route/test");
const { tracksRouter } = require("./route/tracks");
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT ? process.env.PORT : 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middlewares
app.use(helmet());
app.use(cookieParser());

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials:true,
    exposedHeaders: ['Set-Cookie']
}))

// Rate limiters for auth-sensitive endpoints
app.set('trust proxy', 1);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/login', authLimiter);
app.use('/callback', authLimiter);
app.use('/user/token', authLimiter);

app.use("/", authRouter);
app.use("/user",userRouter)
app.use("/test",testRouter)
app.use("/tracks",tracksRouter)

// Error handling middleware - must be last and have all 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json('Internal Server Error' );
  } else {
    res.status(500).json({ message: err.message, stack: err.stack.split('\n') });
  }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});