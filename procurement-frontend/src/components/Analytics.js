import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);


const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    vendorPerformance: [],
    cycleTime: null,
    savings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [vendorPerf, cycleTime, savings] = await Promise.all([
        axios.get('/analytics/vendor-performance'),
        axios.get('/analytics/cycle-time'),
        axios.get('/analytics/savings')
      ]);

      setAnalytics({
        vendorPerformance: vendorPerf.data,
        cycleTime: cycleTime.data,
        savings: savings.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
  }

  // Vendor Performance Chart
  const vendorPerformanceData = {
    labels: analytics.vendorPerformance.slice(0, 10).map(v => v.company_name),
    datasets: [{
      label: 'Overall Score',
      data: analytics.vendorPerformance.slice(0, 10).map(v => v.avg_overall),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  // Cycle Time Trend
  const cycleTimeData = {
    labels: analytics.cycleTime?.monthlyTrend?.map(item => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    ) || [],
    datasets: [{
      label: 'Average Cycle Time (Days)',
      data: analytics.cycleTime?.monthlyTrend?.map(item => item.avg_cycle_time) || [],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: true
    }]
  };

  // Savings by Category
  const savingsData = {
    labels: analytics.savings.map(s => s.category),
    datasets: [{
      data: analytics.savings.map(s => s.potential_savings),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  };

  // Top vendor radar chart data
  const topVendor = analytics.vendorPerformance[0];
  const radarData = topVendor ? {
    labels: ['Quality', 'Delivery', 'Cost', 'Compliance'],
    datasets: [{
      label: topVendor.company_name,
      data: [
        topVendor.avg_quality || 0,
        topVendor.avg_delivery || 0,
        topVendor.avg_cost || 0,
        topVendor.avg_compliance || 0
      ],
      fill: true,
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgb(54, 162, 235)',
      pointBackgroundColor: 'rgb(54, 162, 235)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(54, 162, 235)'
    }]
  } : null;
console.log("topvendor",analytics);
if(loading){
  return <div className="d-flex justify-content-center"><div className="spinner-border"></div></div>;
}
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Analytics & Reports</h1>
        <div>
          {/* <button className="btn btn-outline-primary me-2">
            <i className="fas fa-download me-1"></i>Export Report
          </button> */}
          {/* <button className="btn btn-primary">
            <i className="fas fa-sync-alt me-1"></i>Refresh
          </button> */}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Average Cycle Time</h5>
              <h2 className="text-primary">
                {( Number(analytics.cycleTime?.summary?.avg_requisition_to_po) || 0 ).toFixed(1) || 0} days
              </h2>
              <small className="text-muted">Requisition to PO</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total Vendors</h5>
              <h2 className="text-success">{analytics.vendorPerformance.length}</h2>
              <small className="text-muted">Active vendors</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Potential Savings</h5>
              <h2 className="text-warning">
                ${analytics.savings.reduce((sum, s) => sum + Number(s.potential_savings || 0), 0).toLocaleString()}
              </h2>
              <small className="text-muted">From competitive bidding</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Top Vendor Score</h5>
              <h2 className="text-info">
                {Number(analytics.vendorPerformance[0]?.avg_overall || 0).toFixed(1) }
              </h2>
              <small className="text-muted">Best performance</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Vendor Performance Comparison</h5>
            </div>
            <div className="card-body">
              <Bar 
                data={vendorPerformanceData} 
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Top 10 Vendors by Overall Performance Score'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Potential Savings by Category</h5>
            </div>
            <div className="card-body">
              <Pie 
                data={savingsData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Procurement Cycle Time Trend</h5>
            </div>
            <div className="card-body">
              <Line 
                data={cycleTimeData} 
                options={{
                  responsive: true,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Average Time from Requisition to Purchase Order (Days)'
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          {radarData && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Top Vendor Performance Profile</h5>
              </div>
              <div className="card-body">
                <Radar 
                  data={radarData} 
                  options={{
                    responsive: true,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title">Detailed Vendor Performance</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Quality</th>
                  <th>Delivery</th>
                  <th>Cost</th>
                  <th>Compliance</th>
                  <th>Overall</th>
                  <th>Orders</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {analytics.vendorPerformance.map(vendor => (
                  <tr key={vendor.id}>
                    <td><strong>{vendor.company_name}</strong></td>
                    <td>{vendor.category}</td>
                    <td>
                      <span className="badge bg-info">
                        {Number(vendor.avg_quality).toFixed(0) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        {Number(vendor.avg_delivery).toFixed(0) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning">
                        {Number(vendor.avg_cost).toFixed(0) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {Number(vendor.avg_compliance).toFixed(0) || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <strong className="text-success">
                        {Number(vendor.avg_overall || 0).toFixed(1) || 'N/A'}
                      </strong>
                    </td>
                    <td>{vendor.order_count}</td>
                    <td>${Number(vendor.total_amount).toLocaleString()}</td>
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

export default Analytics;
