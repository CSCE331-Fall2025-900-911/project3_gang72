(function () { })()
/**
 * runXReport - Execute the X-Report SQL against PostgreSQL and return rows.
 *
 * This file expects database connection info to be available via environment
 * variables (e.g. DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT).
 * If you use a `.env` file, load it before calling runXReport (e.g. require('dotenv').config()).
 */

const { Pool } = require('pg');
const dotenv = require('dotenv'); 
dotenv.config();

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);

const X_REPORT_SQL = `
SELECT
		r.order_time AS hour,
		COUNT(DISTINCT r.receipt_id) AS order_count,
		COALESCE(SUM(i.price), 0) AS gross_sales,
		COALESCE(SUM(r.tip), 0) AS total_tips
FROM receipt r
LEFT JOIN orders o ON r.receipt_id = o.receipt_id
LEFT JOIN item i ON o.item_id = i.item_id
WHERE r.order_date = CURRENT_DATE
GROUP BY r.order_time
ORDER BY hour;
`;

// Daily summary SQL: total orders, gross sales, total tips for CURRENT_DATE
const zReportSQL = `
SELECT
    COUNT(DISTINCT r.receipt_id) AS total_orders,
    COALESCE(SUM(i.price), 0) AS gross_sales,
    COALESCE(SUM(r.tip), 0) AS total_tips
FROM receipt r
LEFT JOIN orders o ON r.receipt_id = o.receipt_id
LEFT JOIN item i ON o.item_id = i.item_id
WHERE r.order_date = CURRENT_DATE
`;


async function runXReport() {
    const client = await pool.connect();
    try {
        const res = await client.query(X_REPORT_SQL);
        // Map rows to a predictable numeric shape
        return res.rows.map(r => ({
            hour: r.hour === null ? null : Number(r.hour),
            order_count: r.order_count === null ? 0 : Number(r.order_count),
            gross_sales: r.gross_sales === null ? 0 : Number(r.gross_sales),
            total_tips: r.total_tips === null ? 0 : Number(r.total_tips),
        }));
    } finally {
        client.release();
    }
}

async function xReportHandler(req, res) {
    try {
        const rows = await runXReport();
        res.json({ success: true, rows });
        res.json({ message: "X report generated ✅" });

    } catch (err) {
        console.error('Error running X report', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function zReport() {
    const client = await pool.connect();
    try {
        const res = await client.query(zReportSQL);
        const r = res.rows[0] || {};
        return {
            total_orders: r.total_orders == null ? 0 : Number(r.total_orders),
            gross_sales: r.gross_sales == null ? 0 : Number(r.gross_sales),
            total_tips: r.total_tips == null ? 0 : Number(r.total_tips),
        };
    } finally {
        client.release();
    }
}

async function zReportHandler(req, res) {
    try {
        const summary = await zReport();
        res.json({ success: true, summary });
        res.json({ message: "Z report generated ✅" });

    } catch (err) {
        console.error('Error running daily summary', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { runXReport, xReportHandler, X_REPORT_SQL, zReport, zReportHandler, zReportSQL };

