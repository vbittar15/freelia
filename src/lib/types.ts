export type Role = "creative" | "client";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  business_name: string | null;
  document_id: string | null;
  city: string | null;
  phone: string | null;
  bank_info: string | null;
};

export type Client = {
  id: string;
  owner_id: string;
  client_user_id: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  color: string | null;
  notes: string | null;
  archived: boolean;
  invite_token: string;
  created_at: string;
};

export type BriefStatus = "nuevo" | "en_proceso" | "completado";
export type Brief = {
  id: string;
  owner_id: string;
  client_id: string;
  created_by: string;
  title: string;
  objective: string | null;
  audience: string | null;
  key_message: string | null;
  deliverables: string | null;
  refs: string | null;
  deadline: string | null;
  budget: number | null;
  status: BriefStatus;
  attachments?: FileRef[] | null;
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color"> | null;
};

export type PostStatus = "borrador" | "en_revision" | "cambios" | "aprobado" | "publicado";
export type Post = {
  id: string;
  owner_id: string;
  client_id: string;
  title: string;
  network: string;
  format: string;
  scheduled_at: string | null;
  copy: string | null;
  asset_url: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "name" | "company" | "color"> | null;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string | null;
  action: "comentario" | "aprobado" | "cambios";
  x?: number | null;
  y?: number | null;
  resolved?: boolean;
  created_at: string;
  profiles?: Pick<Profile, "full_name"> | null;
};

export type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  position?: number;
};

export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada";
export type Quote = {
  id: string;
  owner_id: string;
  client_id: string;
  number: number;
  title: string;
  status: QuoteStatus;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color" | "email" | "document_id"> | null;
  quote_items?: LineItem[];
};

export type InvoiceStatus = "borrador" | "enviada" | "pagada";
export type Invoice = {
  id: string;
  owner_id: string;
  client_id: string;
  number: number;
  concept: string;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color" | "email" | "document_id"> | null;
  invoice_items?: LineItem[];
};

export type Message = {
  id: string;
  client_id: string;
  sender_id: string;
  body: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type FileRef = { url: string; name: string; type: string };
