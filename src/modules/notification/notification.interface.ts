import { OffsetPaginationMeta } from "../../shared/repository/baseRepository";

export interface IGetNotificationListResponse {
  data: {
    workspace: {
      id: string;
      name: string;
    };
    type: string;
    title: string;
    read: boolean;
    createdAt: Date;
  }[];
  meta: OffsetPaginationMeta;
}

export interface IGetNotificationDetails {
  workspace: {
    id: string;
    name: string;
  };
  type: string;
  title: string;
  body: string;
  read: boolean;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: Date;
}
