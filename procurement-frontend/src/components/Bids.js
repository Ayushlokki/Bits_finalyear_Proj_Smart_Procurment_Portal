
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Bids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get('/bids');
      setBids(response.data);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await axios.put(`/bids/${id}/accept`);
      fetchBids();
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/bids/${id}/reject`);
      fetchBids();
    } catch (error) {
      console.error('Error rejecting bid:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Submitted': 'bg-info',
      'Under Review': 'bg-warning',
      'Accepted': 'bg-success',
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
        <h1>Bids Management</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Tender</th>
                  <th>Vendor</th>
                  <th>Bid Amount</th>
                  <th>Delivery Time</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.id}>
                    <td>
                      <strong>{bid.tender_title}</strong>
                    </td>
                    <td>{bid.vendor_name}</td>
                    <td>${Number(bid.bid_amount).toLocaleString()}</td>
                    <td>{bid.delivery_time} days</td>
                    <td><span className={getStatusBadge(bid.status)}>{bid.status}</span></td>
                    <td>{new Date(bid.submitted_at).toLocaleDateString()}</td>
                    <td>
                      {(user.role === 'Admin' || user.role === 'Procurement Manager') && 
                       bid.status === 'Submitted' && (
                        <>
                          <button 
                            className="btn btn-sm btn-success me-1"
                            onClick={() => handleAccept(bid.id)}
                          >
                            <i className="fas fa-check"></i> Accept
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(bid.id)}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </>
                      )}
                      {bid.specifications && (
                        <button className="btn btn-sm btn-outline-info ms-2">
                          <i className="fas fa-eye"></i> Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bids;
