import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IndexTable,
  Card,
  useIndexResourceState,
  Text,
  Layout,
  Page,
  Tag,
  Combobox,
  Listbox,
  EmptySearchResult,
  AutoSelection,
  BlockStack,
  InlineStack,
  Modal,
} from "@shopify/polaris";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { authenticate } from "../shopify.server";

interface Customer {
  fullName: string;
}
interface Order {
  id: string;
  number: string;
  createdAt: string;
  totalPrice: number;
  shippingAddress: string;
  tags: string;
  paymentGateway: string;
  Customer: Customer;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const orders = await db.order.findMany({
    include: {
      Customer: true,
    },
  });

  const formattedOrders = orders.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt).toLocaleString(), // Format the date
  }));

  return Response.json(formattedOrders);
};

export default function SimpleIndexTableExample() {
  const fetcher = useFetcher();
  const orders = useLoaderData<Order[]>();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  console.log("savedTags", savedTags);

  console.log("selectedTags", selectedTags);

  const [value, setValue] = useState("");
  console.log("value", value);
  const [suggestion, setSuggestion] = useState("");

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (selectedOrder && selectedOrder.tags) {
      setSavedTags(selectedOrder.tags.split(", "));
      setSelectedTags(selectedOrder.tags.split(", "));
    } else {
      setSavedTags([]);
      setSelectedTags([]);
    }
  }, [selectedOrder]);

  const onSaveClicked = useCallback(async () => {
    if (!selectedOrder) return;

    console.log("save clicked with selected tags", selectedTags);
    setIsModalOpen(false);

    const query = `
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
    `

    const variables = {
      input: {
        id: `gid://shopify/Order/${selectedOrder.id}`,
        tags: selectedTags.join(", "),
      },
    }

    const response = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      },
    );
  }, [selectedTags]);

  const handleActiveOptionChange = useCallback(
    (activeOption: string) => {
      const activeOptionIsAction = activeOption === value;

      if (!activeOptionIsAction && !selectedTags.includes(activeOption)) {
        setSuggestion(activeOption);
      } else {
        setSuggestion("");
      }
    },
    [value, selectedTags],
  );
  const updateSelection = useCallback(
    (selected: string) => {
      const nextSelectedTags = new Set([...selectedTags]);

      if (nextSelectedTags.has(selected)) {
        nextSelectedTags.delete(selected);
      } else {
        nextSelectedTags.add(selected);
      }
      setSelectedTags([...nextSelectedTags]);
      setValue("");
      setSuggestion("");
    },
    [selectedTags],
  );

  const removeTag = useCallback(
    (tag: string) => () => {
      updateSelection(tag);
    },
    [updateSelection],
  );

  const getAllTags = useCallback(() => {
    return [...new Set([...savedTags, ...selectedTags].sort())];
  }, [selectedTags]);

  const formatOptionText = useCallback(
    (option: string) => {
      const trimValue = value.trim().toLocaleLowerCase();
      const matchIndex = option.toLocaleLowerCase().indexOf(trimValue);

      if (!value || matchIndex === -1) return option;

      const start = option.slice(0, matchIndex);
      const highlight = option.slice(matchIndex, matchIndex + trimValue.length);
      const end = option.slice(matchIndex + trimValue.length, option.length);

      return (
        <p>
          {start}
          <Text fontWeight="bold" as="span">
            {highlight}
          </Text>
          {end}
        </p>
      );
    },
    [value],
  );

  const escapeSpecialRegExCharacters = useCallback(
    (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    [],
  );

  const options = useMemo(() => {
    let list;
    const allTags = getAllTags();
    const filterRegex = new RegExp(escapeSpecialRegExCharacters(value), "i");

    if (value) {
      list = allTags.filter((tag) => tag.match(filterRegex));
    } else {
      list = allTags;
    }

    return [...list];
  }, [value, getAllTags, escapeSpecialRegExCharacters]);

  const verticalContentMarkup =
    selectedTags.length > 0 ? (
      <InlineStack gap="200">
        {selectedTags.map((tag) => (
          <Tag key={`option-${tag}`} onRemove={removeTag(tag)}>
            {tag}
          </Tag>
        ))}
      </InlineStack>
    ) : null;

  const optionMarkup =
    options.length > 0
      ? options.map((option) => {
          return (
            <Listbox.Option
              key={option}
              value={option}
              selected={selectedTags.includes(option)}
              accessibilityLabel={option}
            >
              <Listbox.TextOption selected={selectedTags.includes(option)}>
                {formatOptionText(option)}
              </Listbox.TextOption>
            </Listbox.Option>
          );
        })
      : null;

  const noResults = value && !getAllTags().includes(value);

  const actionMarkup = noResults ? (
    <Listbox.Action value={value}>{`Add "${value}"`}</Listbox.Action>
  ) : null;

  const emptyStateMarkup = optionMarkup ? null : (
    <EmptySearchResult
      title=""
      description={`No tags found matching "${value}"`}
    />
  );

  const listboxMarkup =
    optionMarkup || actionMarkup || emptyStateMarkup ? (
      <Listbox
        autoSelection={AutoSelection.None}
        onSelect={updateSelection}
        onActiveOptionChange={handleActiveOptionChange}
      >
        {actionMarkup}
        {optionMarkup}
      </Listbox>
    ) : null;

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
      onClick={() => handleRowClick(order)}
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

      {selectedOrder && (
        <Modal
          open={isModalOpen}
          title={`Order #${selectedOrder.number}`}
          onClose={() => setIsModalOpen(false)}
          secondaryActions={[
            {
              content: "Close",
              onAction: () => setIsModalOpen(false),
            },
          ]}
          primaryAction={{
            content: "Save",
            onAction: () => onSaveClicked(),
          }}
        >
          <Modal.Section>
            <BlockStack gap="500">
              <Text variant="bodyMd" as={"span"}>
                <strong>Customer:</strong> {selectedOrder.Customer.fullName}
              </Text>
              <Text variant="bodyMd" as={"span"}>
                <strong>Date:</strong> {selectedOrder.createdAt}
              </Text>
              <Text variant="bodyMd" as={"span"}>
                <strong>Total:</strong> {selectedOrder.totalPrice}
              </Text>
              <Text variant="bodyMd" as={"span"}>
                <strong>Shipping Address:</strong>{" "}
                {selectedOrder.shippingAddress}
              </Text>
              <Text variant="bodyMd" as={"span"}>
                <strong>Payment Gateway:</strong> {selectedOrder.paymentGateway}
              </Text>
              <div>
                <strong>Tags:</strong>
                <Combobox
                  allowMultiple
                  activator={
                    <Combobox.TextField
                      autoComplete="off"
                      label="Search tags"
                      labelHidden
                      value={value}
                      suggestion={suggestion}
                      placeholder="Search tags"
                      verticalContent={verticalContentMarkup}
                      onChange={setValue}
                    />
                  }
                >
                  {listboxMarkup}
                </Combobox>
              </div>
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
