import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  const { customer } = payload;
  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    await db.$transaction(async (trx) => {
      await trx.customer.upsert({
        where: {
          id: String(customer.id),
        },
        update: {
          fullName: customer.first_name + " " + customer.last_name,
          email: customer.email,
        },
        create: {
          id: String(customer.id),
          fullName: customer.first_name + " " + customer.last_name,
          email: customer.email,
        },
      });

      await trx.order.upsert({
        where: {
          id: String(payload.id),
        },
        update: {
          number: String(payload.order_number),
          customerId: String(customer.id),
          totalPrice: payload.total_price,
          paymentGateway: payload.payment_gateway_names[0],
          tags: payload.tags,
          shippingAddress: `${payload.shipping_address.address1}, ${payload.shipping_address.country}`,
        },
        create: {
          id: String(payload.id),
          number: String(payload.order_number),
          customerId: String(customer.id),
          totalPrice: payload.total_price,
          paymentGateway: payload.payment_gateway_names[0],
          tags: payload.tags,
          shippingAddress: `${payload.shipping_address.address1}, ${payload.shipping_address.country}`,
        },
      });
    });
    console.log("Transaction completed successfully");
    return new Response("ok");
  } catch (error) {
    console.error("Transaction failed", error);
    return new Response("Transaction failed", { status: 500 });
  }
};
