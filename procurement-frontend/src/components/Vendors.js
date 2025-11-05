
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    taxId: '',
    website: '',
    category: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedVendor) {
        await axios.put(`/vendors/${selectedVendor.id}`, formData);
      } else {
        await axios.post('/vendors', formData);
      }
      setShowModal(false);
      setSelectedVendor(null);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      taxId: '',
      website: '',
      category: ''
    });
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      companyName: vendor.company_name,
      contactPerson: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      country: vendor.country,
      postalCode: vendor.postal_code,
      taxId: vendor.tax_id,
      website: vendor.website,
      category: vendor.category
    });
    setShowModal(true);
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/vendors/${id}/approve`);
      fetchVendors();
    } catch (error) {
      console.error('Error approving vendor:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/vendors/${id}/reject`);
      fetchVendors();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Pending': 'bg-warning',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Suspended': 'bg-secondary'
    };
    return `badge ${statusClasses[status] || 'bg-secondary'}`;
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Vendor Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Register Vendor
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(vendor => (
                  <tr key={vendor.id}>
                    <td>
                      <strong>{vendor.company_name}</strong>
                      {vendor.city && (
                        <div className="small text-muted">{vendor.city}, {vendor.country}</div>
                      )}
                    </td>
                    <td>{vendor.contact_person}</td>
                    <td>{vendor.email}</td>
                    <td>{vendor.category}</td>
                    <td>
                      <span className="badge bg-warning">
                        {vendor.rating} ⭐
                      </span>
                    </td>
                    <td><span className={getStatusBadge(vendor.status)}>{vendor.status}</span></td>
                    <td>{new Date(vendor.registration_date).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(vendor)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {vendor.status === 'Pending' && (user.role === 'Admin' || user.role === 'Procurement Manager') && (
                        <>
                          <button 
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleApprove(vendor.id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(vendor.id)}
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
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedVendor ? 'Edit Vendor' : 'Register New Vendor'}
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
                        <label className="form-label">Company Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.companyName}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Contact Person *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Postal Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Tax ID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.taxId}
                          onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
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
                          <option value="Utilities">Utilities</option>
                          <option value="Services">Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedVendor ? 'Update' : 'Register'} Vendor
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

export default Vendors;
