
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Requisitions = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    category: '',
    quantity: '',
    unitPrice: '',
    totalBudget: '',
    priority: 'Medium',
    requiredDate: ''
  });

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const response = await axios.get('/requisitions');
      setRequisitions(response.data);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRequisition) {
        await axios.put(`/requisitions/${selectedRequisition.id}`, formData);
      } else {
        await axios.post('/requisitions', formData);
      }
      setShowModal(false);
      setSelectedRequisition(null);
      setFormData({
        title: '',
        description: '',
        department: '',
        category: '',
        quantity: '',
        unitPrice: '',
        totalBudget: '',
        priority: 'Medium',
        requiredDate: ''
      });
      fetchRequisitions();
    } catch (error) {
      console.error('Error saving requisition:', error);
    }
  };

  const handleEdit = (requisition) => {
    setSelectedRequisition(requisition);
    setFormData({
      title: requisition.title,
      description: requisition.description,
      department: requisition.department,
      category: requisition.category,
      quantity: requisition.quantity,
      unitPrice: requisition.unit_price,
      totalBudget: requisition.total_budget,
      priority: requisition.priority,
      requiredDate: requisition.required_date
    });
    setShowModal(true);
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/requisitions/${id}/approve`);
      fetchRequisitions();
    } catch (error) {
      console.error('Error approving requisition:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/requisitions/${id}/reject`);
      fetchRequisitions();
    } catch (error) {
      console.error('Error rejecting requisition:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Draft': 'bg-secondary',
      'Submitted': 'bg-info',
      'Under Review': 'bg-warning',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Completed': 'bg-primary'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      'Low': 'bg-success',
      'Medium': 'bg-warning',
      'High': 'bg-danger',
      'Critical': 'bg-dark'
    };
    return `badge ${priorityClasses[priority] || 'bg-secondary'}`;
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Requisitions</h1>
        {(user.role === 'Admin' || user.role === 'Procurement Manager' || user.role === 'Employee') && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>New Requisition
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Budget</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Required Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map(req => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.title}</strong>
                      {req.description && (
                        <div className="small text-muted">{req.description}</div>
                      )}
                    </td>
                    <td>{req.department}</td>
                    <td>{req.category}</td>
                    <td>{req.quantity}</td>
                    <td>${Number(req.total_budget).toLocaleString()}</td>
                    <td><span className={getPriorityBadge(req.priority)}>{req.priority}</span></td>
                    <td><span className={getStatusBadge(req.status)}>{req.status}</span></td>
                    <td>{new Date(req.required_date).toLocaleDateString()}</td>
                    <td>
                      {req.status === 'Draft' && req.requested_by === user.id && (
                        <button 
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEdit(req)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      )}
                      {(user.role === 'Admin' || user.role === 'Procurement Manager') && 
                       req.status === 'Submitted' && (
                        <>
                          <button 
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleApprove(req.id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(req.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedRequisition ? 'Edit Requisition' : 'New Requisition'}
                </h5>
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
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Department *</label>
                        <select
                          className="form-select"
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="IT">IT</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Finance">Finance</option>
                          <option value="HR">HR</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category *</label>
                        <select
                          className="form-select"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Technology">Technology</option>
                          <option value="Office Equipment">Office Equipment</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Services">Services</option>
                          <option value="Utilities">Utilities</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <select
                          className="form-select"
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Quantity *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Total Budget *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.totalBudget}
                          onChange={(e) => setFormData({...formData, totalBudget: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Required Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.requiredDate}
                      onChange={(e) => setFormData({...formData, requiredDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedRequisition ? 'Update' : 'Create'} Requisition
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

export default Requisitions;
