#  better-backend

A scalable, auto-routable Express backend framework with support for:

- ✅ Zod validation middleware  
- ✅ JWT-based authentication  
- ✅ File-based dynamic route registration  
- ✅ Auto CRUD + project scaffolding via CLI  
- ✅ Faker-based mock API generation  
- ✅ Inspired by NestJS structure (Controllers, Services, Schemas)

> Designed for projects that want NestJS-like structure but with full control using **Express + TypeScript**.

---

## 📦 Installation

```bash
bun install
# or
npm install
```

Make sure you have TypeScript + ts-node installed globally if using CLI directly:

```bash
npm install -g ts-node typescript
```

---

## 🔧 Project Setup

Run the following command to scaffold a new project structure:

```bash
ts-node better-express.ts init
```

This creates:

```
src/
├── controllers/
├── routes/
├── services/
├── schemas/
```

---

## ✨ Features

### 🧱 Auto Route Registration

Create any file inside `src/routes`, export a route definition (or array), and it's auto-registered!

```ts
// src/routes/hello.ts
import { defineRoute } from '../../better-express';
import { z } from 'zod';

export default defineRoute({
  method: 'GET',
  path: '/hello',
  validate: {
    query: z.object({ name: z.string().optional() }),
  },
  handler: (req, res) => {
    res.json({ msg: `Hello, ${req.query.name || 'world'}!` });
  },
});
```

### 🔒 Auth Middleware (JWT)

Add `auth: true` to any route to protect it:

```ts
auth: true
```

Set the JWT secret in `.env`:

```
JWT_SECRET=your_super_secret
```

Generate tokens in your auth controller:

```ts
import { signToken } from '../../better-express';

const token = signToken({ userId: user.id });
```

---

## ⚙️ Start the App

```ts
// src/index.ts
import { createApp, registerRoutes } from './better-express';

const app = createApp();

await registerRoutes(app, {
  prefix: '/api/v1',
});

app.listen(4000, () => {
  console.log('🚀 Server running at http://localhost:4000');
});
```

---

## 🧪 Generate CRUD

Quickly generate a CRUD scaffold:

```bash
ts-node better-express.ts generate crud user --schema=./src/schemas/user.ts --export=userSchema
```

It creates:

```
src/controllers/user.controller.ts
src/routes/user.ts
src/services/user.service.ts
```

You can disable validation using `--no-validation`.

---

## 🎭 Start Mock Server

Generate fake data based on a Zod schema:

```bash
ts-node better-express.ts mock user --schema=./src/schemas/user.ts --export=userSchema --count=20
```

➡️ Mock API available at `http://localhost:5050/api/mock/user`

---

## 🧪 Validation Middleware

Supports **Zod** schema for:

- `body`
- `params`
- `query`

```ts
validate: {
  body: z.object({ name: z.string() }),
  query: z.object({ page: z.number().optional() })
}
```

Automatically returns 400 with error details if validation fails.

---

## 📁 Example Folder Structure

```
src/
├── controllers/
│   └── user.controller.ts
├── routes/
│   └── user.ts
├── services/
│   └── user.service.ts
├── schemas/
│   └── user.ts
index.ts
```

---

## 🛠 CLI Commands

| Command                                         | Description                            |
|------------------------------------------------|----------------------------------------|
| `ts-node better-express.ts init`               | Scaffold project folders               |
| `ts-node better-express.ts generate crud <name>` | Generate CRUD files                   |
| `ts-node better-express.ts mock <entity>`      | Start mock server using Zod schema     |

---

## 🧠 Example Auth Route

```ts
export default defineRoute({
  method: 'POST',
  path: '/login',
  validate: {
    body: z.object({ email: z.string().email(), password: z.string() })
  },
  handler: async (req, res) => {
    const token = signToken({ email: req.body.email });
    res.json({ token });
  }
});
```

---

## 🔐 Env Setup

Create a `.env` file:

```
JWT_SECRET=your_jwt_secret
```

---

## 📘 License

MIT

---

## 🤝 Collaboration

To collaborate:

1. Fork the repo or clone it.
2. Run `ts-node better-express.ts init` to scaffold.
3. Build new routes in `src/routes`.
4. Use `generate crud <name>` to scaffold structured components.
5. PRs welcome!

Happy hacking 🎯
