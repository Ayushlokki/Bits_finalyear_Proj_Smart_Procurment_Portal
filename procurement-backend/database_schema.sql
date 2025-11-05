
-- Smart Procurement Portal Database Schema
-- PostgreSQL Database Setup

-- Create database
-- CREATE DATABASE procurement_db;

-- Use the database
-- \c procurement_db;

-- Users table with role-based access
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Admin', 'Procurement Manager', 'Employee', 'Vendor')) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    website VARCHAR(255),
    category VARCHAR(100),
    rating DECIMAL(2,1) DEFAULT 0.0,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Suspended')) DEFAULT 'Pending',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approved_date TIMESTAMP
);

-- Requisitions table
CREATE TABLE requisitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2),
    total_budget DECIMAL(15,2) NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status VARCHAR(30) CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed')) DEFAULT 'Draft',
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    required_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenders table
CREATE TABLE tenders (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES requisitions(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    budget DECIMAL(15,2),
    closing_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Active', 'Closed', 'Awarded', 'Cancelled')) DEFAULT 'Active',
    terms_conditions TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids table
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER REFERENCES tenders(id),
    vendor_id INTEGER REFERENCES vendors(id),
    bid_amount DECIMAL(15,2) NOT NULL,
    delivery_time INTEGER, -- in days
    specifications TEXT,
    attachments TEXT[], -- array of file paths
    status VARCHAR(20) CHECK (status IN ('Submitted', 'Under Review', 'Accepted', 'Rejected')) DEFAULT 'Submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT
);

-- Purchase Orders table
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    requisition_id INTEGER REFERENCES requisitions(id),
    vendor_id INTEGER REFERENCES vendors(id),
    bid_id INTEGER REFERENCES bids(id),
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    delivery_address TEXT,
    expected_delivery DATE,
    status VARCHAR(30) CHECK (status IN ('Created', 'Sent', 'Acknowledged', 'In Progress', 'Delivered', 'Completed', 'Cancelled')) DEFAULT 'Created',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items table
CREATE TABLE po_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id),
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id),
    vendor_id INTEGER REFERENCES vendors(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Received', 'Under Review', 'Approved', 'Paid', 'Disputed', 'Rejected')) DEFAULT 'Received',
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Performance table
CREATE TABLE vendor_performance (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id),
    po_id INTEGER REFERENCES purchase_orders(id),
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 100),
    delivery_score INTEGER CHECK (delivery_score BETWEEN 1 AND 100),
    cost_score INTEGER CHECK (cost_score BETWEEN 1 AND 100),
    compliance_score INTEGER CHECK (compliance_score BETWEEN 1 AND 100),
    overall_score DECIMAL(5,2),
    evaluation_date DATE DEFAULT CURRENT_DATE,
    evaluated_by INTEGER REFERENCES users(id),
    comments TEXT
);

-- Audit Trail table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_department ON requisitions(department);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_bids_tender_id ON bids(tender_id);
CREATE INDEX idx_bids_vendor_id ON bids(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_vendor_performance_vendor_id ON vendor_performance(vendor_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Insert sample data
-- Admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, department) VALUES
('admin', 'admin@procurement.com', '$2a$10$example_hash', 'System', 'Administrator', 'Admin', 'IT'),
('pmgr001', 'pm1@procurement.com', '$2a$10$example_hash', 'Sarah', 'Johnson', 'Procurement Manager', 'Procurement'),
('emp001', 'emp1@procurement.com', '$2a$10$example_hash', 'Mike', 'Brown', 'Employee', 'Marketing'),
('vendor001', 'vendor1@techsolutions.com', '$2a$10$example_hash', 'Tech', 'Solutions', 'Vendor', 'External');

-- Sample vendors
INSERT INTO vendors (company_name, contact_person, email, phone, address, city, state, country, category, rating, status) VALUES
('Tech Solutions Inc', 'John Doe', 'contact@techsolutions.com', '+1-234-567-8900', '123 Tech Street', 'San Francisco', 'CA', 'USA', 'Technology', 4.5, 'Approved'),
('Office Supplies Co', 'Jane Smith', 'info@officesupplies.com', '+1-234-567-8901', '456 Supply Ave', 'New York', 'NY', 'USA', 'Office Equipment', 4.2, 'Approved'),
('Green Energy Ltd', 'Bob Wilson', 'contact@greenenergy.com', '+1-234-567-8902', '789 Green Blvd', 'Austin', 'TX', 'USA', 'Utilities', 4.7, 'Approved');
