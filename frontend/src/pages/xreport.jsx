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

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate totals
    const totalOrders = reportData.reduce((sum, item) => sum + (item.order_count || 0), 0);
    const totalSales = reportData.reduce((sum, item) => sum + (item.gross_sales || 0), 0);
    const totalTips = reportData.reduce((sum, item) => sum + (item.total_tips || 0), 0);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>X-Report (Hourly Sales Today)</h2>
                    <p className="text-muted mb-0">{getCurrentDate()}</p>
                </div>
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
                    <h5 className="mb-0">Orders per Hour Chart</h5>
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
                                <text x="10" y="20" fontSize="12" fill="#666" fontWeight="bold">Number of Orders</text>
                                
                                {/* Grid lines */}
                                {[0, 1, 2, 3, 4, 5].map(i => {
                                    const maxOrders = Math.max(...reportData.map(d => d.order_count || 0), 1);
                                    const gridValue = Math.ceil((maxOrders / 5) * i);
                                    const y = 350 - ((gridValue / maxOrders) * 300);
                                    return (
                                        <g key={i}>
                                            <line x1="60" y1={y} x2="880" y2={y} stroke="#e0e0e0" strokeWidth="1" />
                                            <text x="45" y={y + 4} fontSize="10" fill="#999" textAnchor="end">
                                                {gridValue}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Line path */}
                                {(() => {
                                    const maxOrders = Math.max(...reportData.map(d => d.order_count || 0), 1);
                                    const points = reportData.map((item, idx) => {
                                        const x = idx * (800 / (reportData.length - 1 || 1)) + 80;
                                        const y = 350 - ((item.order_count || 0) / maxOrders) * 300;
                                        return `${x},${y}`;
                                    }).join(' ');
                                    
                                    return (
                                        <polyline
                                            points={points}
                                            fill="none"
                                            stroke="#0d6efd"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    );
                                })()}

                                {/* Data points and markers */}
                                {reportData.map((item, idx) => {
                                    const maxOrders = Math.max(...reportData.map(d => d.order_count || 0), 1);
                                    const x = idx * (800 / (reportData.length - 1 || 1)) + 80;
                                    const y = 350 - ((item.order_count || 0) / maxOrders) * 300;

                                    return (
                                        <g key={idx}>
                                            {/* Circle marker */}
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r="6"
                                                fill="#0d6efd"
                                                stroke="white"
                                                strokeWidth="2"
                                            />
                                            {/* Value label above marker */}
                                            <text
                                                x={x}
                                                y={y - 12}
                                                fontSize="10"
                                                textAnchor="middle"
                                                fill="#333"
                                                fontWeight="bold"
                                            >
                                                {item.order_count || 0}
                                            </text>
                                            {/* Hour label */}
                                            <text
                                                x={x}
                                                y={370}
                                                fontSize="10"
                                                textAnchor="middle"
                                                fill="#666"
                                                transform={`rotate(-45, ${x}, 370)`}
                                            >
                                                {formatTime(item.hour)}
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
                                        <th>Average Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, idx) => {
                                        const avgSale = item.order_count > 0 ? item.gross_sales / item.order_count : 0;
                                        return (
                                            <tr key={idx}>
                                                <td>{formatTime(item.hour)}</td>
                                                <td>{item.order_count}</td>
                                                <td>{formatCurrency(item.gross_sales)}</td>
                                                <td>{formatCurrency(item.total_tips)}</td>
                                                <td>{formatCurrency(avgSale)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="table-primary fw-bold">
                                        <td>TOTAL</td>
                                        <td>{totalOrders}</td>
                                        <td>{formatCurrency(totalSales)}</td>
                                        <td>{formatCurrency(totalTips)}</td>
                                        <td>{formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)}</td>
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
