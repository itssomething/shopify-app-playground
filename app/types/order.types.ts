export interface Customer {
  fullName: string;
}

export interface ActionResponse {
  errors?: Array<{ message: string; field: string }>;
  order?: {
    id: string;
    tags: string[];
  };
}

export interface Order extends Record<string, unknown> {
  id: string;
  number: string;
  createdAt: string;
  totalPrice: number;
  shippingAddress: string;
  tags: string;
  paymentGateway: string;
  Customer: Customer;
}
