import { OffsetPaginationMeta } from "../../shared/repository/baseRepository";

export interface IGetNotificationListResponse {
  data: {
    id: string;
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
  id: string;
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
