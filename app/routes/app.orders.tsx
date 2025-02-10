import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseGid } from "../utils/gid";
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
  Button,
} from "@shopify/polaris";
import { CsvService } from "../services/csv.service";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ActionResponse, Order } from "../types/order.types";
import { OrderServer } from "../services/order.server";
import { OrderUtils } from "../services/order.utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const orders = await OrderServer.getAllOrders();
  return Response.json(orders);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const orderId = formData.get("orderId") as string;
  const tags = formData.get("tags") as string;

  const result = await OrderServer.updateOrderTags(admin, orderId, tags);

  if (result.errors) {
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  return Response.json({ order: result.order });
};

export default function SimpleIndexTableExample() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData<Order[]>();
  const [orders, setOrders] = useState<Order[]>(loaderData);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setValue("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (selectedOrder && selectedOrder.tags) {
      const tags = OrderUtils.splitTagString(selectedOrder.tags);
      setSavedTags(tags);
      setSelectedTags(tags);
    } else {
      setSavedTags([]);
      setSelectedTags([]);
    }
  }, [selectedOrder]);

  useEffect(() => {
    const response = fetcher.data as ActionResponse | undefined;

    if (response) {
      if (response.errors) {
        console.error("Failed to update tags:", response.errors);
      } else if (response.order) {
        const { order } = response;
        if (order && order.id && order.tags) {
          const { id: parsedId } = parseGid(order.id);

          const newOrders = orders.map((existingOrder) => {
            if (existingOrder.id === parsedId) {
              return {
                ...existingOrder,
                tags: OrderUtils.joinTags(order.tags),
              };
            }
            return existingOrder;
          });

          setOrders(newOrders);
          setIsModalOpen(false);
        }
      }
    }
  }, [fetcher.data]);

  const onSaveClicked = useCallback(() => {
    if (!selectedOrder) return;

    fetcher.submit(
      {
        orderId: selectedOrder.id,
        tags: OrderUtils.joinTags(selectedTags),
      },
      { method: "post" },
    );
  }, [selectedOrder, selectedTags, fetcher]);

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
    return OrderUtils.getUniqueSortedTags([...savedTags, ...selectedTags]);
  }, [savedTags, selectedTags]);

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

  const options = useMemo(() => {
    return OrderUtils.formatTagOptions(value, getAllTags());
  }, [value, getAllTags]);

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
    useIndexResourceState<Order>(orders);

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

  const handleDownload = useCallback(() => {
    const csvData = orders.map((order) => ({
      "Order Number": order.number,
      Date: order.createdAt,
      Customer: order.Customer.fullName,
      Total: order.totalPrice,
      "Shipping Address": order.shippingAddress,
      Tags: order.tags,
      "Payment Gateway": order.paymentGateway,
    }));

    CsvService.downloadAsCSV(csvData, "orders.csv");
  }, [orders]);

  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack align="end">
              <Button onClick={handleDownload}>Download Orders</Button>
            </InlineStack>
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
          </BlockStack>
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
