import type { Report } from "@/src/modules/reports/domain/report";

export interface CreateReportInput {
  businessId: string;
  userId: string;
  locationId?: string;
  periodStart: string;
  periodEnd: string;
}

export interface ReportRepository {
  list(businessId: string): Promise<Report[]>;
  getById(businessId: string, reportId: string): Promise<Report | null>;
  create(input: CreateReportInput): Promise<Report>;
}
