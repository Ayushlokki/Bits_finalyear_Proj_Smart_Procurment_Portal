
const express = require('express');
const { verifyToken, authenticatedUser, procurementManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', verifyToken, authenticatedUser, async (req, res) => {
  const pool = req.app.get('db');

  try {
    // Total counts
    const totalVendors = await pool.query('SELECT COUNT(*) FROM vendors WHERE status = $1', ['Approved']);
    const activeRequisitions = await pool.query('SELECT COUNT(*) FROM requisitions WHERE status IN ($1, $2)', ['Submitted', 'Under Review']);
    const pendingOrders = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE status IN ($1, $2)', ['Created', 'Sent']);
    const totalSpend = await pool.query('SELECT COALESCE(SUM(final_amount), 0) FROM purchase_orders WHERE status = $1', ['Created']);

    // Monthly spend data (last 6 months)
    const monthlySpend = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(final_amount), 0) as amount
      FROM purchase_orders 
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);

    // Top vendors by amount
    const topVendors = await pool.query(`
      SELECT 
        v.company_name,
        v.rating,
        COALESCE(SUM(po.final_amount), 0) as total_amount,
        COUNT(po.id) as order_count
      FROM vendors v
      LEFT JOIN purchase_orders po ON v.id = po.vendor_id
      WHERE v.status = 'Approved'
      GROUP BY v.id, v.company_name, v.rating
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    // Recent activities
    const recentActivities = await pool.query(`
      SELECT 'requisition' as type, title as description, created_at, status
      FROM requisitions
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      UNION ALL
      SELECT 'tender' as type, title as description, created_at, status
      FROM tenders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      UNION ALL
      SELECT 'purchase_order' as type, po_number as description, created_at, status
      FROM purchase_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Procurement by category
    const categorySpend = await pool.query(`
      SELECT 
        r.category,
        COALESCE(SUM(po.final_amount), 0) as amount,
        COUNT(po.id) as count
      FROM requisitions r
      LEFT JOIN purchase_orders po ON r.id = po.requisition_id
      GROUP BY r.category
      ORDER BY amount DESC
    `);

    res.json({
      summary: {
        totalVendors: parseInt(totalVendors.rows[0].count),
        activeRequisitions: parseInt(activeRequisitions.rows[0].count),
        pendingOrders: parseInt(pendingOrders.rows[0].count),
        totalSpend: parseFloat(totalSpend.rows[0].coalesce)
      },
      monthlySpend: monthlySpend.rows,
      topVendors: topVendors.rows,
      recentActivities: recentActivities.rows,
      categorySpend: categorySpend.rows
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard analytics' });
  }
});

// Get vendor performance analytics
router.get('/vendor-performance', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const vendorPerformance = await pool.query(`
      SELECT 
        v.id,
        v.company_name,
        v.category,
        v.rating,
        AVG(vp.quality_score) as avg_quality,
        AVG(vp.delivery_score) as avg_delivery,
        AVG(vp.cost_score) as avg_cost,
        AVG(vp.compliance_score) as avg_compliance,
        AVG(vp.overall_score) as avg_overall,
        COUNT(vp.id) as evaluation_count,
        COUNT(po.id) as order_count,
        COALESCE(SUM(po.final_amount), 0) as total_amount
      FROM vendors v
      LEFT JOIN vendor_performance vp ON v.id = vp.vendor_id
      LEFT JOIN purchase_orders po ON v.id = po.vendor_id
      WHERE v.status = 'Approved'
      GROUP BY v.id, v.company_name, v.category, v.rating
      HAVING COUNT(vp.id) > 0
      ORDER BY avg_overall DESC
    `);

    res.json(vendorPerformance.rows);

  } catch (error) {
    console.error('Get vendor performance analytics error:', error);
    res.status(500).json({ message: 'Server error fetching vendor performance analytics' });
  }
});

// Get procurement cycle time analytics
router.get('/cycle-time', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    const cycleTimeAnalytics = await pool.query(`
      SELECT 
        AVG(EXTRACT(day FROM (po.created_at - r.created_at))) as avg_requisition_to_po,
        AVG(EXTRACT(day FROM (po.updated_at - po.created_at))) as avg_po_processing,
        COUNT(r.id) as total_requisitions,
        COUNT(po.id) as total_pos
      FROM requisitions r
      LEFT JOIN purchase_orders po ON r.id = po.requisition_id
      WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
    `);

    // Monthly cycle time trend
    const monthlyTrend = await pool.query(`
      SELECT 
        DATE_TRUNC('month', r.created_at) as month,
        AVG(EXTRACT(day FROM (po.created_at - r.created_at))) as avg_cycle_time,
        COUNT(r.id) as requisition_count
      FROM requisitions r
      LEFT JOIN purchase_orders po ON r.id = po.requisition_id
      WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
        AND po.id IS NOT NULL
      GROUP BY DATE_TRUNC('month', r.created_at)
      ORDER BY month
    `);

    res.json({
      summary: cycleTimeAnalytics.rows[0],
      monthlyTrend: monthlyTrend.rows
    });

  } catch (error) {
    console.error('Get cycle time analytics error:', error);
    res.status(500).json({ message: 'Server error fetching cycle time analytics' });
  }
});

// Get savings analytics
router.get('/savings', verifyToken, procurementManagerOrAdmin, async (req, res) => {
  const pool = req.app.get('db');

  try {
    // Calculate estimated savings from bidding process
    const savingsAnalytics = await pool.query(`
      SELECT 
        t.category,
        COUNT(b.id) as total_bids,
        AVG(b.bid_amount) as avg_bid_amount,
        MIN(b.bid_amount) as lowest_bid,
        MAX(b.bid_amount) as highest_bid,
        (MAX(b.bid_amount) - MIN(b.bid_amount)) as potential_savings
      FROM tenders t
      JOIN bids b ON t.id = b.tender_id
      WHERE t.created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY t.category
      HAVING COUNT(b.id) > 1
      ORDER BY potential_savings DESC
    `);

    res.json(savingsAnalytics.rows);

  } catch (error) {
    console.error('Get savings analytics error:', error);
    res.status(500).json({ message: 'Server error fetching savings analytics' });
  }
});

module.exports = router;
