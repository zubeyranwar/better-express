import { defineRoute } from '@/better-express';


import { PlaceController } from '@controllers/place.controller';
import {HTTPMethod} from "@src/types/enums";

export default [
  defineRoute({
    method: HTTPMethod.GET,
    path: '/places',
    handler: PlaceController.findAll,
  }),
  defineRoute({
    method: HTTPMethod.POST,
    path: '/places',
    
    handler: PlaceController.create,
  }),
  defineRoute({
    method: HTTPMethod.GET,
    path: '/places/:id',
    handler: PlaceController.findById,
  }),
  defineRoute({
    method: HTTPMethod.PUT,
    path: '/places/:id',
    
    handler: PlaceController.update,
  }),
  defineRoute({
    method: HTTPMethod.DELETE,
    path: '/places/:id',
    
    handler: PlaceController.delete,
  }),
];