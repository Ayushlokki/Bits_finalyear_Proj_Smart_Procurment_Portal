
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    poId: '',
    invoiceDate: '',
    dueDate: '',
    subtotal: '',
    taxAmount: '',
    totalAmount: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/invoices', formData);
      setShowModal(false);
      setFormData({
        invoiceNumber: '',
        poId: '',
        invoiceDate: '',
        dueDate: '',
        subtotal: '',
        taxAmount: '',
        totalAmount: '',
        notes: ''
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleStatusUpdate = async (id, status, notes = '') => {
    try {
      await axios.put(`/invoices/${id}/status`, { status, notes });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Received': 'bg-info',
      'Under Review': 'bg-warning',
      'Approved': 'bg-success',
      'Paid': 'bg-primary',
      'Disputed': 'bg-danger',
      'Rejected': 'bg-danger'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Invoice Management</h1>
        {user.role === 'Vendor' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>Submit Invoice
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoice_number}</strong></td>
                    <td>{invoice.po_number}</td>
                    <td>{invoice.vendor_name}</td>
                    <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                    <td>{invoice.due_date && new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td>${Number(invoice.total_amount).toLocaleString()}</td>
                    <td><span className={getStatusBadge(invoice.status)}>{invoice.status}</span></td>
                    <td>
                      {(user.role === 'Admin' || user.role === 'Procurement Manager') && (
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Actions
                          </button>
                          <ul className="dropdown-menu">
                            {invoice.status === 'Received' && (
                              <>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(invoice.id, 'Under Review')}>Review</button></li>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(invoice.id, 'Rejected')}>Reject</button></li>
                              </>
                            )}
                            {invoice.status === 'Under Review' && (
                              <>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(invoice.id, 'Approved')}>Approve</button></li>
                                <li><button className="dropdown-item" onClick={() => handleStatusUpdate(invoice.id, 'Disputed')}>Dispute</button></li>
                              </>
                            )}
                            {invoice.status === 'Approved' && (
                              <li><button className="dropdown-item" onClick={() => handleStatusUpdate(invoice.id, 'Paid')}>Mark as Paid</button></li>
                            )}
                          </ul>
                        </div>
                      )}
                      <button className="btn btn-sm btn-outline-info ms-2">
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Submission Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit New Invoice</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Invoice Number *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Purchase Order *</label>
                        <select
                          className="form-select"
                          value={formData.poId}
                          onChange={(e) => setFormData({...formData, poId: e.target.value})}
                          required
                        >
                          <option value="">Select PO</option>
                          {/* PO options would be populated from API */}
                          <option value="1">PO-202509-0001</option>
                          <option value="2">PO-202509-0002</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Invoice Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.invoiceDate}
                          onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Subtotal *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.subtotal}
                          onChange={(e) => setFormData({...formData, subtotal: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Tax Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.taxAmount}
                          onChange={(e) => setFormData({...formData, taxAmount: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Total Amount *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
