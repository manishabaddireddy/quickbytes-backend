# QuickBytes Backend API

REST API backend for the QuickBytes food delivery app. Built with Node.js, Express, PostgreSQL, and Drizzle ORM.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js + TypeScript | Runtime & type safety |
| Express 5 | HTTP server & routing |
| PostgreSQL | Database |
| Drizzle ORM | Type-safe database queries |
| drizzle-zod | Auto-generates Zod schemas from DB tables |
| Zod | Request body validation |

## Folder Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── index.ts          # DB connection
│   │   └── schema/
│   │       ├── index.ts      # Exports all tables
│   │       ├── users.ts
│   │       ├── restaurants.ts
│   │       ├── menuItems.ts
│   │       ├── orders.ts
│   │       └── orderItems.ts
│   ├── routes/
│   │   ├── users.ts
│   │   ├── restaurants.ts
│   │   ├── menuItems.ts
│   │   └── orders.ts
│   ├── app.ts                # Express setup
│   └── index.ts              # Entry point
├── .env.example
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your PostgreSQL connection string
```

### 3. Push database schema
```bash
npm run db:push
```

### 4. Start the development server
```bash
npm run dev
```

The API will run at `http://localhost:3000`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET | /api/users | List all users |
| POST | /api/users | Register a user |
| GET | /api/users/:id | Get user by ID |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| GET | /api/restaurants | List all restaurants |
| POST | /api/restaurants | Create restaurant |
| GET | /api/restaurants/:id | Get restaurant |
| PUT | /api/restaurants/:id | Update restaurant |
| DELETE | /api/restaurants/:id | Delete restaurant |
| GET | /api/restaurants/:id/menu-items | List menu items |
| POST | /api/restaurants/:id/menu-items | Add menu item |
| GET | /api/menu-items/:id | Get menu item |
| PUT | /api/menu-items/:id | Update menu item |
| DELETE | /api/menu-items/:id | Delete menu item |
| GET | /api/orders | List orders (?userId= filter) |
| POST | /api/orders | Place an order |
| GET | /api/orders/:id | Get order with items |
| PATCH | /api/orders/:id/status | Update order status |
| DELETE | /api/orders/:id | Delete order |
| GET | /api/orders/:id/items | List items in order |

## Database Tables

- **users** — id, name, email, phone, address
- **restaurants** — id, name, address, cuisine, rating, isOpen
- **menu_items** — id, restaurantId, name, price, category, imageUrl, isAvailable
- **orders** — id, userId, restaurantId, status, totalAmount, deliveryAddress
- **order_items** — id, orderId, menuItemId, quantity, unitPrice
