import 'dotenv/config';
import app from './app.js';

const startServer = () => {
    try {
        app.on("error", (error) => {
            console.log("error en app", error)
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`Servidor escuchando el puerto ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("Internal server error (startServer)");
        process.exit(1);
    }
}

startServer();
