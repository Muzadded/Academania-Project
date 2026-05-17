/**
 * Shared API contracts — used by frontend and backend.
 * Do not duplicate these interfaces in app code.
 */

// ─── Enums ───────────────────────────────────────────────────

export const UserRole = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
  RECEIVED: 'RECEIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const MeetingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;
export type MeetingStatus = (typeof MeetingStatus)[keyof typeof MeetingStatus];

export const NotificationType = {
  ORDER_STATUS: 'ORDER_STATUS',
  PAYMENT: 'PAYMENT',
  MESSAGE: 'MESSAGE',
  MEETING: 'MEETING',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Auth ────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

// ─── Contact ─────────────────────────────────────────────────

export interface ContactInquiryDto {
  name: string;
  email: string;
  message: string;
}

export interface ContactInquiryResponse {
  id: string;
  message: string;
}

// ─── Services ────────────────────────────────────────────────

export interface ServiceDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
}

// ─── Orders ──────────────────────────────────────────────────

export interface MeetingSlotPreference {
  preferredAt: string;
  priority: number;
}

export interface CreateOrderDto {
  serviceId: string;
  clientName: string;
  university: string;
  budget: number;
  deadline: string;
  description: string;
  meetingSlots: MeetingSlotPreference[];
}

export interface OrderSummaryDto {
  id: string;
  referenceNumber: string;
  status: OrderStatus;
  serviceTitle: string;
  deadline: string;
  createdAt: string;
}

export interface OrderStatusHistoryDto {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface DeliverableDto {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface OrderDetailDto extends OrderSummaryDto {
  clientName: string;
  university: string;
  budget: number;
  description: string;
  requirementFileUrl: string | null;
  statusHistory: OrderStatusHistoryDto[];
  deliverables: DeliverableDto[];
  assignedTo: string | null;
}

export interface RevisionRequestDto {
  note: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  note?: string;
}

// ─── Meetings ────────────────────────────────────────────────

export interface CreateMeetingDto {
  orderId?: string;
  clientName: string;
  clientEmail: string;
  slots: MeetingSlotPreference[];
  notes?: string;
}

export interface MeetingDto {
  id: string;
  orderId: string | null;
  status: MeetingStatus;
  preferredAt: string;
  priority: number;
  confirmedAt: string | null;
  meetingLink: string | null;
  notes: string | null;
}

export interface ConfirmMeetingDto {
  slotId: string;
  meetingLink?: string;
}

// ─── Payments ────────────────────────────────────────────────

export interface PaymentDto {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  screenshotUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface VerifyPaymentDto {
  approved: boolean;
  rejectionReason?: string;
}

// ─── Messages / Chat ─────────────────────────────────────────

export interface MessageDto {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
}

// ─── Notifications ───────────────────────────────────────────

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Admin ───────────────────────────────────────────────────

export interface AdminOrderFilters {
  status?: OrderStatus;
  assignee?: string;
  search?: string;
  deadlineBefore?: string;
}

export interface AssignOrderDto {
  assigneeId: string;
}

export interface AdminClientDto {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  activeOrders: number;
}

export interface CreateClientDto {
  name: string;
  email: string;
  password?: string;
}

export interface AdminAnalyticsDto {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

// ─── API envelope ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
