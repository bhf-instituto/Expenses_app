import express, { json } from 'express';
import authRouter from './routes/auth.route.js';
import inviteRouter from './routes/invite.route.js';
import setsRouter from './routes/set.route.js';
import categoriesRouter from './routes/categories.route.js';
import healthRouter from './routes/health.route.js';
import cookieParser from 'cookie-parser';
import attachSession from './middlewares/attachSession.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(attachSession);


app.get('/', (req, res) => {
    return res.status(200).json({ ok: true });
});

app.use('/auth', authRouter);
app.use('/invite', inviteRouter);
app.use('/sets', setsRouter);
app.use('/categories', categoriesRouter);

app.use('/health', healthRouter);

app.use(errorHandler);

export default app;