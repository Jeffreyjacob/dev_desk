import { Request, Response } from "express";
import { WebhookService } from "./webhook.service";
import {
  createWebhookEndpointSchema,
  listDeliveriesSchema,
} from "./webhook.validation";
import { ResponseHelper } from "../../shared/utils/apiResponse";

export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  async createEndpoint(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const data = createWebhookEndpointSchema.parse(req.body);
    const result = await this.webhookService.createEndpoint(workspaceId, data);
    req.log?.info({ workspaceId }, "webhook endpoint added");
    ResponseHelper.created(res, result, "Webhook endpoint added successfully!");
  }

  async listEndpoints(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const result = await this.webhookService.listEndpoints(workspaceId);
    ResponseHelper.success(res, result, 200, "Endpoint has been fetched ");
  }

  async deleteEndpoint(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const { endpointId } = req.params;
    await this.webhookService.deleteEndpoint(workspaceId, endpointId as string);
    req.log?.info({ workspaceId, endpointId }, "webhook endpoint deleted");
    ResponseHelper.noContent(res);
  }

  async listDeliveries(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const { endpointId } = req.params;
    const query = listDeliveriesSchema.parse(req.query);
    const result = await this.webhookService.listDeliveries(
      workspaceId,
      endpointId as string,
      query
    );
    ResponseHelper.success(
      res,
      result.data,
      200,
      "webhook delievery fetched",
      result.meta
    );
  }

  async sendTestPing(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const { endpointId } = req.params;
    const result = await this.webhookService.sendTestPing(
      workspaceId,
      endpointId as string
    );
    ResponseHelper.success(res, result, 200, "test ping sent");
  }
}
