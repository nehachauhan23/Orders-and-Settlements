import { Response } from "express";
import * as orderService from "./order.service";
import { createOrderSchema, updateOrderSchema, listOrdersQuerySchema } from "./order.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import { toOrderDTO } from "./order.dto";

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(req.userId!, input);
  res.status(201).json({ order: toOrderDTO(order) });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const query = listOrdersQuerySchema.parse(req.query);
  const { orders, pagination } = await orderService.listOrders(req.userId!, query);
  res.status(200).json({ orders: orders.map(toOrderDTO), pagination });
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const order = await orderService.getOrderById(req.userId!, req.params.id);
  res.status(200).json({ order: toOrderDTO(order) });
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const input = updateOrderSchema.parse(req.body);
  const order = await orderService.updateOrder(req.userId!, req.params.id, input);
  res.status(200).json({ order: toOrderDTO(order) });
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await orderService.deleteOrder(req.userId!, req.params.id);
  res.status(204).send();
}
