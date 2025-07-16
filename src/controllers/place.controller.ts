import { Request, Response } from 'express';
import { PlaceService } from '@services/place.service';

const service = new PlaceService();

export const PlaceController = {
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
      if (!item) return res.status(404).json({ error: 'Place not found' });
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
      if (!item) return res.status(404).json({ error: 'Place not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  delete: async (req: Request, res: Response) => {
    try {
      const deleted = await service.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Place not found' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};