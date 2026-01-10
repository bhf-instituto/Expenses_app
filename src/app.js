import express, { json } from 'express';
import authRouter from './routes/auth.route.js';
import inviteRouter from './routes/invite.route.js';
import setRouter from './routes/set.route.js';
import healthRouter from './routes/health.route.js';
import cookieParser from 'cookie-parser';
import checkToken from './middlewares/checkToken.middleware.js';

const app = express();


app.use(express.json());
app.use(cookieParser())
app.use(checkToken)


app.get('/', (req, res) => {
    return res.status(200).json({ok:true})
});

app.use('/auth', authRouter);
app.use('/invite', inviteRouter);
app.use('/set', setRouter);

app.use('/health', healthRouter);



export default app;