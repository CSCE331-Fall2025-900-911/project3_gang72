// pages/zreport.jsx
import { useEffect, useState } from "react";
import ManagerLayout from "../components/ManagerLayout";
import { useLanguage } from "../context/LanguageContext";

export default function ZReport() {
    const { t, language } = useLanguage();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alreadyRun, setAlreadyRun] = useState(false);

    useEffect(() => {
        checkZReportStatus();
    }, []);

    // REMOVE this useEffect - it's causing the sidebar to hide
    // useEffect(() => {
    //     document.body.classList.add('manager-page');
    //     return () => {
    //         document.body.classList.remove('manager-page');
    //     };
    // }, []);

    const checkZReportStatus = () => {
        setLoading(true);
        setError(null);
        fetch('/api/z-report/status')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAlreadyRun(data.alreadyRun || false);
                    if (data.alreadyRun && data.summary) {
                        setReportData(data.summary);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error checking Z-Report status:', err);
                setLoading(false);
            });
    };

    const fetchZReport = () => {
        setLoading(true);
        setError(null);
        fetch('/api/z-report', {
            method: 'POST'
        })
            .then(res => {
                if (res.status === 403) {
                    return res.json().then(data => {
                        setAlreadyRun(true);
                        setError(data.error || 'Z-Report already run today');
                        throw new Error('Already run');
                    });
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch Z-Report');
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    setReportData(data.summary || {});
                    setAlreadyRun(true);
                } else {
                    setError(data.error || 'Unknown error');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching Z-Report:', err);
                if (err.message !== 'Already run') {
                    setError(err.message);
                }
                setLoading(false);
            });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const getCurrentDate = () => {
        // Map language codes to locale strings
        const localeMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'zh-CN': 'zh-CN',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
            'it': 'it-IT'
        };
        
        const locale = localeMap[language] || 'en-US';
        
        return new Date().toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const avgOrderValue = reportData && reportData.total_orders > 0
        ? reportData.gross_sales / reportData.total_orders
        : 0;

    const discountLoss = reportData?.total_discounts || 0;

    return (
        <ManagerLayout>
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>{t("Z-Report (Daily Summary)")}</h2>
                        <p className="text-muted mb-0">{getCurrentDate()}</p>
                    </div>
                    <button
                        className={`btn ${alreadyRun ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={fetchZReport}
                        disabled={loading || alreadyRun}
                        style={alreadyRun ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        title={alreadyRun ? t("Z-Report has already been run today - it can only be executed once per day") : ""}
                    >
                        {loading ? t('Loading...') : alreadyRun ? t('Already Run Today') : t('Run Z-Report')}
                    </button>
                </div>

                {alreadyRun && (
                    <div className="alert alert-warning alert-dismissible fade show" role="alert">
                        <div className="d-flex align-items-center">
                            <strong className="me-2">⚠️ {t("Z-Report Already Executed Today")}</strong>
                        </div>
                        <hr />
                        <p className="mb-2">{t("The Z-Report can only be run")} <strong>{t("once per day")}</strong>.</p>
                        <p className="mb-0">{t("It has already been executed today. If you need to run a new Z-Report, please return")} <strong>{t("tomorrow")}</strong>.</p>
                    </div>
                )}

                {error && !alreadyRun && (
                    <div className="alert alert-danger" role="alert">
                        {t("Error")}: {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t("Loading...")}</span>
                        </div>
                    </div>
                ) : reportData ? (
                    <>
                        {/* Summary Cards */}
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body text-center">
                                        <h6 className="card-title text-uppercase mb-3">{t("Total Orders")}</h6>
                                        <h1 className="display-4 mb-0">{reportData.total_orders || 0}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body text-center">
                                        <h6 className="card-title text-uppercase mb-3">{t("Gross Sales")}</h6>
                                        <h1 className="display-4 mb-0" style={{ fontSize: '2rem' }}>
                                            {formatCurrency(reportData.gross_sales || 0)}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-info text-white">
                                    <div className="card-body text-center">
                                        <h6 className="card-title text-uppercase mb-3">{t("Total Tips")}</h6>
                                        <h1 className="display-4 mb-0" style={{ fontSize: '2rem' }}>
                                            {formatCurrency(reportData.total_tips || 0)}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-dark">
                                    <div className="card-body text-center">
                                        <h6 className="card-title text-uppercase mb-3">{t("Avg Order Value")}</h6>
                                        <h1 className="display-4 mb-0" style={{ fontSize: '2rem' }}>
                                            {formatCurrency(avgOrderValue)}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="card">
                            <div className="card-header bg-dark text-white">
                                <h5 className="mb-0">{t("Daily Summary Details")}</h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th scope="col" style={{ width: '50%' }}>{t("Metric")}</th>
                                                <th scope="col" style={{ width: '50%' }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="fw-bold">Total Orders</td>
                                                <td>{reportData.total_orders || 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">{t("Gross Sales")}</td>
                                                <td className="text-success fw-bold">{formatCurrency(reportData.gross_sales || 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">{t("Discounts Applied (Loss)")}</td>
                                                <td className="text-danger fw-bold">-{formatCurrency(discountLoss)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">{t("Total Tips")}</td>
                                                <td className="text-info fw-bold">{formatCurrency(reportData.total_tips || 0)}</td>
                                            </tr>
                                            <tr className="table-secondary">
                                                <td className="fw-bold">{t("Total Revenue (Sales + Tips)")}</td>
                                                <td className="fw-bold">
                                                    {formatCurrency((reportData.gross_sales || 0) + (reportData.total_tips || 0))}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">{t("Average Order Value")}</td>
                                                <td className="text-warning fw-bold">{formatCurrency(avgOrderValue)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">{t("Average Tip per Order")}</td>
                                                <td>
                                                    {reportData.total_orders > 0
                                                        ? formatCurrency(reportData.total_tips / reportData.total_orders)
                                                        : formatCurrency(0)
                                                    }
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="alert alert-info mt-4" role="alert">
                            <h5 className="alert-heading">
                                <i className="bi bi-info-circle"></i> {t("Z-Report Information")}
                            </h5>
                            <p className="mb-0">
                                {t("This Z-Report shows the daily summary for")} <strong>{getCurrentDate()}</strong>.
                                {" "}{t("It includes all transactions from today and is typically run at the end of business day.")}
                            </p>
                        </div>

                        {/* No data warning */}
                        {reportData.total_orders === 0 && (
                            <div className="alert alert-warning mt-4" role="alert">
                                <strong>{t("No orders today!")}</strong> {t("There have been no orders placed today yet.")}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="alert alert-warning" role="alert">
                        {t("No report data available. Click \"Run Z-Report\" to generate today's report.")}
                    </div>
                )}
            </div>
        </ManagerLayout>
    );
}