import {createApp, registerRoutes} from '../better-express';
import {NextFunction} from "express";

const app = createApp();


registerRoutes(app, {
    prefix: '/api/v1',
    globalMiddleware: [
        (req:Request, res:Response, next:NextFunction) => {
            console.log(`Incoming request: ${req.method} ${req.url}`);
            next();
        },
    ],

}).catch(err => {
    console.error('Failed to register routes:', err);
    process.exit(1);
});


const PORT = process.env.PORT || 4000;


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
