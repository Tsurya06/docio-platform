export class ApiResponse {
  constructor(data, meta) {
    this.success = true;
    this.data = data;
    if (meta !== undefined) this.meta = meta;
  }

  static ok(data) {
    return new ApiResponse(data);
  }

  static paginated({ items, page, limit, total }) {
    return new ApiResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
