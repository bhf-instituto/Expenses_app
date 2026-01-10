import express, { json } from 'express';
import authRouter from './routes/auth.route.js'

const app = express();


app.use(json());


app.get('/', (req, res) => {
    return res.status(200).json({ok:true})
})

app.use('/auth', authRouter)



export default app;