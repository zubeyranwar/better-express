import express, { Express, Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z, ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import {formatZodErrors} from "./src/utils/formatZodErrors";
import { faker } from '@faker-js/faker';
import {createControllerContent, createRouteContent, createServiceContent, routeTemplate} from "./src/templates";

// --- Config ---

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = '1h';

// ----------- Route Definition Types and Helper ------------

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RouteDefinition {
    method: HttpMethod;
    path: string;
    auth?: boolean;
    validate?: {
        body?: any;
        params?: any;
        query?: any;
    };
    handler: (req: Request, res: Response, next: NextFunction) => any;
}

export interface Flag {
    schema: string,
    export: string,
    noValidation:boolean
}


function defineRoute(route: RouteDefinition): RouteDefinition {
    return route;
}

// ----------- Validation Middleware ------------

function validationMiddleware(type: 'body' | 'params' | 'query', schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req[type]);
            next();
        } catch (e) {
            if (e instanceof ZodError) {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: formatZodErrors(e),
                });
            }
            next(e);
        }
    };
}

// ----------- JWT Auth Middleware ------------

function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.substring(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        (req as any).user = payload;
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

// ----------- JWT Helpers ------------

function signToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

// ----------- Router Registration ------------

interface RegisterRoutesOptions {
    prefix?: string;               // Global prefix, e.g. '/api/v1'
    globalMiddleware?: any[];      // Middleware applied to all routes
    authMiddleware?: any;          // Default auth middleware if not specified per route
    routesDir?: string;            // Directory to load routes from, defaults to './routes'
}

export async function registerRoutes(
    app: Express,
    options: RegisterRoutesOptions = {}
) {
    const router = Router();

    const {
        prefix = '',
        globalMiddleware = [],
        authMiddleware: defaultAuthMiddleware = authMiddleware,
        routesDir = path.resolve(__dirname, 'src/routes'),
    } = options;

    if (!fs.existsSync(routesDir)) {
        throw new Error(`Routes directory does not exist: ${routesDir}`);
    }

    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    console.log(`Registering routes from ${routesDir} with prefix '${prefix}'`);

    for (const file of routeFiles) {
        const modulePath = path.join(routesDir, file);
        const routeModule = await import(modulePath);
        // support default export or named export
        const routeDefs: RouteDefinition[] = Array.isArray(routeModule.default)
            ? routeModule.default
            : [routeModule.default];

        for (const routeDef of routeDefs) {
            if (!routeDef) continue;

            const method = routeDef.method.toLowerCase();
            const pathWithPrefix = prefix + routeDef.path;

            const middlewares: any[] = [...globalMiddleware];

            if (routeDef.validate) {
                if (routeDef.validate.params) {
                    middlewares.push(validationMiddleware('params', routeDef.validate.params));
                }
                if (routeDef.validate.query) {
                    middlewares.push(validationMiddleware('query', routeDef.validate.query));
                }
                if (routeDef.validate.body) {
                    middlewares.push(validationMiddleware('body', routeDef.validate.body));
                }
            }

            // Use route-specific auth if set, else default global auth if enabled
            if (routeDef.auth) {
                middlewares.push(defaultAuthMiddleware);
            }

            middlewares.push(routeDef.handler);

            (router as any)[method](pathWithPrefix, ...middlewares);

            console.log(`[${method.toUpperCase()}] ${pathWithPrefix}`);
        }
    }

    app.use(router);
}

// ----------- Create App ------------

function createApp(): Express {
    const app = express();

    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(morgan('dev'));


    // Global error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
}

// ----------- CLI ------------

function scaffoldProject() {
    const baseDir = process.cwd();

    const folders = [
        'src',
        'src/routes',
        'src/middleware',
        'src/controllers',
        'src/schemas',
    ];

    folders.forEach((folder) => {
        const fullPath = path.join(baseDir, folder);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`✅ Created folder: ${folder}`);
        }
    });


    const examplePath = path.join(baseDir, 'src/routes/hello.ts');
    if (!fs.existsSync(examplePath)) {
        fs.writeFileSync(examplePath, routeTemplate.trim());
        console.log('✅ Created example route: src/routes/hello.ts');
    }

    console.log('🚀 better-express project initialized!');
}

function generateCrud(args: string[]) {
    const entity = args[2];
    if (!entity) {
        console.log('❌ Please specify an entity name. Example: generate crud user');
        return;
    }

    const flags = {
        schema: ``,
        export: ``,
        noValidation: true,
    };

    args.slice(3).forEach(arg => {
        if (arg.startsWith('--schema=')) flags.schema = arg.split('=')[1];
        if (arg.startsWith('--export=')) flags.export = arg.split('=')[1];
        if (arg === '--validation') flags.noValidation = false;
    });

    const pascalEntity = entity.charAt(0).toUpperCase() + entity.slice(1);

    const controllerPath = `src/controllers/${entity}.controller.ts`;
    const servicePath = `src/services/${entity}.service.ts`;
    const routePath = `src/routes/${entity}.ts`;

    const controllerContent = createControllerContent(pascalEntity, entity).trim();
    const serviceContent = createServiceContent(pascalEntity, entity).trim();
    const routeContent = createRouteContent(pascalEntity, flags, entity).trim();

    fs.mkdirSync('src/controllers', { recursive: true });
    fs.mkdirSync('src/services', { recursive: true });
    fs.mkdirSync('src/routes', { recursive: true });

    if (!fs.existsSync(controllerPath)) fs.writeFileSync(controllerPath, controllerContent);
    if (!fs.existsSync(servicePath)) fs.writeFileSync(servicePath, serviceContent);
    if (!fs.existsSync(routePath)) fs.writeFileSync(routePath, routeContent);

    console.log(`✅ Controller: ${controllerPath}`);
    console.log(`✅ Service: ${servicePath}`);
    console.log(`✅ Route: ${routePath}`);
}


function startMockServer(args: string[]) {
    const entity = args[1];
    if (!entity) {
        console.log('❌ Please provide an entity name. Example: mock user --schema=./src/schemas/user.ts');
        return;
    }

    const flags = {
        schema: '',
        export: `${entity}Schema`,
        count: 10,
    };

    args.slice(2).forEach(arg => {
        if (arg.startsWith('--schema=')) flags.schema = arg.split('=')[1];
        if (arg.startsWith('--export=')) flags.export = arg.split('=')[1];
        if (arg.startsWith('--count=')) flags.count = parseInt(arg.split('=')[1]);
    });

    if (!flags.schema) {
        console.log('❌ Missing --schema flag');
        return;
    }

    import(path.resolve(flags.schema)).then((mod) => {
        const schema = mod[flags.export];
        if (!schema || typeof schema.array !== 'function') {
            console.log(`❌ Export "${flags.export}" is not a valid Zod schema`);
            return;
        }

        const app = express();
        app.use(cors());

        app.get(`/api/mock/${entity}`, (req, res) => {
            const data = schema.array().parse(Array.from({ length: flags.count }, () =>
                schema.parse({ name: faker.person.fullName(), email: faker.internet.email() })
            ));
            res.json(data);
        });

        app.listen(5050, () => {
            console.log(`🧪 Mock API for "${entity}" ready at http://localhost:5050/api/mock/${entity}`);
        });
    }).catch((err) => {
        console.error('❌ Failed to load schema:', err);
    });
}


function main() {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (cmd === 'init') {
        scaffoldProject();
    } else if (cmd === 'generate' && args[1] === 'crud') {
        generateCrud(args);
    }else if (cmd === 'mock') {
        startMockServer(args);
    } else {
        console.log('🛠 better-express CLI');
        console.log('Usage:');
        console.log('  ts-node better-express.ts init');
        console.log('  ts-node better-express.ts generate crud <entity> [--schema=path] [--export=name] [--no-validation]');
    }
}


// ----------- Run CLI if main ------------

if (require.main === module) {
    main();
}

// ----------- Exports ------------

export {
    createApp,
    defineRoute,
    RouteDefinition,
    authMiddleware,
    signToken,
};


