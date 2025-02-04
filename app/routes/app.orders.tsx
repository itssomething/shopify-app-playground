import {
  IndexTable,
  Card,
  useIndexResourceState,
  Text,
  Badge,
  Layout,
  Page,
} from "@shopify/polaris";
import React from "react";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const orders = await db.order.findMany({
    include: {
      Customer: true,
    }
  });

  const formattedOrders = orders.map(order => ({
    ...order,
    createdAt: new Date(order.createdAt).toLocaleString(), // Format the date
  }));

  return Response.json(formattedOrders);
};

export default function SimpleIndexTableExample() {
  const orders: any[] = useLoaderData<typeof loader>();

  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(orders);

  const rowMarkup = orders.map((order, index) => (
    <IndexTable.Row
      id={order.id}
      key={order.id}
      selected={selectedResources.includes(order.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          #{order.number}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.createdAt}</IndexTable.Cell>
      <IndexTable.Cell>{order.Customer.fullName}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {order.totalPrice}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.shippingAddress}</IndexTable.Cell>
      <IndexTable.Cell>{order.tags}</IndexTable.Cell>
      <IndexTable.Cell>{order.paymentGateway}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={orders.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Order" },
                { title: "Date" },
                { title: "Customer" },
                { title: "Total", alignment: "end" },
                { title: "Shipping Address" },
                { title: "Tags" },
                { title: "Payment Gateway" },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
