import express, { json } from 'express';
import authRouter from './routes/auth.route.js';
import healthRouter from './routes/health.route.js';
import cookieParser from 'cookie-parser';

const app = express();


app.use(express.json());
app.use(cookieParser())


app.get('/', (req, res) => {
    return res.status(200).json({ok:true})
});

app.use('/auth', authRouter);
app.use('/health', healthRouter);



export default app;