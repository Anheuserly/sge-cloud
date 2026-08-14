export interface DatabasePreset {
  id: string;
  name: string;
  envVars: string[];
  description: string;
  badge: string;
  color: string;
}

export interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  column_count: number;
  estimated_rows: number;
  total_size: string;
  total_size_bytes: number;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  foreignKey: {
    foreignTable: string;
    foreignColumn: string;
  } | null;
}

export interface TableIndex {
  indexname: string;
  indexdef: string;
}

export interface TableSchemaResponse {
  tableName: string;
  schemaName: string;
  columns: ColumnInfo[];
  indexes: TableIndex[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
}

export interface DatabaseOverview {
  databaseName: string;
  totalSize: string;
  totalSizeBytes: number;
  version: string;
  totalTables: number;
  totalEstimatedRows: number;
  activeConnections: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
