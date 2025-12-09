// pages/sales.jsx
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import "../sales.css";

export default function Sales() {
    const { t } = useLanguage();
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

    useEffect(() => {
        document.body.classList.add('manager-page');
        return () => {
            document.body.classList.remove('manager-page');
        };
    }, []);

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
            .then(data => {
                console.log('Revenue chart data:', data); // Debug log
                setRevenueChart(data || []);
            })
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
        <div className="sales-dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">{t("Sales Dashboard")}</h1>
            </div>

            {/* Date Range Selector */}
            <div className="date-range-section">
                <div className="date-filters">
                    <div className="date-input-group">
                        <label>{t("Start Date")}</label>
                        <input
                            type="date"
                            className="date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input-group">
                        <label>{t("End Date")}</label>
                        <input
                            type="date"
                            className="date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button
                        className="refresh-btn"
                        onClick={fetchReportData}
                    >
                        {t("Apply Date Range")}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-revenue">
                    <div className="kpi-label">{t("Total Revenue")}</div>
                    <div className="kpi-value">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="kpi-card kpi-orders">
                    <div className="kpi-label">{t("Total Orders")}</div>
                    <div className="kpi-value">{totalOrders}</div>
                </div>
                <div className="kpi-card kpi-aov">
                    <div className="kpi-label">{t("Avg Order Value")}</div>
                    <div className="kpi-value">{formatCurrency(avgOrderValue)}</div>
                </div>
                <div className="kpi-card kpi-peak">
                    <div className="kpi-label">{t("Peak Hours")}</div>
                    <div className="kpi-value peak-hours-value">
                        {peakHours.length > 0
                            ? peakHours.map(h => h.formatted).join(', ')
                            : t('N/A')}
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Popular Items */}
                <div className="dashboard-card popular-items-card">
                    <div className="card-header-custom">
                        <h3 className="card-title-custom">{t("Most Popular Items")}</h3>
                    </div>
                    {popularItems.length > 0 ? (
                        <div className="items-list">
                            {popularItems.slice(0, 10).map((item, idx) => (
                                <div key={idx} className="item-row">
                                    <div className="item-info">
                                        <div className="item-rank">{idx + 1}</div>
                                        <div className="item-name">{t(item.name)}</div>
                                    </div>
                                    <div className="item-stats">
                                        <div className="item-quantity">{item.totalSold} {t("sold")}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">{t("No data available")}</p>
                    )}
                </div>

                {/* Orders by Hour */}
                <div className="dashboard-card peak-hours-card">
                    <div className="card-header-custom">
                        <h3 className="card-title-custom">{t("Orders by Hour")}</h3>
                    </div>
                    {ordersByHour.length > 0 ? (
                        <div className="peak-hours-list">
                            {ordersByHour.map((item, idx) => {
                                const maxCount = Math.max(...ordersByHour.map(d => d.count));
                                const widthPercent = (item.count / maxCount) * 100;

                                return (
                                    <div key={idx} className="peak-hour-item">
                                        <div className="hour-time">{item.hour}</div>
                                        <div className="hour-bar-container">
                                            <div
                                                className="hour-bar"
                                                style={{ width: `${widthPercent}%` }}
                                            />
                                        </div>
                                        <div className="hour-count">{item.count} orders</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="no-data">{t("No data available")}</p>
                    )}
                </div>

                {/* AOV by Category */}
                <div className="dashboard-card aov-card">
                    <div className="card-header-custom">
                        <h3 className="card-title-custom">{t("Average Order Value by Category")}</h3>
                    </div>
                    {aovByCategory.length > 0 ? (
                        <div className="aov-list">
                            {aovByCategory.map((item, idx) => (
                                <div key={idx} className="aov-item">
                                    <div className="aov-category">{item.category}</div>
                                    <div className="aov-value">{formatCurrency(item.avgPrice)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">{t("No data available")}</p>
                    )}
                </div>

                {/* Order Volume Chart */}
                <div className="dashboard-card chart-card-half">
                    <div className="card-header-custom">
                        <h3 className="card-title-custom">{t("Order Volume Over Time")}</h3>
                    </div>
                    <div className="chart-container">
                        {orderVolume && orderVolume.length > 0 ? (
                            <svg width="100%" height="350" viewBox="0 0 1000 350" preserveAspectRatio="xMidYMid meet">
                                {/* Y-axis label */}
                                <text x="20" y="30" fontSize="14" fill="#666" fontWeight="600">
                                    {t("Orders")}
                                </text>

                                {/* Bars */}
                                {orderVolume.map((item, idx) => {
                                    const maxOrders = Math.max(...orderVolume.map(d => parseFloat(d.orderCount || d.count) || 0));
                                    const count = parseFloat(item.orderCount || item.count) || 0;
                                    const barHeight = maxOrders > 0 ? (count / maxOrders) * 250 : 0;
                                    const barWidth = Math.min((1000 - 100) / orderVolume.length - 10, 40);
                                    const x = idx * ((1000 - 100) / orderVolume.length) + 60;

                                    return (
                                        <g key={idx}>
                                            {/* Bar */}
                                            <rect
                                                x={x}
                                                y={300 - barHeight}
                                                width={barWidth}
                                                height={Math.max(barHeight, 1)}
                                                fill="#6B8E7B"
                                                opacity="0.9"
                                                rx="2"
                                            />
                                            {/* X-axis label - rotated 45 degrees */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={320}
                                                fontSize="9"
                                                textAnchor="end"
                                                fill="#666"
                                                transform={`rotate(-45, ${x + barWidth / 2}, 320)`}
                                            >
                                                {item.period}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* X-axis line */}
                                <line x1="50" y1="305" x2="980" y2="305" stroke="#ddd" strokeWidth="2" />
                            </svg>
                        ) : (
                            <div className="no-data-container">
                                <p className="no-data">{t("No order volume data available")}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="dashboard-card chart-card-half">
                    <div className="card-header-custom">
                        <h3 className="card-title-custom">{t("Revenue Over Time")}</h3>
                    </div>
                    <div className="chart-container">
                        {revenueChart && revenueChart.length > 0 ? (
                            <svg width="100%" height="350" viewBox="0 0 1000 350" preserveAspectRatio="xMidYMid meet">
                                {/* Y-axis label */}
                                <text x="20" y="30" fontSize="14" fill="#666" fontWeight="600">
                                    {t("Revenue")} ($)
                                </text>

                                {/* Bars */}
                                {revenueChart.map((item, idx) => {
                                    const maxRevenue = Math.max(...revenueChart.map(d => parseFloat(d.revenue) || 0));
                                    const revenue = parseFloat(item.revenue) || 0;
                                    const barHeight = maxRevenue > 0 ? (revenue / maxRevenue) * 250 : 0;
                                    const barWidth = Math.min((1000 - 100) / revenueChart.length - 10, 40);
                                    const x = idx * ((1000 - 100) / revenueChart.length) + 60;

                                    return (
                                        <g key={idx}>
                                            {/* Bar */}
                                            <rect
                                                x={x}
                                                y={300 - barHeight}
                                                width={barWidth}
                                                height={Math.max(barHeight, 1)}
                                                fill="#C8A882"
                                                opacity="0.9"
                                                rx="2"
                                            />
                                            {/* X-axis label - rotated 45 degrees */}
                                            <text
                                                x={x + barWidth / 2}
                                                y={320}
                                                fontSize="9"
                                                textAnchor="end"
                                                fill="#666"
                                                transform={`rotate(-45, ${x + barWidth / 2}, 320)`}
                                            >
                                                {item.period}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* X-axis line */}
                                <line x1="50" y1="305" x2="980" y2="305" stroke="#ddd" strokeWidth="2" />
                            </svg>
                        ) : (
                            <div className="no-data-container">
                                <p className="no-data">{t("No revenue data available for this period")}</p>
                                <p className="no-data-hint">{t("Try selecting a different date range")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}