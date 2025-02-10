import db from "../db.server";
import { ActionResponse, Order } from "../types/order.types";

export class OrderServer {
  static async getAllOrders(): Promise<Order[]> {
    const orders = await db.order.findMany({
      include: {
        Customer: true,
      },
    });

    return orders.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt).toLocaleString(),
      totalPrice: Number(order.totalPrice),
    }));
  }

  static async updateOrderTags(
    admin: { graphql: (query: string, options?: any) => Promise<any> },
    orderId: string,
    tags: string
  ): Promise<ActionResponse> {
    const response = await admin.graphql(
      `
      mutation UpdateOrder($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            tags
          }
          userErrors {
            message
            field
          }
        }
      }
    `,
      {
        variables: {
          input: {
            id: `gid://shopify/Order/${orderId}`,
            tags,
          },
        },
      }
    );

    const {
      data: { orderUpdate },
    } = await response.json();

    if (orderUpdate.userErrors?.length > 0) {
      return { errors: orderUpdate.userErrors };
    }

    return { order: orderUpdate.order };
  }
}
