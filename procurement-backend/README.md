# Smart Procurement Portal - Backend API

A Node.js/Express backend API for the Smart Procurement Portal with PostgreSQL database.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Multi-role user system (Admin, Procurement Manager, Employee, Vendor)
- **Vendor Management**: Complete vendor lifecycle management
- **Procurement Workflow**: Requisitions → Tenders → Bids → Purchase Orders → Invoices
- **Analytics**: Comprehensive reporting and vendor performance metrics
- **Audit Trail**: Complete tracking of all system activities
- **Notifications**: Real-time notifications for important events

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.template .env
```

3. Update environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=procurement_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
```

4. Create PostgreSQL database:
```sql
CREATE DATABASE procurement_db;
```

5. Run database schema:
```bash
psql -U postgres -d procurement_db -f database_schema.sql
```

## Running the Application

1. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Vendors
- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/:id` - Get vendor by ID
- `PUT /api/vendors/:id` - Update vendor
- `PUT /api/vendors/:id/approve` - Approve vendor
- `PUT /api/vendors/:id/reject` - Reject vendor

### Requisitions
- `GET /api/requisitions` - Get all requisitions
- `POST /api/requisitions` - Create new requisition
- `GET /api/requisitions/:id` - Get requisition by ID
- `PUT /api/requisitions/:id` - Update requisition
- `PUT /api/requisitions/:id/approve` - Approve requisition
- `PUT /api/requisitions/:id/reject` - Reject requisition

### Tenders
- `GET /api/tenders` - Get all tenders
- `POST /api/tenders` - Create new tender
- `GET /api/tenders/:id` - Get tender by ID
- `PUT /api/tenders/:id` - Update tender
- `PUT /api/tenders/:id/close` - Close tender

### Bids
- `GET /api/bids` - Get all bids
- `POST /api/bids` - Submit new bid
- `GET /api/bids/:id` - Get bid by ID
- `PUT /api/bids/:id` - Update bid
- `PUT /api/bids/:id/accept` - Accept bid
- `PUT /api/bids/:id/reject` - Reject bid

### Purchase Orders
- `GET /api/purchase-orders` - Get all purchase orders
- `POST /api/purchase-orders` - Create new purchase order
- `GET /api/purchase-orders/:id` - Get purchase order by ID
- `PUT /api/purchase-orders/:id/status` - Update PO status

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Submit new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id/status` - Update invoice status

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/vendor-performance` - Get vendor performance data
- `GET /api/analytics/cycle-time` - Get procurement cycle time data
- `GET /api/analytics/savings` - Get savings analytics

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and roles
- `vendors` - Vendor information
- `requisitions` - Purchase requisitions
- `tenders` - Tender/RFP documents
- `bids` - Vendor bids
- `purchase_orders` - Purchase orders
- `invoices` - Vendor invoices
- `vendor_performance` - Performance metrics
- `audit_logs` - System audit trail
- `notifications` - User notifications

## Security Features

- JWT authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation
- SQL injection prevention
- CORS protection

## Technology Stack

- Node.js & Express.js
- PostgreSQL database
- JSON Web Tokens (JWT)
- bcryptjs for password hashing
- Joi for validation

## License

MIT License
