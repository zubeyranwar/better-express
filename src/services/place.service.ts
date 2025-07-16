import {prisma} from '@orm/prisma/db';

export class PlaceService {
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.place.findMany({ skip, take: limit }),
      prisma.place.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    return prisma.place.findUnique({ where: { id } });
  }

  async create(data: any) {
    return prisma.place.create({ data });
  }

  async update(id: string, data: any) {
    try {
      return prisma.place.update({
        where: { id },
        data,
      });
    } catch {
      return null;
    }
  }

  async delete(id: string) {
    try {
      await prisma.place.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}