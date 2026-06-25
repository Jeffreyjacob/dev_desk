import { BillingService } from "./billing.service";

export class BillingController {
  constructor(private readonly service: BillingService) {}
}
