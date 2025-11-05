
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const monthlySpendData = {
    
    labels: analytics?.monthlySpend.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Monthly Spend',
        data: analytics?.monthlySpend.map(item => item.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  };
  

  const categorySpendData = {
    labels: analytics?.categorySpend.map(item => item.category) || [],
    datasets: [
      {
        data: analytics?.categorySpend.map(item => item.amount) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };
console.log("data",monthlySpendData);
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <span className="badge bg-primary">{user.role}</span>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Vendors</h6>
                  <h2>{analytics?.summary.totalVendors || 0}</h2>
                </div>
                <i className="fas fa-building fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Active Requisitions</h6>
                  <h2>{analytics?.summary.activeRequisitions || 0}</h2>
                </div>
                <i className="fas fa-file-alt fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Pending Orders</h6>
                  <h2>{analytics?.summary.pendingOrders || 0}</h2>
                </div>
                <i className="fas fa-shopping-cart fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Spend</h6>
                  <h2>${(analytics?.summary.totalSpend || 0).toLocaleString()}</h2>
                </div>
                <i className="fas fa-dollar-sign fa-2x"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Monthly Spend Trend</h5>
            </div>
            <div className="card-body">
              <Line data={monthlySpendData} options={{ responsive: true }} />
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Spend by Category</h5>
            </div>
            <div className="card-body">
              <Pie data={categorySpendData} options={{ responsive: true }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Vendors and Recent Activities */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Top Vendors</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Rating</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.topVendors.slice(0, 5).map((vendor, index) => (
                      <tr key={index}>
                        <td>{vendor.company_name}</td>
                        <td>
                          <span className="badge bg-warning">
                            {vendor.rating} ⭐
                          </span>
                        </td>
                        <td>${Number(vendor.total_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Recent Activities</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {analytics?.recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="list-group-item px-0">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{activity.description}</strong>
                        <br />
                        <small className="text-muted">
                          {activity.type} • {activity.status}
                        </small>
                      </div>
                      <small className="text-muted">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
