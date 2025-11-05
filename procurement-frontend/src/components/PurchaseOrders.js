
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get('/purchase-orders');
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`/purchase-orders/${id}/status`, { status });
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error updating PO status:', error);
    }
  };

  const viewDetails = async (id) => {
    try {
      const response = await axios.get(`/purchase-orders/${id}`);
      setSelectedPO(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching PO details:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Created': 'bg-secondary',
      'Sent': 'bg-info',
      'Acknowledged': 'bg-warning',
      'In Progress': 'bg-primary',
      'Delivered': 'bg-success',
      'Completed': 'bg-success',
      'Cancelled': 'bg-danger'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Purchase Orders</h1>
        {(user.role === 'Admin' || user.role === 'Procurement Manager') && (
          <button className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>Create PO
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Expected Delivery</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id}>
                    <td>
                      <strong>{po.po_number}</strong>
                    </td>
                    <td>{po.vendor_name}</td>
                    <td>${Number(po.final_amount).toLocaleString()}</td>
                    <td><span className={getStatusBadge(po.status)}>{po.status}</span></td>
                    <td>{po.expected_delivery && new Date(po.expected_delivery).toLocaleDateString()}</td>
                    <td>{new Date(po.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => viewDetails(po.id)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>

                      {/* Status update buttons based on user role */}
                      {user.role === 'Vendor' && po.status === 'Sent' && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusUpdate(po.id, 'Acknowledged')}
                        >
                          <i className="fas fa-check"></i> Acknowledge
                        </button>
                      )}

                      {(user.role === 'Admin' || user.role === 'Procurement Manager') && (
                        <div className="dropdown d-inline">
                          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Update Status
                          </button>
                          <ul className="dropdown-menu">
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(po.id, 'In Progress')}>In Progress</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(po.id, 'Delivered')}>Delivered</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(po.id, 'Completed')}>Completed</button></li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PO Details Modal */}
      {showModal && selectedPO && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Purchase Order Details - {selectedPO.po_number}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Vendor:</strong> {selectedPO.vendor_name}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong> 
                    <span className={`ms-2 ${getStatusBadge(selectedPO.status)}`}>
                      {selectedPO.status}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Total Amount:</strong> ${Number(selectedPO.total_amount).toLocaleString()}
                  </div>
                  <div className="col-md-6">
                    <strong>Tax:</strong> ${Number(selectedPO.tax_amount).toLocaleString()}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <strong>Final Amount:</strong> 
                    <span className="fs-4 text-success ms-2">
                      ${Number(selectedPO.final_amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedPO.delivery_address && (
                  <div className="mb-3">
                    <strong>Delivery Address:</strong>
                    <div>{selectedPO.delivery_address}</div>
                  </div>
                )}

                {selectedPO.items && selectedPO.items.length > 0 && (
                  <div className="mb-3">
                    <strong>Items:</strong>
                    <table className="table table-sm mt-2">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPO.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item_description}</td>
                            <td>{item.quantity}</td>
                            <td>${Number(item.unit_price).toFixed(2)}</td>
                            <td>${Number(item.total_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="fas fa-print me-2"></i>Print PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
