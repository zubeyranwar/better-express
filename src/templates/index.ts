import {Flag} from "@/better-express";

export const routeTemplate = `
import { defineRoute } from '@index';
import { z } from 'zod';

export default defineRoute({
  method: 'GET',
  path: '/hello',
  handler: (req, res) => {
    res.json({ message: 'Hello from better-express!' });
  },
});`


export const createControllerContent = (pascalEntity:string, entity:string) => {
    return `
import { Request, Response } from 'express';
import { ${pascalEntity}Service } from '@services/${entity}.service';

const service = new ${pascalEntity}Service();

export const ${pascalEntity}Controller = {
  findAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await service.findAll(page, limit);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  findById: async (req: Request, res: Response) => {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ error: '${pascalEntity} not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  create: async (req: Request, res: Response) => {
    try {
      const item = await service.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: '${pascalEntity} not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const deleted = await service.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: '${pascalEntity} not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};`
}


export const createServiceContent = (pascalEntity:string, entity:string)  => {
    return `
import { prisma } from '@orm/db';

export class ${pascalEntity}Service {
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.${entity}.findMany({ skip, take: limit }),
      prisma.${entity}.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    return prisma.${entity}.findUnique({ where: { id } });
  }

  async create(data: any) {
    return prisma.${entity}.create({ data });
  }

  async update(id: string, data: any) {
    try {
      return prisma.${entity}.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async delete(id: string) {
    try {
      await prisma.${entity}.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
`
}

export const createRouteContent = (pascalEntity:string, flags:Flag, entity:string) => {
    return `
import { defineRoute } from '@/better-express';
${flags.noValidation ? '' : `import { z } from 'zod';`}
${flags.schema ? `import { ${flags.export} } from '${flags.schema}';` : ""}
import { ${pascalEntity}Controller } from '@controllers/${entity}.controller';
import {HTTPMethod} from "@src/types/enums";

export default [
  defineRoute({
    method: HTTPMethod.GET,
    path: '/${entity}s',
    handler: ${pascalEntity}Controller.findAll,
  }),
  defineRoute({
    method: HTTPMethod.POST,
    path: '/${entity}s',${flags.noValidation ? '' : `\n    validate: { body: ${flags.export} },`}
    handler: ${pascalEntity}Controller.create,
  }),
  defineRoute({
    method: HTTPMethod.GET,
    path: '/${entity}s/:id',${flags.noValidation ? '' : `
    validate: { params: z.object({ id: z.string() }) },`}
    handler: ${pascalEntity}Controller.findById,
  }),
  defineRoute({
    method: HTTPMethod.PUT,
    path: '/${entity}s/:id',${flags.noValidation? '' : `\n    validate: {\n      params: z.object({ id: z.string() }),\n      body: ${flags.export},\n    },`}
    handler: ${pascalEntity}Controller.update,
  }),
  defineRoute({
    method: HTTPMethod.DELETE,
    path: '/${entity}s/:id',${flags.noValidation ? '' : `\n    validate: { params: z.object({ id: z.string() }) },`}
    handler: ${pascalEntity}Controller.delete,
  }),
];`
}