import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";

export interface CreateSupplierImportInput {
  businessId: string;
  userId: string;
  originalFilename: string;
}

export interface SupplierImportRepository {
  list(businessId: string): Promise<SupplierImport[]>;
  create(input: CreateSupplierImportInput): Promise<SupplierImport>;
}
