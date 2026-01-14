import express, { json } from 'express';
import authRouter from './routes/auth.route.js';
import inviteRouter from './routes/invite.route.js';
import setRouter from './routes/set.route.js';
import healthRouter from './routes/health.route.js';
import cookieParser from 'cookie-parser';
import attachSession from './middlewares/attachSession.middleware.js';
import { hashSomething } from './utils/test_scripts.js';

const app = express();


app.use(express.json());
app.use(cookieParser())
app.use(attachSession)


app.get('/', (req, res) => {
    // console.log(hashSomething());

    return res.status(200).json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/invite', inviteRouter);
app.use('/set', setRouter);

app.use('/health', healthRouter);



export default app;