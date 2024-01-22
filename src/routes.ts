import { Router } from "express";
import { vehicleController } from "./controller/VehicleController";
import { customerController } from "./controller/CustomerController";

const routes = Router();

routes.post('/vehicles',vehicleController.create);
routes.get('/vehicles',vehicleController.getAll);
routes.get('/vehicles/:id',vehicleController.getById);
routes.put('/vehicles/:id',() => {});
routes.delete('/vehicles/:id',vehicleController.delete); // trocar para deletar por placa

routes.post('/customers',() => {});
routes.get('/customers',customerController.getAll);
routes.get('/customers/id/:id',customerController.getById);
routes.get('/customers/cpf/:cpf',customerController.getByCpf);
routes.put('/customers/:id',() => {});
routes.delete('/customers/:id',customerController.delete); // trocar para deletar por cpf

export { routes };