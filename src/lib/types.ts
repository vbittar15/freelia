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
  specialties?: string[];
  settings?: import("./rubros").Settings | null;
  onboarded_at?: string | null;
};

export type Service = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  price: number;
  active: boolean;
  position: number;
};

export type PackageItem = { service_id: string | null; name: string; qty: number };
export type Package = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  period: "unico" | "mensual";
  price: number;
  items: PackageItem[];
  active: boolean;
  position: number;
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
  kind?: "proyecto" | "pieza" | "parrilla" | "campana" | "reunion";
  details?: Record<string, unknown> | null;
  meeting_at?: string | null;
  meeting_link?: string | null;
  delivered_at?: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color"> | null;
};

export type PostStatus = "borrador" | "en_revision" | "cambios" | "aprobado" | "publicado" | "entregado";
export type PostVersion = { id: string; post_id: string; round: number; assets: FileRef[]; copy: string | null; link_url: string | null; created_at: string };
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
  brief_id?: string | null;
  round?: number;
  review_request_id?: string | null;
  assets?: FileRef[];
  link_url?: string | null;
  social?: boolean;
  final_files?: FileRef[];
  delivered_at?: string | null;
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
  asset_idx?: number;
  round?: number | null;
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

export type ReviewRequest = {
  id: string;
  owner_id: string;
  client_id: string;
  brief_id: string | null;
  message: string | null;
  post_ids: string[];
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color" | "phone" | "client_user_id"> | null;
};

export type ClientService = {
  id: string;
  client_id: string;
  service_id: string | null;
  package_id: string | null;
  name: string;
  includes: string | null;
  qty: number;
  price: number;
  period: "mensual" | "unico";
  position: number;
};

export type ContractTerms = { start?: string; months?: number | null; pay_day?: number; advance?: number; notice_days?: number; rounds?: number; due_days?: number; city?: string };
export type Contract = {
  id: string;
  owner_id: string;
  client_id: string;
  number: number;
  title: string;
  body: string;
  services: Pick<ClientService, "name" | "includes" | "qty" | "price" | "period">[];
  terms: ContractTerms;
  status: "borrador" | "enviado" | "firmado" | "anulado";
  creative_name: string | null;
  creative_doc: string | null;
  sent_at: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_doc: string | null;
  signer_email: string | null;
  signature: string | null;
  signer_ip: string | null;
  signer_agent: string | null;
  body_hash: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "company" | "color" | "email" | "phone" | "client_user_id"> | null;
};
