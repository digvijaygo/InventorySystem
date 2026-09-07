const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
let dbReady = false;
const DEFAULT_LOCATION = 'Kpr Projections';
const SUPPORTED_LOCATIONS = [
    'Arneel Industries Karodi',
    'Anil Industries Karodi',
    'Anil Industries Ghanegoan',
    'Anil Industries Yavatmal',
    'Kpr Projections'
];
const DAILY_STOCK_CATEGORIES = [
    'MS PIPE and MS ANGLE',
    'PAINT (INNER)',
    'PAINT (OUTER)',
    'ELECTRICAL MATERIAL',
    'PLUMBING MATERIAL'
];
const CONTRACTOR_WORK_TYPES = [
    'Fabrication',
    'Cement Sheet',
    'Electrical',
    'Tiles',
    'Plumbing',
    'Door Fitting',
    'Outer Colour',
    'Inner Colour'
];
const SESSION_COOKIE_NAME = 'inventory_session';
const OTP_TTL_MINUTES = 5;
const SESSION_TTL_HOURS = 12;
const DEFAULT_ADMIN_USER = {
    fullName: 'System Admin',
    mobileNumber: '9999999999',
    role: 'Admin'
};

function parseCookies(cookieHeaderValue) {
    const cookieHeader = String(cookieHeaderValue || '').trim();
    if (!cookieHeader) {
        return {};
    }

    return cookieHeader.split(';').reduce((acc, token) => {
        const separatorIndex = token.indexOf('=');
        if (separatorIndex === -1) {
            return acc;
        }

        const key = token.slice(0, separatorIndex).trim();
        const value = token.slice(separatorIndex + 1).trim();
        if (!key) {
            return acc;
        }

        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
}

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    req.cookies = parseCookies(req.headers.cookie);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Home.html'));
});

app.use(express.static(__dirname));

function ensureDbReady(req, res, next) {
    if (!dbReady) {
        return res.status(503).json({ error: 'Database initializing. Please retry in a moment.' });
    }

    next();
}

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite inventory database.');
});
db.configure('busyTimeout', 5000);

function getTodayLocalISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isValidDateString(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeCategoryName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeLocationName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function isSupportedLocation(value) {
    return SUPPORTED_LOCATIONS.includes(normalizeLocationName(value));
}

function normalizeMobileNumber(value) {
    return String(value || '').replace(/\D/g, '').trim();
}

function isValidMobileNumber(value) {
    return /^\d{10}$/.test(normalizeMobileNumber(value));
}

function isValidUdise(value) {
    return /^\d{11}$/.test(String(value || '').trim());
}

function isValidVehicleNo(value) {
    return /^[A-Za-z0-9]{1,10}$/.test(String(value || '').trim());
}

function isValidEwaybillNo(value) {
    return /^\d{12}$/.test(String(value || '').trim());
}

function normalizeRoleName(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'employee') return 'Employee';
    return '';
}

function normalizeContractorName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function createSixDigitOtp() {
    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return String(otp);
}

function createSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getFutureIsoByMinutes(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function getFutureIsoByHours(hours) {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function setSessionCookie(res, sessionToken) {
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: SESSION_TTL_HOURS * 60 * 60 * 1000
    });
}

function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) {
                reject(err);
                return;
            }

            resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows);
        });
    });
}

// Create or migrate table to the current structure.
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS daily_stock_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_stock_subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_name, name)
    )`);

    const categoryInsert = db.prepare('INSERT OR IGNORE INTO daily_stock_categories (name) VALUES (?)');
    DAILY_STOCK_CATEGORIES.forEach((categoryName) => {
        categoryInsert.run(categoryName);
    });
    categoryInsert.finalize();

    db.run(`CREATE TABLE IF NOT EXISTS daily_stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_date TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        size TEXT NOT NULL,
        qty_for_1_cabin REAL NOT NULL,
        qty_for_20_cabin REAL NOT NULL DEFAULT 0,
        stock_at_kpr REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(
        `ALTER TABLE daily_stocks
         ADD COLUMN location TEXT NOT NULL DEFAULT '${DEFAULT_LOCATION}'`,
        (alterLocationErr) => {
            if (alterLocationErr && !alterLocationErr.message.includes('duplicate column name')) {
                console.error('Failed to add daily_stocks.location:', alterLocationErr.message);
            }

            db.run(
                `UPDATE daily_stocks
                 SET location = ?
                 WHERE TRIM(COALESCE(location, '')) = ''`,
                [DEFAULT_LOCATION],
                (updateLocationErr) => {
                    if (updateLocationErr) {
                        console.error('Failed to backfill daily_stocks.location:', updateLocationErr.message);
                    }
                }
            );

            db.run('DROP INDEX IF EXISTS idx_daily_stocks_unique', (dropIndexErr) => {
                if (dropIndexErr) {
                    console.error('Failed to drop idx_daily_stocks_unique:', dropIndexErr.message);
                }

                db.run(
                    `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stocks_unique
                     ON daily_stocks(stock_date, location, category, size)`,
                    (createIndexErr) => {
                        if (createIndexErr) {
                            console.error('Failed to create idx_daily_stocks_unique:', createIndexErr.message);
                        }
                    }
                );
            });
        }
    );

    db.run(
        `ALTER TABLE daily_stocks
         ADD COLUMN qty_for_20_cabin REAL NOT NULL DEFAULT 0`,
        (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
                console.error('Failed to add daily_stocks.qty_for_20_cabin:', alterErr.message);
            }

            db.run(
                `UPDATE daily_stocks
                 SET qty_for_20_cabin = qty_for_1_cabin * 20
                 WHERE qty_for_20_cabin IS NULL OR qty_for_20_cabin = 0`,
                (updateQtyErr) => {
                    if (updateQtyErr) {
                        console.error('Failed to backfill daily_stocks.qty_for_20_cabin:', updateQtyErr.message);
                    }
                }
            );
        }
    );

    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '${DEFAULT_LOCATION}',
        inv_no TEXT NOT NULL,
        recipient TEXT NOT NULL,
        udise TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        vehicle_no TEXT NOT NULL,
        ewaybill_no TEXT NOT NULL,
        boys INTEGER NOT NULL DEFAULT 0,
        girls INTEGER NOT NULL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contractor_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contractor_name TEXT NOT NULL UNIQUE,
        fabrication REAL NOT NULL DEFAULT 0,
        cement_sheet REAL NOT NULL DEFAULT 0,
        electrical REAL NOT NULL DEFAULT 0,
        tiles REAL NOT NULL DEFAULT 0,
        plumbing REAL NOT NULL DEFAULT 0,
        door_fitting REAL NOT NULL DEFAULT 0,
        outer_colour REAL NOT NULL DEFAULT 0,
        inner_colour REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        remark TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contractor_payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contractor_id INTEGER NOT NULL,
        payment_date TEXT NOT NULL,
        payment_amount REAL NOT NULL,
        payment_mode TEXT NOT NULL DEFAULT 'Online',
        paid_by TEXT,
        remarks TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contractor_id) REFERENCES contractor_payments(id) ON DELETE CASCADE
    )`);

    db.run(
        `CREATE INDEX IF NOT EXISTS idx_contractor_transactions_lookup
         ON contractor_payment_transactions(contractor_id, payment_date)`
    );

    db.run(`CREATE TABLE IF NOT EXISTS attendance_employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_code TEXT NOT NULL UNIQUE,
        employee_name TEXT NOT NULL,
        department TEXT NOT NULL,
        joining_date TEXT NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        attendance_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS purchase_sales_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Purchase', 'Sale')),
        invoice_date TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        bill_to TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        hsn_code TEXT NOT NULL,
        rate REAL NOT NULL,
        value_amount REAL NOT NULL,
        cgst_percent REAL NOT NULL DEFAULT 0,
        cgst_amount REAL NOT NULL DEFAULT 0,
        sgst_percent REAL NOT NULL DEFAULT 0,
        sgst_amount REAL NOT NULL DEFAULT 0,
        igst_percent REAL NOT NULL DEFAULT 0,
        igst_amount REAL NOT NULL DEFAULT 0,
        amount REAL NOT NULL,
        delivery TEXT,
        dc_number TEXT,
        ewaybill TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(transaction_type, invoice_number)
    )`);
    db.run(
        `CREATE INDEX IF NOT EXISTS idx_purchase_sales_transactions_date
         ON purchase_sales_transactions(invoice_date DESC)`
    );

    const attendanceSeed = [
        ['EMP001', 'Rajesh Gupta', 'Production', '2026-01-01'],
        ['EMP002', 'Suresh Kumar', 'Production', '2026-01-01'],
        ['EMP003', 'Amit More', 'Accounts', '2026-01-01'],
        ['EMP004', 'Neha Sharma', 'HR', '2026-01-01'],
        ['EMP005', 'Priya Verma', 'Sales', '2026-01-01'],
        ['EMP006', 'Vikram Singh', 'Production', '2026-01-01'],
        ['EMP007', 'Kavita Patil', 'Accounts', '2026-01-01'],
        ['EMP008', 'Rohan Joshi', 'Sales', '2026-01-01'],
        ['EMP009', 'Meena Rao', 'HR', '2026-01-01'],
        ['EMP010', 'Arjun Deshmukh', 'Production', '2026-01-01']
    ];
    const insertAttendanceSeed = db.prepare(
        `INSERT OR IGNORE INTO attendance_employees
         (employee_code, employee_name, department, joining_date, paid_amount, attendance_json)
         VALUES (?, ?, ?, ?, 0, '[]')`
    );
    attendanceSeed.forEach((employee) => insertAttendanceSeed.run(employee));
    insertAttendanceSeed.finalize();

    db.run(`CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        mobile_number TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'Employee')),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS auth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
    )`);

    db.run(
        `CREATE INDEX IF NOT EXISTS idx_user_otps_lookup
         ON user_otps(user_id, expires_at)`
    );

    db.run(
        `CREATE INDEX IF NOT EXISTS idx_auth_sessions_lookup
         ON auth_sessions(session_token, expires_at)`
    );

    db.run(
        `INSERT OR IGNORE INTO app_users (full_name, mobile_number, role, is_active)
         VALUES (?, ?, ?, 1)`,
        [DEFAULT_ADMIN_USER.fullName, DEFAULT_ADMIN_USER.mobileNumber, DEFAULT_ADMIN_USER.role],
        (insertAdminErr) => {
            if (insertAdminErr) {
                console.error('Failed to ensure default admin user:', insertAdminErr.message);
                return;
            }

            console.log(`Default admin mobile: ${DEFAULT_ADMIN_USER.mobileNumber}`);
        }
    );

    const contractorSeed = [
        ['M/s Mahadev Fabricators', 252, 0, 64, 0, 22, 0, 0, 0, 1450000, 'Major structural work'],
        ['R S Roofing Works', 0, 240, 0, 0, 14, 0, 0, 0, 980000, 'Cement sheet installation'],
        ['Om Electricals', 0, 0, 276.5, 0, 0, 0, 0, 0, 1675000, 'Main electrical contracts'],
        ['Shree Tiles Decor', 0, 0, 0, 48, 0, 0, 0, 0, 420000, 'Tile layout and finishing'],
        ['Arihant Plumbing', 0, 0, 0, 0, 147, 0, 0, 0, 740000, 'Plumbing works'],
        ['Classic Doorfit', 0, 0, 0, 0, 0, 29, 0, 0, 285000, 'Door fitting and hardware'],
        ['Bright Coat Painters', 0, 0, 0, 0, 0, 0, 140, 208, 1360010, 'Interior and exterior painting'],
        ['KPR Rapid Works', 34, 12, 8, 0, 4, 6, 0, 0, 395000, 'Mixed support works']
    ];

    const insertContractorSeed = db.prepare(
        `INSERT OR IGNORE INTO contractor_payments
         (contractor_name, fabrication, cement_sheet, electrical, tiles, plumbing, door_fitting, outer_colour, inner_colour, total_amount, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    contractorSeed.forEach((row) => {
        insertContractorSeed.run(row);
    });
    insertContractorSeed.finalize();

    db.all('PRAGMA table_info(items)', [], (err, columns) => {
        if (err) {
            console.error('Failed to inspect items table:', err.message);
            dbReady = true;
            return;
        }

        const existingColumns = new Set(columns.map((col) => col.name));
        const missingColumns = [
            { name: 'date', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'location', sqlType: `TEXT NOT NULL DEFAULT '${DEFAULT_LOCATION}'` },
            { name: 'inv_no', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'recipient', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'udise', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'recipient_address', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'vehicle_no', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'ewaybill_no', sqlType: "TEXT NOT NULL DEFAULT ''" },
            { name: 'boys', sqlType: 'INTEGER NOT NULL DEFAULT 0' },
            { name: 'girls', sqlType: 'INTEGER NOT NULL DEFAULT 0' }
        ].filter((column) => !existingColumns.has(column.name));

        let pendingAlterStatements = missingColumns.length;

        if (pendingAlterStatements === 0) {
            migrateLegacySchemaIfNeeded(existingColumns);
            return;
        }

        missingColumns.forEach((column) => {
            db.run(`ALTER TABLE items ADD COLUMN ${column.name} ${column.sqlType}`, (alterErr) => {
                if (alterErr) {
                    console.error(`Failed to add column ${column.name}:`, alterErr.message);
                }

                pendingAlterStatements -= 1;
                if (pendingAlterStatements === 0) {
                    const refreshedColumns = new Set([...existingColumns, ...missingColumns.map((c) => c.name)]);
                    migrateLegacySchemaIfNeeded(refreshedColumns);
                }
            });
        });
    });
});

function migrateLegacySchemaIfNeeded(existingColumns) {
    const hasLegacyColumns = existingColumns.has('name') || existingColumns.has('quantity') || existingColumns.has('price');

    if (!hasLegacyColumns) {
        dbReady = true;
        return;
    }

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS items_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            location TEXT NOT NULL DEFAULT '${DEFAULT_LOCATION}',
            inv_no TEXT NOT NULL,
            recipient TEXT NOT NULL,
            udise TEXT NOT NULL,
            recipient_address TEXT NOT NULL,
            vehicle_no TEXT NOT NULL,
            ewaybill_no TEXT NOT NULL,
            boys INTEGER NOT NULL DEFAULT 0,
            girls INTEGER NOT NULL DEFAULT 0
        )`);

        db.run(
            `INSERT INTO items_v2 (id, date, location, inv_no, recipient, udise, recipient_address, vehicle_no, ewaybill_no, boys, girls)
             SELECT
                id,
                COALESCE(date, ''),
                CASE
                    WHEN TRIM(COALESCE(location, '')) <> '' THEN location
                    ELSE '${DEFAULT_LOCATION}'
                END,
                CASE
                    WHEN TRIM(COALESCE(inv_no, '')) <> '' THEN inv_no
                    ELSE COALESCE(name, '')
                END,
                COALESCE(recipient, ''),
                COALESCE(udise, ''),
                COALESCE(recipient_address, ''),
                COALESCE(vehicle_no, ''),
                COALESCE(ewaybill_no, ''),
                CASE
                    WHEN boys IS NOT NULL THEN boys
                    WHEN quantity IS NOT NULL THEN quantity
                    ELSE 0
                END,
                COALESCE(girls, 0)
             FROM items`,
            (insertErr) => {
                if (insertErr) {
                    console.error('Legacy migration copy failed:', insertErr.message);
                    dbReady = true;
                    return;
                }

                db.run('DROP TABLE items', (dropErr) => {
                    if (dropErr) {
                        console.error('Legacy migration drop failed:', dropErr.message);
                        dbReady = true;
                        return;
                    }

                    db.run('ALTER TABLE items_v2 RENAME TO items', (renameErr) => {
                        if (renameErr) {
                            console.error('Legacy migration rename failed:', renameErr.message);
                        }

                        dbReady = true;
                    });
                });
            }
        );
    });
}

async function resolveAuthenticatedUser(req, res, next) {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    req.authUser = null;

    if (!sessionToken) {
        next();
        return;
    }

    try {
        const user = await dbGet(
            `SELECT u.id, u.full_name, u.mobile_number, u.role
             FROM auth_sessions s
             JOIN app_users u ON u.id = s.user_id
             WHERE s.session_token = ?
               AND s.expires_at > ?
               AND u.is_active = 1`,
            [sessionToken, new Date().toISOString()]
        );

        if (!user) {
            clearSessionCookie(res);
            next();
            return;
        }

        req.authUser = {
            id: user.id,
            full_name: user.full_name,
            mobile_number: user.mobile_number,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Failed to resolve auth session:', error.message);
        next();
    }
}

function requireAdmin(req, res, next) {
    if (!req.authUser || req.authUser.role !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }

    next();
}

app.use('/api', ensureDbReady, resolveAuthenticatedUser, (req, res, next) => {
    if (req.path.startsWith('/auth/')) {
        return next();
    }

    if (!req.authUser) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    next();
});

app.post('/api/auth/request-otp', async (req, res) => {
    try {
        const mobileNumber = normalizeMobileNumber(req.body && req.body.mobile_number);

        if (!isValidMobileNumber(mobileNumber)) {
            return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
        }

        const user = await dbGet(
            `SELECT id, full_name, mobile_number, role
             FROM app_users
             WHERE mobile_number = ? AND is_active = 1`,
            [mobileNumber]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found or inactive.' });
        }

        const otp = createSixDigitOtp();
        const expiresAt = getFutureIsoByMinutes(OTP_TTL_MINUTES);

        await dbRun(`UPDATE user_otps SET used_at = ? WHERE user_id = ? AND used_at IS NULL`, [new Date().toISOString(), user.id]);
        await dbRun(
            `INSERT INTO user_otps (user_id, otp_code, expires_at)
             VALUES (?, ?, ?)`,
            [user.id, otp, expiresAt]
        );

        console.log(`[OTP] mobile=${user.mobile_number} otp=${otp} expiresAt=${expiresAt}`);

        res.json({
            message: 'OTP sent to registered mobile number.',
            otp: process.env.NODE_ENV === 'production' ? undefined : otp,
            expires_in_minutes: OTP_TTL_MINUTES
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const mobileNumber = normalizeMobileNumber(req.body && req.body.mobile_number);
        const otpCode = String((req.body && req.body.otp_code) || '').trim();

        if (!isValidMobileNumber(mobileNumber)) {
            return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return res.status(400).json({ error: 'Enter a valid 6-digit OTP.' });
        }

        const user = await dbGet(
            `SELECT id, full_name, mobile_number, role
             FROM app_users
             WHERE mobile_number = ? AND is_active = 1`,
            [mobileNumber]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found or inactive.' });
        }

        const latestOtp = await dbGet(
            `SELECT id, otp_code, expires_at
             FROM user_otps
             WHERE user_id = ? AND used_at IS NULL
             ORDER BY id DESC
             LIMIT 1`,
            [user.id]
        );

        if (!latestOtp) {
            return res.status(400).json({ error: 'OTP not requested. Please request OTP first.' });
        }

        if (new Date(latestOtp.expires_at).getTime() <= Date.now()) {
            return res.status(400).json({ error: 'OTP expired. Please request a new OTP.' });
        }

        if (latestOtp.otp_code !== otpCode) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        const nowIso = new Date().toISOString();
        await dbRun(`UPDATE user_otps SET used_at = ? WHERE id = ?`, [nowIso, latestOtp.id]);

        const sessionToken = createSessionToken();
        const sessionExpiresAt = getFutureIsoByHours(SESSION_TTL_HOURS);

        await dbRun(
            `INSERT INTO auth_sessions (user_id, session_token, expires_at)
             VALUES (?, ?, ?)`,
            [user.id, sessionToken, sessionExpiresAt]
        );

        setSessionCookie(res, sessionToken);

        res.json({
            message: 'Authentication successful.',
            user: {
                id: user.id,
                full_name: user.full_name,
                mobile_number: user.mobile_number,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/session', (req, res) => {
    if (!req.authUser) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    return res.json({ user: req.authUser });
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const sessionToken = req.cookies[SESSION_COOKIE_NAME];
        if (sessionToken) {
            await dbRun('DELETE FROM auth_sessions WHERE session_token = ?', [sessionToken]);
        }

        clearSessionCookie(res);
        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const users = await dbAll(
            `SELECT id, full_name, mobile_number, role, is_active, created_at, updated_at
             FROM app_users
             ORDER BY id ASC`
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', requireAdmin, async (req, res) => {
    try {
        const fullName = String((req.body && req.body.full_name) || '').trim();
        const mobileNumber = normalizeMobileNumber(req.body && req.body.mobile_number);
        const role = normalizeRoleName(req.body && req.body.role);
        const isActive = req.body && req.body.is_active === 0 ? 0 : 1;

        if (!fullName) {
            return res.status(400).json({ error: 'Full name is required.' });
        }

        if (!isValidMobileNumber(mobileNumber)) {
            return res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
        }

        if (!role) {
            return res.status(400).json({ error: 'Role must be Admin or Employee.' });
        }

        const existing = await dbGet('SELECT id FROM app_users WHERE mobile_number = ?', [mobileNumber]);
        if (existing) {
            return res.status(409).json({ error: 'A user with this mobile number already exists.' });
        }

        const insertResult = await dbRun(
            `INSERT INTO app_users (full_name, mobile_number, role, is_active, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
            [fullName, mobileNumber, role, isActive, new Date().toISOString()]
        );

        res.json({
            id: insertResult.lastID,
            full_name: fullName,
            mobile_number: mobileNumber,
            role,
            is_active: isActive
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        const fullName = String((req.body && req.body.full_name) || '').trim();
        const mobileNumber = normalizeMobileNumber(req.body && req.body.mobile_number);
        const role = normalizeRoleName(req.body && req.body.role);
        const isActive = req.body && req.body.is_active === 0 ? 0 : 1;

        if (!fullName) {
            return res.status(400).json({ error: 'Full name is required.' });
        }

        if (!isValidMobileNumber(mobileNumber)) {
            return res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
        }

        if (!role) {
            return res.status(400).json({ error: 'Role must be Admin or Employee.' });
        }

        const existingUser = await dbGet('SELECT id, role FROM app_users WHERE id = ?', [userId]);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const duplicateMobile = await dbGet('SELECT id FROM app_users WHERE mobile_number = ? AND id <> ?', [mobileNumber, userId]);
        if (duplicateMobile) {
            return res.status(409).json({ error: 'A user with this mobile number already exists.' });
        }

        if (existingUser.role === 'Admin' && (role !== 'Admin' || isActive === 0)) {
            const adminCountRow = await dbGet('SELECT COUNT(*) AS c FROM app_users WHERE role = ? AND is_active = 1', ['Admin']);
            if ((adminCountRow && adminCountRow.c) <= 1) {
                return res.status(400).json({ error: 'At least one active admin must remain.' });
            }
        }

        await dbRun(
            `UPDATE app_users
             SET full_name = ?, mobile_number = ?, role = ?, is_active = ?, updated_at = ?
             WHERE id = ?`,
            [fullName, mobileNumber, role, isActive, new Date().toISOString(), userId]
        );

        res.json({
            id: userId,
            full_name: fullName,
            mobile_number: mobileNumber,
            role,
            is_active: isActive
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Invalid user id.' });
        }

        if (req.authUser && req.authUser.id === userId) {
            return res.status(400).json({ error: 'You cannot delete your own user account.' });
        }

        const existingUser = await dbGet('SELECT id, role, is_active FROM app_users WHERE id = ?', [userId]);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (existingUser.role === 'Admin' && Number(existingUser.is_active) === 1) {
            const adminCountRow = await dbGet('SELECT COUNT(*) AS c FROM app_users WHERE role = ? AND is_active = 1', ['Admin']);
            if ((adminCountRow && adminCountRow.c) <= 1) {
                return res.status(400).json({ error: 'At least one active admin must remain.' });
            }
        }

        await dbRun('DELETE FROM app_users WHERE id = ?', [userId]);
        await dbRun('DELETE FROM auth_sessions WHERE user_id = ?', [userId]);
        await dbRun('DELETE FROM user_otps WHERE user_id = ?', [userId]);

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get all available daily stock categories
app.get('/api/attendance-employees', async (req, res) => {
    try {
        const rows = await dbAll(
            `SELECT employee_code AS id, employee_name AS name, department, joining_date, paid_amount AS paid, attendance_json
             FROM attendance_employees ORDER BY id ASC`
        );
        res.json(rows.map((row) => ({
            id: row.id,
            name: row.name,
            department: row.department,
            joiningDate: row.joining_date,
            paid: Number(row.paid) || 0,
            daily: JSON.parse(row.attendance_json || '[]')
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/attendance-employees/bulk', async (req, res) => {
    const employees = Array.isArray(req.body) ? req.body : req.body && req.body.employees;
    if (!Array.isArray(employees)) return res.status(400).json({ error: 'employees array is required.' });
    try {
        await dbRun('BEGIN TRANSACTION');
        for (const employee of employees) {
            const id = String(employee.id || '').trim();
            const name = String(employee.name || '').trim();
            const department = String(employee.department || '').trim();
            const joiningDate = String(employee.joiningDate || '').trim();
            if (!id || !name || !department || !/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) throw new Error('Each employee needs id, name, department, and joiningDate.');
            await dbRun(
                `INSERT INTO attendance_employees (employee_code, employee_name, department, joining_date, paid_amount, attendance_json, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(employee_code) DO UPDATE SET employee_name = excluded.employee_name, department = excluded.department,
                 joining_date = excluded.joining_date, paid_amount = excluded.paid_amount, attendance_json = excluded.attendance_json, updated_at = CURRENT_TIMESTAMP`,
                [id, name, department, joiningDate, Number(employee.paid) || 0, JSON.stringify(Array.isArray(employee.daily) ? employee.daily : [])]
            );
        }
        await dbRun('COMMIT');
        res.json({ message: 'Attendance employees saved.', count: employees.length });
    } catch (error) {
        try { await dbRun('ROLLBACK'); } catch (rollbackError) { /* transaction cleanup */ }
        res.status(400).json({ error: error.message });
    }
});
    function buildPurchaseSaleTransaction(body) {
        const transactionType = String(body && body.transaction_type || '').trim();
        const invoiceDate = String(body && body.invoice_date || '').trim();
        const invoiceNumber = String(body && body.invoice_number || '').trim();
        const billTo = String(body && body.bill_to || '').trim();
        const itemName = String(body && body.item_name || '').trim();
        const hsnCode = String(body && body.hsn_code || '').trim();
        const ewaybill = String(body && body.ewaybill || '').trim();
        const quantity = Number(body && body.quantity);
        const rate = Number(body && body.rate);
        const cgstPercent = Number(body && body.cgst_percent || 0);
        const sgstPercent = Number(body && body.sgst_percent || 0);
        const igstPercent = Number(body && body.igst_percent || 0);

        if (!['Purchase', 'Sale'].includes(transactionType) || !isValidDateString(invoiceDate) || !invoiceNumber || !billTo || !itemName || !hsnCode || !ewaybill || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(rate) || rate < 0 || [cgstPercent, sgstPercent, igstPercent].some((percent) => !Number.isFinite(percent) || percent < 0)) {
            throw new Error('Enter a valid invoice date, number, bill to, item, quantity, HSN code, rate, non-negative GST rates, and e-way bill.');
        }

        const valueAmount = quantity * rate;
        const cgstAmount = valueAmount * cgstPercent / 100;
        const sgstAmount = valueAmount * sgstPercent / 100;
        const igstAmount = valueAmount * igstPercent / 100;
        return [transactionType, invoiceDate, invoiceNumber, billTo, itemName, quantity, hsnCode, rate, valueAmount, cgstPercent, cgstAmount, sgstPercent, sgstAmount, igstPercent, igstAmount, valueAmount + cgstAmount + sgstAmount + igstAmount, String(body.delivery || '').trim(), String(body.dc_number || '').trim(), ewaybill];
    }

    app.get('/api/purchase-sales', async (req, res) => {
        try {
            const transactions = await dbAll('SELECT * FROM purchase_sales_transactions ORDER BY invoice_date DESC, id DESC');
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/purchase-sales', async (req, res) => {
        try {
            const transaction = buildPurchaseSaleTransaction(req.body);
            const result = await dbRun(
                `INSERT INTO purchase_sales_transactions (transaction_type, invoice_date, invoice_number, bill_to, item_name, quantity, hsn_code, rate, value_amount, cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount, amount, delivery, dc_number, ewaybill)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                transaction
            );
            res.status(201).json(await dbGet('SELECT * FROM purchase_sales_transactions WHERE id = ?', [result.lastID]));
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.put('/api/purchase-sales/:id', async (req, res) => {
        try {
            const transaction = buildPurchaseSaleTransaction(req.body);
            const result = await dbRun(
                `UPDATE purchase_sales_transactions SET transaction_type = ?, invoice_date = ?, invoice_number = ?, bill_to = ?, item_name = ?, quantity = ?, hsn_code = ?, rate = ?, value_amount = ?, cgst_percent = ?, cgst_amount = ?, sgst_percent = ?, sgst_amount = ?, igst_percent = ?, igst_amount = ?, amount = ?, delivery = ?, dc_number = ?, ewaybill = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [...transaction, Number(req.params.id)]
            );
            if (!result.changes) return res.status(404).json({ error: 'Transaction not found.' });
            res.json(await dbGet('SELECT * FROM purchase_sales_transactions WHERE id = ?', [Number(req.params.id)]));
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.delete('/api/purchase-sales/:id', async (req, res) => {
        try {
            const result = await dbRun('DELETE FROM purchase_sales_transactions WHERE id = ?', [Number(req.params.id)]);
            if (!result.changes) return res.status(404).json({ error: 'Transaction not found.' });
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

app.get('/api/daily-stock-categories', (req, res) => {
    db.all(
        `SELECT id, name
         FROM daily_stock_categories
         ORDER BY name COLLATE NOCASE ASC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// API: Add a new daily stock category
app.post('/api/daily-stock-categories', (req, res) => {
    const normalizedName = normalizeCategoryName(req.body && req.body.name);

    if (!normalizedName) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    db.get(
        `SELECT id, name
         FROM daily_stock_categories
         WHERE LOWER(name) = LOWER(?)`,
        [normalizedName],
        (findErr, existingRow) => {
            if (findErr) return res.status(500).json({ error: findErr.message });

            if (existingRow) {
                return res.status(409).json({ error: 'Category already exists.' });
            }

            db.run(
                'INSERT INTO daily_stock_categories (name) VALUES (?)',
                [normalizedName],
                function(insertErr) {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });
                    res.json({ id: this.lastID, name: normalizedName });
                }
            );
        }
    );
});

// API: Get daily stock sub-categories. They are stored per category so they remain available before stock rows are added.
// Also merges in any distinct "size" values already used in daily_stocks for this category, so older rows
// entered before the sub-category table existed still show up in the sub-category dropdown.
app.get('/api/daily-stock-subcategories', (req, res) => {
    const category = normalizeCategoryName(req.query.category);
    if (!category) return res.status(400).json({ error: 'Category is required.' });

    db.all(
        `SELECT name FROM daily_stock_subcategories WHERE category_name = ?
         UNION
         SELECT DISTINCT TRIM(size) AS name FROM daily_stocks WHERE category = ? AND TRIM(COALESCE(size, '')) != ''
         ORDER BY name COLLATE NOCASE ASC`,
        [category, category],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows.map((row) => ({ category_name: category, name: row.name })));
        }
    );
});

app.post('/api/daily-stock-subcategories', (req, res) => {
    const category = normalizeCategoryName(req.body && req.body.category);
    const name = normalizeCategoryName(req.body && req.body.name);
    if (!category || !name) return res.status(400).json({ error: 'Category and Sub-Category are required.' });

    db.run(
        'INSERT INTO daily_stock_subcategories (category_name, name) VALUES (?, ?)',
        [category, name],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Sub-Category already exists for this Category.' });
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, category_name: category, name });
        }
    );
});

// API: Get all items
app.get('/api/items', (req, res) => {
    const normalizedLocation = normalizeLocationName(req.query.location);

    if (!normalizedLocation) {
        return res.status(400).json({ error: 'Location is required.' });
    }

    if (!isSupportedLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Invalid location selected.' });
    }

    db.all(
        `SELECT id, date, location, inv_no, recipient, udise, recipient_address, vehicle_no, ewaybill_no, boys, girls
         FROM items
         WHERE location = ?
         ORDER BY id DESC`,
        [normalizedLocation],
        (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Add a new item
app.post('/api/items', (req, res) => {
    const {
        date,
        location,
        inv_no,
        recipient,
        udise,
        recipient_address,
        vehicle_no,
        ewaybill_no,
        boys,
        girls
    } = req.body;

    const normalizedLocation = normalizeLocationName(location);
    if (!isSupportedLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Valid location is required.' });
    }

    if (!isValidUdise(udise)) {
        return res.status(400).json({ error: 'UDISE No must be exactly 11 digits.' });
    }

    if (!isValidVehicleNo(vehicle_no)) {
        return res.status(400).json({ error: 'Vehicle No must be 10 or fewer alphanumeric characters.' });
    }

    if (!isValidEwaybillNo(ewaybill_no)) {
        return res.status(400).json({ error: 'EwayBill No must be exactly 12 digits.' });
    }

    db.run(
        `INSERT INTO items
        (date, location, inv_no, recipient, udise, recipient_address, vehicle_no, ewaybill_no, boys, girls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            date || '',
            normalizedLocation,
            inv_no || '',
            recipient || '',
            udise || '',
            recipient_address || '',
            vehicle_no || '',
            ewaybill_no || '',
            Number(boys) || 0,
            Number(girls) || 0
        ],
        function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            id: this.lastID,
            date,
            location: normalizedLocation,
            inv_no,
            recipient,
            udise,
            recipient_address,
            vehicle_no,
            ewaybill_no,
            boys: Number(boys) || 0,
            girls: Number(girls) || 0
        });
    });
});

// API: Update an item
app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const {
        date,
        location,
        inv_no,
        recipient,
        udise,
        recipient_address,
        vehicle_no,
        ewaybill_no,
        boys,
        girls
    } = req.body;

    const normalizedLocation = normalizeLocationName(location);
    if (!isSupportedLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Valid location is required.' });
    }

    if (!isValidUdise(udise)) {
        return res.status(400).json({ error: 'UDISE No must be exactly 11 digits.' });
    }

    if (!isValidVehicleNo(vehicle_no)) {
        return res.status(400).json({ error: 'Vehicle No must be 10 or fewer alphanumeric characters.' });
    }

    if (!isValidEwaybillNo(ewaybill_no)) {
        return res.status(400).json({ error: 'EwayBill No must be exactly 12 digits.' });
    }

    db.run(
        `UPDATE items
         SET date = ?,
             location = ?,
             inv_no = ?,
             recipient = ?,
             udise = ?,
             recipient_address = ?,
             vehicle_no = ?,
             ewaybill_no = ?,
             boys = ?,
             girls = ?
         WHERE id = ?`,
        [
            date || '',
            normalizedLocation,
            inv_no || '',
            recipient || '',
            udise || '',
            recipient_address || '',
            vehicle_no || '',
            ewaybill_no || '',
            Number(boys) || 0,
            Number(girls) || 0,
            id
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated successfully', changes: this.changes });
        }
    );
});

// API: Delete an item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM items WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted successfully', changes: this.changes });
    });
});

// API: Get daily stock rows by date and category
app.get('/api/daily-stocks', (req, res) => {
    const { date, category, location } = req.query;
    const normalizedCategory = normalizeCategoryName(category);
    const normalizedLocation = normalizeLocationName(location);

    if (!normalizedLocation) {
        return res.status(400).json({ error: 'Location is required.' });
    }

    if (!isSupportedLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Invalid location selected.' });
    }

    const whereClauses = [];
    const params = [];

    if (date) {
        if (!isValidDateString(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        whereClauses.push('stock_date = ?');
        params.push(date);
    }

    if (normalizedCategory) {
        whereClauses.push('category = ?');
        params.push(normalizedCategory);
    }

    whereClauses.push('location = ?');
    params.push(normalizedLocation);

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    db.all(
        `SELECT id, stock_date, location, category, size, qty_for_1_cabin, qty_for_20_cabin, stock_at_kpr, created_at
         FROM daily_stocks
         ${whereSql}
         ORDER BY id ASC`,
        params,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// API: Add daily stock row (today only)
app.post('/api/daily-stocks', (req, res) => {
    const { stock_date, location, category, size, qty_for_1_cabin, qty_for_20_cabin, cabin_count, stock_at_kpr } = req.body;
    const normalizedCategory = normalizeCategoryName(category);
    const normalizedLocation = normalizeLocationName(location);

    if (!isValidDateString(stock_date)) {
        return res.status(400).json({ error: 'Invalid stock_date format. Use YYYY-MM-DD.' });
    }

    if (stock_date > getTodayLocalISO()) {
        return res.status(400).json({ error: 'Future date is not allowed.' });
    }

    if (stock_date !== getTodayLocalISO()) {
        return res.status(403).json({ error: 'Past date is read-only. You can add records only for today.' });
    }

    if (!normalizedCategory) {
        return res.status(400).json({ error: 'Category is required.' });
    }

    if (!isSupportedLocation(normalizedLocation)) {
        return res.status(400).json({ error: 'Valid location is required.' });
    }

    if (!size || String(size).trim() === '') {
        return res.status(400).json({ error: 'Size is required.' });
    }

    const qtyOne = Number(qty_for_1_cabin);
    const cabinCount = Number(cabin_count);
    const qtyTwentyInput = Number(qty_for_20_cabin);
    const stockAtKpr = Number(stock_at_kpr);

    if (!Number.isFinite(qtyOne) || qtyOne < 0) {
        return res.status(400).json({ error: 'QTY FOR 1 CABIN must be a valid non-negative number.' });
    }

    let qtyTwenty = qtyTwentyInput;
    if (Number.isFinite(cabinCount) && cabinCount > 0) {
        qtyTwenty = qtyOne * Math.floor(cabinCount);
    }

    if (!Number.isFinite(qtyTwenty) || qtyTwenty < 0) {
        qtyTwenty = qtyOne * 20;
    }

    if (!Number.isFinite(stockAtKpr)) {
        return res.status(400).json({ error: 'STOCK AT KPR must be a valid number.' });
    }

    const normalizedSize = String(size).trim();

    db.get(
        `SELECT id, name
         FROM daily_stock_categories
         WHERE LOWER(name) = LOWER(?)`,
        [normalizedCategory],
        (categoryErr, categoryRow) => {
            if (categoryErr) {
                return res.status(500).json({ error: categoryErr.message });
            }

            if (!categoryRow) {
                return res.status(400).json({ error: 'Invalid category selected.' });
            }

            db.get(
                `SELECT id
                 FROM daily_stocks
                 WHERE stock_date = ? AND location = ? AND category = ? AND size = ?`,
                [stock_date, normalizedLocation, categoryRow.name, normalizedSize],
                (findErr, existingRow) => {
            if (findErr) {
                return res.status(500).json({ error: findErr.message });
            }

            if (existingRow) {
                db.run(
                    `UPDATE daily_stocks
                     SET qty_for_1_cabin = ?,
                         qty_for_20_cabin = ?,
                         stock_at_kpr = ?
                     WHERE id = ?`,
                    [qtyOne, qtyTwenty, stockAtKpr, existingRow.id],
                    function(updateErr) {
                        if (updateErr) return res.status(500).json({ error: updateErr.message });

                        res.json({
                            id: existingRow.id,
                            stock_date,
                            location: normalizedLocation,
                            category: categoryRow.name,
                            size: normalizedSize,
                            qty_for_1_cabin: qtyOne,
                            qty_for_20_cabin: qtyTwenty,
                            stock_at_kpr: stockAtKpr,
                            action: 'updated'
                        });
                    }
                );

                return;
            }

            db.run(
                `INSERT INTO daily_stocks (stock_date, location, category, size, qty_for_1_cabin, qty_for_20_cabin, stock_at_kpr)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [stock_date, normalizedLocation, categoryRow.name, normalizedSize, qtyOne, qtyTwenty, stockAtKpr],
                function(insertErr) {
                    if (insertErr) return res.status(500).json({ error: insertErr.message });

                    res.json({
                        id: this.lastID,
                        stock_date,
                        location: normalizedLocation,
                        category: categoryRow.name,
                        size: normalizedSize,
                        qty_for_1_cabin: qtyOne,
                        qty_for_20_cabin: qtyTwenty,
                        stock_at_kpr: stockAtKpr,
                        action: 'inserted'
                    });
                }
            );
                }
            );
        }
    );
});

// API: Update daily stock row by id (today only)
app.put('/api/daily-stocks/:id', (req, res) => {
    const { id } = req.params;
    const { size, qty_for_1_cabin, stock_at_kpr, cabin_count } = req.body;

    const rowId = Number(id);
    if (!Number.isInteger(rowId) || rowId <= 0) {
        return res.status(400).json({ error: 'Invalid row id.' });
    }

    const normalizedSize = String(size || '').trim();
    const qtyOne = Number(qty_for_1_cabin);
    const stockAtKpr = Number(stock_at_kpr);
    const cabinCount = Number(cabin_count);

    if (!normalizedSize) {
        return res.status(400).json({ error: 'Size is required.' });
    }

    if (!Number.isFinite(qtyOne) || qtyOne < 0) {
        return res.status(400).json({ error: 'QTY FOR 1 CABIN must be a valid non-negative number.' });
    }

    if (!Number.isFinite(stockAtKpr)) {
        return res.status(400).json({ error: 'STOCK AT KPR must be a valid number.' });
    }

    const resolvedCabinCount = Number.isFinite(cabinCount) && cabinCount > 0 ? Math.floor(cabinCount) : 20;
    const qtyForCount = qtyOne * resolvedCabinCount;

    db.get('SELECT id, stock_date, category FROM daily_stocks WHERE id = ?', [rowId], (findErr, existingRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!existingRow) {
            return res.status(404).json({ error: 'Row not found.' });
        }

        if (existingRow.stock_date !== getTodayLocalISO()) {
            return res.status(403).json({ error: 'Past date is read-only. You can edit rows only for today.' });
        }

        db.run(
            `UPDATE daily_stocks
             SET size = ?, qty_for_1_cabin = ?, qty_for_20_cabin = ?, stock_at_kpr = ?
             WHERE id = ?`,
            [normalizedSize, qtyOne, qtyForCount, stockAtKpr, rowId],
            function(updateErr) {
                if (updateErr) {
                    if (updateErr.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'A row already exists with this description for today and selected category.' });
                    }

                    return res.status(500).json({ error: updateErr.message });
                }

                res.json({
                    id: rowId,
                    stock_date: existingRow.stock_date,
                    category: existingRow.category,
                    size: normalizedSize,
                    qty_for_1_cabin: qtyOne,
                    qty_for_20_cabin: qtyForCount,
                    stock_at_kpr: stockAtKpr,
                    action: 'updated'
                });
            }
        );
    });
});

// API: Delete daily stock row by id (today only)
app.delete('/api/daily-stocks/:id', (req, res) => {
    const { id } = req.params;
    const rowId = Number(id);

    if (!Number.isInteger(rowId) || rowId <= 0) {
        return res.status(400).json({ error: 'Invalid row id.' });
    }

    db.get('SELECT id, stock_date FROM daily_stocks WHERE id = ?', [rowId], (findErr, existingRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!existingRow) {
            return res.status(404).json({ error: 'Row not found.' });
        }

        if (existingRow.stock_date !== getTodayLocalISO()) {
            return res.status(403).json({ error: 'Past date is read-only. You can delete rows only for today.' });
        }

        db.run('DELETE FROM daily_stocks WHERE id = ?', [rowId], function(deleteErr) {
            if (deleteErr) {
                return res.status(500).json({ error: deleteErr.message });
            }

            res.json({ message: 'Deleted successfully', changes: this.changes });
        });
    });
});

// API: Get contractor payment overview
app.get('/api/contractor-payments', (req, res) => {
    const {
        fromDate,
        toDate,
        status,
        workType,
        search
    } = req.query;

    const hasDateFilter = isValidDateString(fromDate) && isValidDateString(toDate);
    const dateCondition = hasDateFilter ? 'payment_date >= ? AND payment_date <= ?' : '1 = 1';
    const dateParams = hasDateFilter ? [fromDate, toDate] : [];

    const sql = `
        SELECT
            cp.id,
            cp.contractor_name,
            cp.fabrication,
            cp.cement_sheet,
            cp.electrical,
            cp.tiles,
            cp.plumbing,
            cp.door_fitting,
            cp.outer_colour,
            cp.inner_colour,
            cp.total_amount,
            COALESCE(cp.remark, '') AS remark,
            COALESCE(SUM(CASE WHEN ${dateCondition} THEN cpt.payment_amount ELSE 0 END), 0) AS total_payment
        FROM contractor_payments cp
        LEFT JOIN contractor_payment_transactions cpt
            ON cpt.contractor_id = cp.id
        GROUP BY cp.id
        ORDER BY cp.contractor_name COLLATE NOCASE ASC
    `;

    db.all(sql, [...dateParams], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const normalizedSearch = String(search || '').trim().toLowerCase();
        const normalizedStatus = String(status || 'ALL').toUpperCase();
        const normalizedWorkType = String(workType || 'ALL');

        const workTypeColumnMap = {
            Fabrication: 'fabrication',
            'Cement Sheet': 'cement_sheet',
            Electrical: 'electrical',
            Tiles: 'tiles',
            Plumbing: 'plumbing',
            'Door Fitting': 'door_fitting',
            'Outer Colour': 'outer_colour',
            'Inner Colour': 'inner_colour'
        };

        const result = rows
            .map((row) => {
                const totalAmount = Number(row.total_amount) || 0;
                const totalPayment = Number(row.total_payment) || 0;
                const balance = totalAmount - totalPayment;

                let paymentStatus = 'PENDING';
                if (balance === 0) {
                    paymentStatus = 'MATCH';
                } else if (balance < 0) {
                    paymentStatus = 'OVERPAID';
                } else if (totalPayment > 0) {
                    paymentStatus = 'MISMATCH';
                }

                return {
                    id: row.id,
                    contractor_name: row.contractor_name,
                    fabrication: Number(row.fabrication) || 0,
                    cement_sheet: Number(row.cement_sheet) || 0,
                    electrical: Number(row.electrical) || 0,
                    tiles: Number(row.tiles) || 0,
                    plumbing: Number(row.plumbing) || 0,
                    door_fitting: Number(row.door_fitting) || 0,
                    outer_colour: Number(row.outer_colour) || 0,
                    inner_colour: Number(row.inner_colour) || 0,
                    total_amount: totalAmount,
                    total_payment: totalPayment,
                    balance_payable: balance,
                    payment_status: paymentStatus,
                    remark: row.remark || ''
                };
            })
            .filter((row) => {
                if (normalizedSearch) {
                    const haystack = `${row.contractor_name} ${row.remark}`.toLowerCase();
                    if (!haystack.includes(normalizedSearch)) {
                        return false;
                    }
                }

                if (normalizedStatus !== 'ALL' && row.payment_status !== normalizedStatus) {
                    return false;
                }

                if (normalizedWorkType !== 'ALL') {
                    const targetColumn = workTypeColumnMap[normalizedWorkType];
                    if (!targetColumn) {
                        return false;
                    }

                    if ((Number(row[targetColumn]) || 0) <= 0) {
                        return false;
                    }
                }

                return true;
            });

        res.json({
            workTypes: CONTRACTOR_WORK_TYPES,
            appliedFilters: {
                fromDate: hasDateFilter ? fromDate : null,
                toDate: hasDateFilter ? toDate : null,
                status: normalizedStatus,
                workType: normalizedWorkType,
                search: normalizedSearch
            },
            rows: result
        });
    });
});

// API: List contractor names for payment modal
app.get('/api/contractor-payment-contractors', (req, res) => {
    db.all(
        `SELECT id, contractor_name
         FROM contractor_payments
         ORDER BY contractor_name COLLATE NOCASE ASC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(rows);
        }
    );
});

// API: Add contractor master row
app.post('/api/contractor-payments', (req, res) => {
    const contractorName = normalizeContractorName(req.body && req.body.contractor_name);

    if (!contractorName) {
        return res.status(400).json({ error: 'Contractor name is required.' });
    }

    const fabrication = Number(req.body && req.body.fabrication) || 0;
    const cementSheet = Number(req.body && req.body.cement_sheet) || 0;
    const electrical = Number(req.body && req.body.electrical) || 0;
    const tiles = Number(req.body && req.body.tiles) || 0;
    const plumbing = Number(req.body && req.body.plumbing) || 0;
    const doorFitting = Number(req.body && req.body.door_fitting) || 0;
    const outerColour = Number(req.body && req.body.outer_colour) || 0;
    const innerColour = Number(req.body && req.body.inner_colour) || 0;
    const totalAmount = Number(req.body && req.body.total_amount) || 0;
    const remark = String((req.body && req.body.remark) || '').trim();

    const values = [fabrication, cementSheet, electrical, tiles, plumbing, doorFitting, outerColour, innerColour, totalAmount];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        return res.status(400).json({ error: 'Numeric fields must be valid non-negative values.' });
    }

    db.get(
        `SELECT id
         FROM contractor_payments
         WHERE LOWER(contractor_name) = LOWER(?)`,
        [contractorName],
        (findErr, existingRow) => {
            if (findErr) {
                return res.status(500).json({ error: findErr.message });
            }

            if (existingRow) {
                return res.status(409).json({ error: 'Contractor already exists.' });
            }

            db.run(
                `INSERT INTO contractor_payments
                 (contractor_name, fabrication, cement_sheet, electrical, tiles, plumbing, door_fitting, outer_colour, inner_colour, total_amount, remark)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [contractorName, fabrication, cementSheet, electrical, tiles, plumbing, doorFitting, outerColour, innerColour, totalAmount, remark],
                function(insertErr) {
                    if (insertErr) {
                        return res.status(500).json({ error: insertErr.message });
                    }

                    res.json({
                        id: this.lastID,
                        contractor_name: contractorName,
                        fabrication,
                        cement_sheet: cementSheet,
                        electrical,
                        tiles,
                        plumbing,
                        door_fitting: doorFitting,
                        outer_colour: outerColour,
                        inner_colour: innerColour,
                        total_amount: totalAmount,
                        remark
                    });
                }
            );
        }
    );
});

// API: Update contractor master row
app.put('/api/contractor-payments/:id', (req, res) => {
    const contractorId = Number(req.params.id);
    if (!Number.isInteger(contractorId) || contractorId <= 0) {
        return res.status(400).json({ error: 'Invalid contractor id.' });
    }

    const contractorName = normalizeContractorName(req.body && req.body.contractor_name);
    if (!contractorName) {
        return res.status(400).json({ error: 'Contractor name is required.' });
    }

    const fabrication = Number(req.body && req.body.fabrication) || 0;
    const cementSheet = Number(req.body && req.body.cement_sheet) || 0;
    const electrical = Number(req.body && req.body.electrical) || 0;
    const tiles = Number(req.body && req.body.tiles) || 0;
    const plumbing = Number(req.body && req.body.plumbing) || 0;
    const doorFitting = Number(req.body && req.body.door_fitting) || 0;
    const outerColour = Number(req.body && req.body.outer_colour) || 0;
    const innerColour = Number(req.body && req.body.inner_colour) || 0;
    const totalAmount = Number(req.body && req.body.total_amount) || 0;
    const remark = String((req.body && req.body.remark) || '').trim();

    const values = [fabrication, cementSheet, electrical, tiles, plumbing, doorFitting, outerColour, innerColour, totalAmount];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
        return res.status(400).json({ error: 'Numeric fields must be valid non-negative values.' });
    }

    db.get('SELECT id FROM contractor_payments WHERE id = ?', [contractorId], (findErr, existingRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!existingRow) {
            return res.status(404).json({ error: 'Contractor not found.' });
        }

        db.get(
            `SELECT id FROM contractor_payments WHERE LOWER(contractor_name) = LOWER(?) AND id <> ?`,
            [contractorName, contractorId],
            (dupErr, duplicateRow) => {
                if (dupErr) {
                    return res.status(500).json({ error: dupErr.message });
                }

                if (duplicateRow) {
                    return res.status(409).json({ error: 'Contractor name already exists.' });
                }

                db.run(
                    `UPDATE contractor_payments
                     SET contractor_name = ?,
                         fabrication = ?,
                         cement_sheet = ?,
                         electrical = ?,
                         tiles = ?,
                         plumbing = ?,
                         door_fitting = ?,
                         outer_colour = ?,
                         inner_colour = ?,
                         total_amount = ?,
                         remark = ?
                     WHERE id = ?`,
                    [contractorName, fabrication, cementSheet, electrical, tiles, plumbing, doorFitting, outerColour, innerColour, totalAmount, remark, contractorId],
                    function(updateErr) {
                        if (updateErr) {
                            return res.status(500).json({ error: updateErr.message });
                        }

                        res.json({
                            id: contractorId,
                            contractor_name: contractorName,
                            fabrication,
                            cement_sheet: cementSheet,
                            electrical,
                            tiles,
                            plumbing,
                            door_fitting: doorFitting,
                            outer_colour: outerColour,
                            inner_colour: innerColour,
                            total_amount: totalAmount,
                            remark,
                            changes: this.changes
                        });
                    }
                );
            }
        );
    });
});

// API: Delete contractor master row
app.delete('/api/contractor-payments/:id', (req, res) => {
    const contractorId = Number(req.params.id);
    if (!Number.isInteger(contractorId) || contractorId <= 0) {
        return res.status(400).json({ error: 'Invalid contractor id.' });
    }

    db.get('SELECT id FROM contractor_payments WHERE id = ?', [contractorId], (findErr, existingRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!existingRow) {
            return res.status(404).json({ error: 'Contractor not found.' });
        }

        db.run('DELETE FROM contractor_payment_transactions WHERE contractor_id = ?', [contractorId], (deleteTxnErr) => {
            if (deleteTxnErr) {
                return res.status(500).json({ error: deleteTxnErr.message });
            }

            db.run('DELETE FROM contractor_payments WHERE id = ?', [contractorId], function(deleteErr) {
                if (deleteErr) {
                    return res.status(500).json({ error: deleteErr.message });
                }

                res.json({ message: 'Contractor deleted successfully.', changes: this.changes });
            });
        });
    });
});

function handleGetContractorDayWise(req, res) {
    const contractorId = Number(req.params.id);
    if (!Number.isInteger(contractorId) || contractorId <= 0) {
        return res.status(400).json({ error: 'Invalid contractor id.' });
    }

    const { fromDate, toDate } = req.query;
    const hasDateFilter = isValidDateString(fromDate) && isValidDateString(toDate);

    let whereSql = 'WHERE contractor_id = ?';
    const params = [contractorId];

    if (hasDateFilter) {
        whereSql += ' AND payment_date >= ? AND payment_date <= ?';
        params.push(fromDate, toDate);
    }

    db.get('SELECT id, contractor_name FROM contractor_payments WHERE id = ?', [contractorId], (findErr, contractorRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!contractorRow) {
            return res.status(404).json({ error: 'Contractor not found.' });
        }

        db.all(
                `SELECT payment_date,
                    paid_by,
                    payment_mode,
                    payment_amount,
                    id
             FROM contractor_payment_transactions
             ${whereSql}
                 ORDER BY payment_date DESC, id DESC`,
            params,
            (txnErr, rows) => {
                if (txnErr) {
                    return res.status(500).json({ error: txnErr.message });
                }

                res.json({
                    contractor: {
                        id: contractorRow.id,
                        contractor_name: contractorRow.contractor_name
                    },
                    period: {
                        fromDate: hasDateFilter ? fromDate : null,
                        toDate: hasDateFilter ? toDate : null
                    },
                    dayWise: rows.map((row) => ({
                        id: row.id,
                        payment_date: row.payment_date,
                        paid_by: row.paid_by || '',
                        payment_mode: row.payment_mode || '',
                        remarks: row.remarks || '',
                        total_amount: Number(row.payment_amount) || 0
                    }))
                });
            }
        );
    });
}

// API: Get day-wise payment details for contractor in selected period
app.get('/api/contractor-payments/:id/transactions', handleGetContractorDayWise);
app.get('/api/contractor-payments/:id/daywise', handleGetContractorDayWise);

app.put('/api/contractor-payments/:id/payments/:transactionId', (req, res) => {
    const contractorId = Number(req.params.id);
    const transactionId = Number(req.params.transactionId);
    const { payment_date, payment_amount, payment_mode, paid_by, remarks } = req.body || {};
    const amount = Number(payment_amount);
    if (!Number.isInteger(contractorId) || !Number.isInteger(transactionId) || contractorId <= 0 || transactionId <= 0) return res.status(400).json({ error: 'Invalid payment selected.' });
    if (!isValidDateString(payment_date) || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Valid payment date and positive amount are required.' });
    db.run(
        `UPDATE contractor_payment_transactions
         SET payment_date = ?, payment_amount = ?, payment_mode = ?, paid_by = ?, remarks = ?
         WHERE id = ? AND contractor_id = ?`,
        [payment_date, amount, String(payment_mode || 'Online').trim() || 'Online', String(paid_by || '').trim(), String(remarks || '').trim(), transactionId, contractorId],
        function(updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            if (!this.changes) return res.status(404).json({ error: 'Payment transaction not found.' });
            res.json({ message: 'Payment updated.', changes: this.changes });
        }
    );
});

app.delete('/api/contractor-payments/:id/payments/:transactionId', (req, res) => {
    const contractorId = Number(req.params.id);
    const transactionId = Number(req.params.transactionId);
    if (!Number.isInteger(contractorId) || !Number.isInteger(transactionId) || contractorId <= 0 || transactionId <= 0) return res.status(400).json({ error: 'Invalid payment selected.' });
    db.run('DELETE FROM contractor_payment_transactions WHERE id = ? AND contractor_id = ?', [transactionId, contractorId], function(deleteErr) {
        if (deleteErr) return res.status(500).json({ error: deleteErr.message });
        if (!this.changes) return res.status(404).json({ error: 'Payment transaction not found.' });
        res.json({ message: 'Payment deleted.', changes: this.changes });
    });
});

// API: Add contractor payment transaction
app.post('/api/contractor-payments/:id/payments', (req, res) => {
    const contractorId = Number(req.params.id);
    const {
        payment_date,
        payment_amount,
        payment_mode,
        paid_by,
        remarks
    } = req.body || {};

    if (!Number.isInteger(contractorId) || contractorId <= 0) {
        return res.status(400).json({ error: 'Invalid contractor id.' });
    }

    if (!isValidDateString(payment_date)) {
        return res.status(400).json({ error: 'Valid payment_date is required in YYYY-MM-DD format.' });
    }

    const amount = Number(payment_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Payment amount must be a positive number.' });
    }

    const mode = String(payment_mode || 'Online').trim() || 'Online';
    const paidBy = String(paid_by || '').trim();
    const remarksText = String(remarks || '').trim();

    db.get('SELECT id, contractor_name FROM contractor_payments WHERE id = ?', [contractorId], (findErr, contractorRow) => {
        if (findErr) {
            return res.status(500).json({ error: findErr.message });
        }

        if (!contractorRow) {
            return res.status(404).json({ error: 'Contractor not found.' });
        }

        db.run(
            `INSERT INTO contractor_payment_transactions
             (contractor_id, payment_date, payment_amount, payment_mode, paid_by, remarks)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [contractorId, payment_date, amount, mode, paidBy, remarksText],
            function(insertErr) {
                if (insertErr) {
                    return res.status(500).json({ error: insertErr.message });
                }

                res.json({
                    id: this.lastID,
                    contractor_id: contractorId,
                    contractor_name: contractorRow.contractor_name,
                    payment_date,
                    payment_amount: amount,
                    payment_mode: mode,
                    paid_by: paidBy,
                    remarks: remarksText
                });
            }
        );
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});