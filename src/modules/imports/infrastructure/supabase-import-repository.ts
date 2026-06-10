import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateSupplierImportInput,
  SupplierImportRepository,
} from "@/src/modules/imports/application/import-repository";
import type { ImportProcessingResult } from "@/src/modules/imports/domain/import-result";
import type {
  ImportStatus,
  SupplierImport,
} from "@/src/modules/imports/domain/supplier-import";

interface SupplierImportRow {
  id: string;
  original_filename: string;
  status: ImportStatus;
  error_message: string | null;
  result: ImportProcessingResult | null;
  created_at: string;
  completed_at: string | null;
}

function mapImport(row: SupplierImportRow): SupplierImport {
  return {
    id: row.id,
    originalFilename: row.original_filename,
    status: row.status,
    errorMessage: row.error_message,
    result: row.result,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export class SupabaseSupplierImportRepository
  implements SupplierImportRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async list(businessId: string): Promise<SupplierImport[]> {
    const { data, error } = await this.client
      .from("supplier_imports")
      .select(
        "id, original_filename, status, error_message, result, created_at, completed_at",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as SupplierImportRow[]).map(mapImport);
  }

  async create(input: CreateSupplierImportInput): Promise<SupplierImport> {
    const completed = Boolean(input.processingResult);
    const { data, error } = await this.client
      .from("supplier_imports")
      .insert({
        business_id: input.businessId,
        storage_path: input.storagePath,
        original_filename: input.originalFilename,
        status: completed ? "completed" : "pending",
        result: input.processingResult ?? null,
        completed_at: completed ? new Date().toISOString() : null,
        created_by: input.userId,
      })
      .select(
        "id, original_filename, status, error_message, result, created_at, completed_at",
      )
      .single();

    if (error) throw error;
    return mapImport(data as SupplierImportRow);
  }
}
