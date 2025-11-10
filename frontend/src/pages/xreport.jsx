// pages/xreport.jsx
import { useEffect, useState } from "react";

export default function XReport() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchXReport();
    }, []);

    const fetchXReport = () => {
        setLoading(true);
        setError(null);
        fetch('http://localhost:3000/api/x-report')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch X-Report');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setReportData(data.rows || []);
                } else {
                    setError(data.error || 'Unknown error');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching X-Report:', err);
                setError(err.message);
                setLoading(false);
            });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const formatTime = (hour) => {
        if (hour === null || hour === undefined) return 'N/A';
        const h = hour % 12 || 12;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${h}:00 ${ampm}`;
    };

    // Calculate totals
    const totalOrders = reportData.reduce((sum, item) => sum + (item.order_count || 0), 0);
    const totalSales = reportData.reduce((sum, item) => sum + (item.gross_sales || 0), 0);
    const totalTips = reportData.reduce((sum, item) => sum + (item.total_tips || 0), 0);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>X-Report (Hourly Sales Today)</h2>
                <button className="btn btn-primary" onClick={fetchXReport} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    Error: {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <h5 className="card-title">Total Orders</h5>
                            <h2 className="mb-0">{totalOrders}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <h5 className="card-title">Gross Sales</h5>
                            <h2 className="mb-0">{formatCurrency(totalSales)}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <h5 className="card-title">Total Tips</h5>
                            <h2 className="mb-0">{formatCurrency(totalTips)}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Hourly Sales Chart</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : reportData.length > 0 ? (
                        <div style={{ height: '400px', overflowX: 'auto' }}>
                            <svg width="100%" height="400" viewBox="0 0 900 400">
                                {/* Y-axis label */}
                                <text x="10" y="20" fontSize="12" fill="#666" fontWeight="bold">Gross Sales ($)</text>
                                
                                {/* Grid lines */}
                                {[0, 1, 2, 3, 4].map(i => {
                                    const y = 350 - (i * 70);
                                    return (
                                        <g key={i}>
                                            <line x1="60" y1={y} x2="880" y2={y} stroke="#e0e0e0" strokeWidth="1" />
                                        </g>
                                    );
                                })}

                                {/* Bars */}
                                {reportData.map((item, idx) => {
                                    const maxSales = Math.max(...reportData.map(d => d.gross_sales || 0), 1);
                                    const barHeight = ((item.gross_sales || 0) / maxSales) * 300;
                                    const x = idx * (800 / reportData.length) + 80;
                                    const barWidth = Math.max((800 / reportData.length) - 20, 20);

                                    return (
                                        <g key={idx}>
                                            {/* Bar */}
                                            <rect
                                                x={x}
                                                y={350 - barHeight}
                                                width={barWidth}
                                                height={barHeight}
                                                fill="#0d6efd"
                                                opacity="0.8"
                                            />
                                            {/* Value on top */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={345 - barHeight}
                                                fontSize="10"
                                                textAnchor="middle"
                                                fill="#333"
                                            >
                                                ${(item.gross_sales || 0).toFixed(0)}
                                            </text>
                                            {/* Hour label */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={370}
                                                fontSize="10"
                                                textAnchor="middle"
                                                fill="#666"
                                            >
                                                {formatTime(item.hour)}
                                            </text>
                                            {/* Order count */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={385}
                                                fontSize="9"
                                                textAnchor="middle"
                                                fill="#999"
                                            >
                                                ({item.order_count} orders)
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    ) : (
                        <div className="alert alert-warning" role="alert">
                            No data available for today. No orders have been placed yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card">
                <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0">Detailed Hourly Breakdown</h5>
                </div>
                <div className="card-body">
                    {reportData.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Hour</th>
                                        <th>Order Count</th>
                                        <th>Gross Sales</th>
                                        <th>Total Tips</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{formatTime(item.hour)}</td>
                                            <td>{item.order_count}</td>
                                            <td>{formatCurrency(item.gross_sales)}</td>
                                            <td>{formatCurrency(item.total_tips)}</td>
                                        </tr>
                                    ))}
                                    <tr className="table-primary fw-bold">
                                        <td>TOTAL</td>
                                        <td>{totalOrders}</td>
                                        <td>{formatCurrency(totalSales)}</td>
                                        <td>{formatCurrency(totalTips)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        !loading && (
                            <p className="text-muted text-center">No data available</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
