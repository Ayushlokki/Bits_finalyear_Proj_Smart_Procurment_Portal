
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RecommendedVendors from './RecommendedVendors';
import { useNavigate } from 'react-router-dom';

const Tenders = () => {
  const { user } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    closingDate: '',
    termsConditions: '',
    requisitionId: ''
  });

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await axios.get('/tenders');
      setTenders(response.data);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tenders', formData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        budget: '',
        closingDate: '',
        termsConditions: '',
        requisitionId: ''
      });
      fetchTenders();
    } catch (error) {
      console.error('Error creating tender:', error);
    }
  };

  const handleClose = async (id) => {
    try {
      await axios.put(`/tenders/${id}/close`);
      fetchTenders();
    } catch (error) {
      console.error('Error closing tender:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'bg-success',
      'Closed': 'bg-warning',
      'Awarded': 'bg-primary',
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
        <h1>Tenders</h1>
        

        {(user.role === 'Admin' || user.role === 'Procurement Manager') && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>Create Tender
          </button>
        )}
      </div>

      <div className="row">
        {tenders.map(tender => (
          <div key={tender.id} className="col-md-6 col-lg-4 mb-4">
            
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title">{tender.title}</h5>
                  <span className={getStatusBadge(tender.status)}>{tender.status}</span>
                </div>
                <p className="card-text text-muted">{tender.description}</p>
                <div className="mb-2">
                  <small className="text-muted">Category: </small>
                  <span className="badge bg-info">{tender.category}</span>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Budget: </small>
                  <strong>${Number(tender.budget).toLocaleString()}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Closing Date: </small>
                  <span>{new Date(tender.closing_date).toLocaleDateString()}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted">Bids Received: </small>
                  <span className="badge bg-secondary">{tender.bid_count || 0}</span>
                </div>
                {(tender.status === 'Active' ) && 
                <RecommendedVendors tenderId={tender.id} />
}
              </div>
              <div className="card-footer">
                {user.role === 'Vendor' && tender.status === 'Active' && (
                  <button className="btn btn-success btn-sm">
                    <i className="fas fa-hand-paper me-1"></i>Submit Bid
                  </button>
                )}
                
                {(user.role === 'Admin' || user.role === 'Procurement Manager') && (
                  <>
                    <button className="btn btn-outline-primary btn-sm me-2" onClick={()=>navigate("/Bids")}>
                      <i className="fas fa-eye me-1"></i>View Bids
                    </button>
                    {tender.status === 'Active' && (
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleClose(tender.id)}
                      >
                        <i className="fas fa-times me-1"></i>Close
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Tender</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
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

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
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
                          <option value="Services">Services</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Manufacturing">Manufacturing</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Budget</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Closing Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.closingDate}
                      onChange={(e) => setFormData({...formData, closingDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Terms and Conditions</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({...formData, termsConditions: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Tender
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

export default Tenders;
