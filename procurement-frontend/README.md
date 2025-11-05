# Smart Procurement Portal - Frontend

A React-based frontend application for the Smart Procurement Portal with Vendor Analytics.

## Features

- **Dashboard**: Real-time analytics and KPI monitoring
- **Requisition Management**: Create and track procurement requisitions
- **Vendor Management**: Register and manage supplier information
- **Bidding & Tendering**: Handle competitive bidding processes
- **Purchase Orders**: Create and track purchase orders
- **Invoice Management**: Process vendor invoices
- **Analytics**: Comprehensive reporting and vendor performance analysis
- **Role-based Access**: Support for Admin, Procurement Manager, Employee, and Vendor roles

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on port 5000

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

## Demo Accounts

The application includes demo accounts for testing:

- **Admin**: username: `admin`, password: `demo123`
- **Procurement Manager**: username: `pmgr001`, password: `demo123`
- **Employee**: username: `emp001`, password: `demo123`
- **Vendor**: username: `vendor001`, password: `demo123`

## Build for Production

```bash
npm run build
```

## Technology Stack

- React 18
- React Router DOM
- Axios for API calls
- Bootstrap 5 for UI
- Chart.js for analytics
- Font Awesome for icons

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.js     # Main dashboard
│   ├── Requisitions.js  # Requisition management
│   ├── Vendors.js       # Vendor management
│   ├── Tenders.js       # Tender management
│   ├── Bids.js          # Bid management
│   ├── PurchaseOrders.js # Purchase order management
│   ├── Invoices.js      # Invoice management
│   ├── Analytics.js     # Analytics and reports
│   ├── Login.js         # Authentication
│   ├── Layout.js        # Main layout
│   ├── Header.js        # Header component
│   └── Sidebar.js       # Navigation sidebar
├── context/
│   └── AuthContext.js   # Authentication context
├── App.js               # Main application
└── index.js             # Entry point
```

## License

MIT License
