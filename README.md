# App Playground 2

A Shopify app built with Remix, TypeScript, and Prisma.

## Database Schema

The application uses SQLite as the database with the following schema:

### Session
Stores user session data for Shopify authentication:
```prisma
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)
}
```

### Order
Stores order information:
```prisma
model Order {
  id              String   @id
  number          String
  totalPrice      String
  paymentGateway  String
  tags            String
  shippingAddress String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  Customer        Customer @relation(fields: [customerId], references: [id])
  customerId      String
}
```

### Customer
Stores customer information:
```prisma
model Customer {
  id        String   @id
  fullName  String
  email     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```

## FAQ on the schema
Q: Why store tags as string

A: We could have a separate tags table and use n-n relation with Order. But I think with the current requirement, using string is the simplest way to represent tags

Q: Why seperate Customer table?

A: Currently a customer may have many orders, so a saperate table is more intuitive.

## Prerequisites

- Node.js version ^18.20 || ^20.10 || >=21.0.0
- npm package manager
- Shopify Partner account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app-playground-2
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run setup
```
This command will:
- Generate Prisma client
- Run database migrations

## Development

1. Link your app with Shopify:
```bash
npm run config:link
```

2. Start the development server:
```bash
npm run dev
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Shopify:
```bash
npm run deploy
```

## Docker Support

To run the application using Docker:

1. Build the Docker image:
```bash
docker build -t app-playground-2 .
```

2. Run the container:
```bash
docker run -p 3000:3000 app-playground-2
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run setup` - Set up database and generate Prisma client
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Shopify
- `npm run config:link` - Link app with Shopify
- `npm run config:use` - Use specific app configuration
- `npm run env` - Manage environment variables
