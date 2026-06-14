import { Job } from "bullmq";
import {
  clearIdemplotency,
  ensureIdempotency,
} from "../../shared/utils/helper";
import { sendMails } from "../../shared/utils/mailer";

interface EmailJobType {
  email: string;
  subject: string;
  html?: any;
  message?: string;
}

export const emailProcesser = async (job: Job<EmailJobType>) => {
  const { email, subject, html, message } = job.data;
  const canProceed = await ensureIdempotency(job.id!, "eamil");
  if (!canProceed) return;

  try {
    await sendMails({
      to: email,
      subject,
      ...(html && { html }),
      ...(message && { message }),
    });
  } catch (error: any) {
    await clearIdemplotency(job.id!, "email");
    throw error;
  }
};
