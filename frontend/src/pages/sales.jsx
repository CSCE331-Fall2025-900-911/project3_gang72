// pages/sales.jsx
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Sales() {
    const { sales } = useOutletContext();

    // Report data states
    const [startDate, setStartDate] = useState('2025-01-01');
    const [endDate, setEndDate] = useState('2025-02-01');
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [avgOrderValue, setAvgOrderValue] = useState(0);
    const [peakHours, setPeakHours] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [ordersByHour, setOrdersByHour] = useState([]);
    const [orderVolume, setOrderVolume] = useState([]);
    const [revenueChart, setRevenueChart] = useState([]);
    const [aovByCategory, setAovByCategory] = useState([]);
    const [showReports, setShowReports] = useState(true);

    // Fetch all report data
    const fetchReportData = () => {
        const params = new URLSearchParams({ startDate, endDate });

        // Fetch summary stats
        fetch(`/api/reports/revenue?${params}`)
            .then(res => res.json())
            .then(data => setTotalRevenue(data.totalRevenue || 0))
            .catch(console.error);

        fetch(`/api/reports/total-orders?${params}`)
            .then(res => res.json())
            .then(data => setTotalOrders(data.totalOrders || 0))
            .catch(console.error);

        fetch(`/api/reports/avg-order-value?${params}`)
            .then(res => res.json())
            .then(data => setAvgOrderValue(data.avgOrderValue || 0))
            .catch(console.error);

        fetch(`/api/reports/peak-hours?${params}`)
            .then(res => res.json())
            .then(data => setPeakHours(data || []))
            .catch(console.error);

        fetch(`/api/reports/popular-items?${params}`)
            .then(res => res.json())
            .then(data => setPopularItems(data || []))
            .catch(console.error);

        // Fetch chart data
        fetch(`/api/reports/orders-by-hour?${params}`)
            .then(res => res.json())
            .then(data => setOrdersByHour(data || []))
            .catch(console.error);

        fetch(`/api/reports/order-volume?${params}`)
            .then(res => res.json())
            .then(data => setOrderVolume(data || []))
            .catch(console.error);

        fetch(`/api/reports/revenue-chart?${params}`)
            .then(res => res.json())
            .then(data => setRevenueChart(data || []))
            .catch(console.error);

        fetch(`/api/reports/aov-by-category?${params}`)
            .then(res => res.json())
            .then(data => setAovByCategory(data || []))
            .catch(console.error);
    };

    // Load report data on mount and when dates change
    useEffect(() => {
        fetchReportData();
    }, [startDate, endDate]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (timeValue) => {
        // If it's a number (hour), format it
        if (typeof timeValue === 'number') {
            const hour = timeValue % 12 || 12;
            const ampm = timeValue < 12 ? 'AM' : 'PM';
            return `${hour}:00 ${ampm}`;
        }
        return timeValue;
    };

    return (
        <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Sales Dashboard</h2>
                <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowReports(!showReports)}
                >
                    {showReports ? 'Show Sales List' : 'Show Reports'}
                </button>
            </div>

            {showReports ? (
                <>
                    {/* Date Range Selector */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={fetchReportData}
                                    >
                                        Apply Date Range
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card text-center bg-primary text-white">
                                <div className="card-body">
                                    <h6 className="card-subtitle mb-2">Total Revenue</h6>
                                    <h3 className="card-title">{formatCurrency(totalRevenue)}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center bg-success text-white">
                                <div className="card-body">
                                    <h6 className="card-subtitle mb-2">Total Orders</h6>
                                    <h3 className="card-title">{totalOrders}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center bg-info text-white">
                                <div className="card-body">
                                    <h6 className="card-subtitle mb-2">Avg Order Value</h6>
                                    <h3 className="card-title">{formatCurrency(avgOrderValue)}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center bg-warning text-dark">
                                <div className="card-body">
                                    <h6 className="card-subtitle mb-2">Peak Hours</h6>
                                    <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
                                        {peakHours.length > 0
                                            ? peakHours.map(h => h.formatted).join(', ')
                                            : 'N/A'}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popular Items and Orders by Hour */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Most Popular Items</h5>
                                </div>
                                <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {popularItems.length > 0 ? (
                                        <ul className="list-group">
                                            {popularItems.slice(0, 10).map((item, idx) => (
                                                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>
                                                        <strong>#{idx + 1}</strong> {item.name}
                                                    </span>
                                                    <span className="badge bg-primary rounded-pill">{item.totalSold} sold</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Orders by Hour Chart */}
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header bg-dark text-white">
                                    <h5 className="mb-0">Orders by Hour</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px', overflowX: 'auto' }}>
                                        {ordersByHour.length > 0 ? (
                                            <svg width="100%" height="340" viewBox="0 0 600 340">
                                                {/* Y-axis label */}
                                                <text x="10" y="20" fontSize="12" fill="#666">Orders</text>

                                                {ordersByHour.map((item, idx) => {
                                                    const maxCount = Math.max(...ordersByHour.map(d => d.count));
                                                    const barHeight = (item.count / maxCount) * 250;
                                                    const x = idx * (600 / ordersByHour.length) + 20;
                                                    const barWidth = (600 / ordersByHour.length) - 5;

                                                    return (
                                                        <g key={idx}>
                                                            <rect
                                                                x={x}
                                                                y={290 - barHeight}
                                                                width={barWidth}
                                                                height={barHeight}
                                                                fill="#0d6efd"
                                                                opacity="0.8"
                                                            />
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={310}
                                                                fontSize="9"
                                                                textAnchor="middle"
                                                            >
                                                                {item.hour}
                                                            </text>
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={285 - barHeight}
                                                                fontSize="10"
                                                                textAnchor="middle"
                                                                fontWeight="bold"
                                                            >
                                                                {item.count}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        ) : (
                                            <p className="text-muted">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Volume Chart */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header bg-success text-white">
                                    <h5 className="mb-0">Order Volume Over Time</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px', overflowX: 'auto' }}>
                                        {orderVolume.length > 0 ? (
                                            <svg width="100%" height="340" viewBox="0 0 600 340">
                                                <text x="10" y="20" fontSize="12" fill="#666">Orders</text>

                                                {orderVolume.map((item, idx) => {
                                                    const maxCount = Math.max(...orderVolume.map(d => d.orderCount));
                                                    const barHeight = (item.orderCount / maxCount) * 250;
                                                    const x = idx * (600 / orderVolume.length) + 20;
                                                    const barWidth = (600 / orderVolume.length) - 5;

                                                    return (
                                                        <g key={idx}>
                                                            <rect
                                                                x={x}
                                                                y={290 - barHeight}
                                                                width={barWidth}
                                                                height={barHeight}
                                                                fill="#198754"
                                                                opacity="0.8"
                                                            />
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={310}
                                                                fontSize="8"
                                                                textAnchor="middle"
                                                                transform={`rotate(-45, ${x + barWidth / 2}, 310)`}
                                                            >
                                                                {item.period}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        ) : (
                                            <p className="text-muted">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Chart */}
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header bg-warning text-dark">
                                    <h5 className="mb-0">Revenue Over Time</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px', overflowX: 'auto' }}>
                                        {revenueChart.length > 0 ? (
                                            <svg width="100%" height="340" viewBox="0 0 600 340">
                                                <text x="10" y="20" fontSize="12" fill="#666">Revenue ($)</text>

                                                {revenueChart.map((item, idx) => {
                                                    const maxRevenue = Math.max(...revenueChart.map(d => parseFloat(d.revenue)));
                                                    const barHeight = (parseFloat(item.revenue) / maxRevenue) * 250;
                                                    const x = idx * (600 / revenueChart.length) + 20;
                                                    const barWidth = (600 / revenueChart.length) - 5;

                                                    return (
                                                        <g key={idx}>
                                                            <rect
                                                                x={x}
                                                                y={290 - barHeight}
                                                                width={barWidth}
                                                                height={barHeight}
                                                                fill="#ffc107"
                                                                opacity="0.8"
                                                            />
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={310}
                                                                fontSize="8"
                                                                textAnchor="middle"
                                                                transform={`rotate(-45, ${x + barWidth / 2}, 310)`}
                                                            >
                                                                {item.period}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        ) : (
                                            <p className="text-muted">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AOV by Category Chart */}
                    <div className="row mb-4">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-header bg-danger text-white">
                                    <h5 className="mb-0">Average Order Value by Category</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '350px', overflowX: 'auto' }}>
                                        {aovByCategory.length > 0 ? (
                                            <svg width="100%" height="340" viewBox="0 0 800 340">
                                                <text x="10" y="20" fontSize="12" fill="#666">Avg Price ($)</text>

                                                {aovByCategory.map((item, idx) => {
                                                    const maxPrice = Math.max(...aovByCategory.map(d => parseFloat(d.avgPrice)));
                                                    const barHeight = (parseFloat(item.avgPrice) / maxPrice) * 250;
                                                    const x = idx * (800 / aovByCategory.length) + 50;
                                                    const barWidth = (800 / aovByCategory.length) - 60;

                                                    return (
                                                        <g key={idx}>
                                                            <rect
                                                                x={x}
                                                                y={290 - barHeight}
                                                                width={barWidth}
                                                                height={barHeight}
                                                                fill="#dc3545"
                                                                opacity="0.8"
                                                            />
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={310}
                                                                fontSize="12"
                                                                textAnchor="middle"
                                                            >
                                                                {item.category}
                                                            </text>
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={285 - barHeight}
                                                                fontSize="10"
                                                                textAnchor="middle"
                                                                fontWeight="bold"
                                                            >
                                                                {formatCurrency(item.avgPrice)}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        ) : (
                                            <p className="text-muted">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Sales List View */
                <div className="card">
                    <div className="card-header bg-dark text-white">
                        <h5 className="mb-0">Recent Sales</h5>
                    </div>
                    <div className="card-body">
                        {sales && sales.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Receipt #</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Employee ID</th>
                                            <th>Customer ID</th>
                                            <th>Total</th>
                                            <th>Tip</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map(sale => (
                                            <tr key={sale.id}>
                                                <td><strong>#{sale.id}</strong></td>
                                                <td>{formatDate(sale.date)}</td>
                                                <td>{formatTime(sale.time)}</td>
                                                <td>{sale.employeeId}</td>
                                                <td>{sale.customerId}</td>
                                                <td><strong>{formatCurrency(sale.total)}</strong></td>
                                                <td>{formatCurrency(sale.tip || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted">No sales data found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}