// TODO: Clean this up in the future
export type OrderDto = {
  Customer: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  };
  number: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  totalPrice: string;
  paymentGateway: string;
  tags: string;
  shippingAddress: string;
  customerId: string;
}
