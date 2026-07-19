export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: PaginatedMeta | Record<string, unknown>;

  constructor(data: T, meta?: PaginatedMeta | Record<string, unknown>) {
    this.success = true;
    this.data = data;
    if (meta !== undefined) this.meta = meta;
  }

  static ok<T>(data: T): ApiResponse<T> {
    return new ApiResponse(data);
  }

  static paginated<T>({
    items,
    page,
    limit,
    total,
  }: {
    items: T[];
    page: number;
    limit: number;
    total: number;
  }): ApiResponse<T[]> {
    return new ApiResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
