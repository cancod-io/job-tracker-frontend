/** Attachment row from `GET /api/v1/applications/{id}/files`. */
export type ApiApplicationFile = {
  id: number;
  application_id: number;
  filename: string;
  content_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
  uploader?: string | null;
};

export type ApiApplicationFilesListResponse = {
  items: ApiApplicationFile[];
  total?: number;
};
