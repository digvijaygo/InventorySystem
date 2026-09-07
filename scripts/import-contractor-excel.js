const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');

const workbookPath = path.resolve(__dirname, '..', 'assets', 'Final Contractor Sheet.xlsx');
const dbPath = path.resolve(__dirname, '..', 'inventory.db');

function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeText(value) {
    return String(value || '').trim();
}

function buildImportRows() {
    const workbook = XLSX.readFile(workbookPath);
    const summarySheet = workbook.Sheets.Summary;

    if (!summarySheet) {
        throw new Error('Summary sheet not found in workbook.');
    }

    const rows = XLSX.utils.sheet_to_json(summarySheet, { header: 1, defval: '' });

    const byContractor = new Map();

    rows.forEach((row) => {
        const contractorName = normalizeName(row[1]);
        if (!contractorName) {
            return;
        }

        const mapped = {
            contractor_name: contractorName,
            fabrication: toNumber(row[2]),
            cement_sheet: toNumber(row[3]),
            electrical: toNumber(row[4]),
            tiles: toNumber(row[5]),
            plumbing: toNumber(row[6]),
            door_fitting: toNumber(row[7]),
            outer_colour: toNumber(row[8]),
            inner_colour: toNumber(row[9]),
            total_amount: toNumber(row[10]),
            total_payment: toNumber(row[11]),
            remark: normalizeText(row[14]),
            paid_flag: normalizeText(row[13]),
            sr_no: toNumber(row[0])
        };

        const hasNumbers = [
            mapped.fabrication,
            mapped.cement_sheet,
            mapped.electrical,
            mapped.tiles,
            mapped.plumbing,
            mapped.door_fitting,
            mapped.outer_colour,
            mapped.inner_colour,
            mapped.total_amount,
            mapped.total_payment
        ].some((value) => value !== 0);

        const existing = byContractor.get(contractorName);
        if (!existing) {
            byContractor.set(contractorName, {
                ...mapped,
                hasNumbers
            });
            return;
        }

        // Prefer rows that contain numeric values over placeholder-only rows.
        if (!existing.hasNumbers && hasNumbers) {
            byContractor.set(contractorName, {
                ...mapped,
                hasNumbers
            });
            return;
        }

        // If both have numbers, keep the one with larger total amount as more complete.
        if (hasNumbers && existing.hasNumbers && mapped.total_amount > existing.total_amount) {
            byContractor.set(contractorName, {
                ...mapped,
                hasNumbers
            });
        }
    });

    const importRows = Array.from(byContractor.values()).map((row) => {
        const finalRemark = row.remark || row.paid_flag;
        return {
            contractor_name: row.contractor_name,
            fabrication: row.fabrication,
            cement_sheet: row.cement_sheet,
            electrical: row.electrical,
            tiles: row.tiles,
            plumbing: row.plumbing,
            door_fitting: row.door_fitting,
            outer_colour: row.outer_colour,
            inner_colour: row.inner_colour,
            total_amount: row.total_amount,
            total_payment: row.total_payment,
            remark: finalRemark
        };
    });

    importRows.sort((a, b) => a.contractor_name.localeCompare(b.contractor_name));
    return importRows;
}

function run() {
    const importRows = buildImportRows();
    const db = new sqlite3.Database(dbPath);
    const today = new Date().toISOString().slice(0, 10);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM contractor_payment_transactions');
        db.run('DELETE FROM contractor_payments');

        const insertContractor = db.prepare(
            `INSERT INTO contractor_payments
             (contractor_name, fabrication, cement_sheet, electrical, tiles, plumbing, door_fitting, outer_colour, inner_colour, total_amount, remark)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const insertPayment = db.prepare(
            `INSERT INTO contractor_payment_transactions
             (contractor_id, payment_date, payment_amount, payment_mode, paid_by, remarks)
             VALUES (?, ?, ?, ?, ?, ?)`
        );

        let contractorCount = 0;
        let paymentCount = 0;

        function finalizeWithError(errorMessage) {
            db.run('ROLLBACK', () => {
                db.close();
                console.error(errorMessage);
                process.exitCode = 1;
            });
        }

        function commitAndClose() {
            db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                    finalizeWithError(`Commit failed: ${commitErr.message}`);
                    return;
                }

                db.close((closeErr) => {
                    if (closeErr) {
                        console.error(`Database close warning: ${closeErr.message}`);
                    }

                    console.log(`Imported ${contractorCount} contractors and ${paymentCount} opening payment transactions.`);
                });
            });
        }

        let index = 0;

        function insertNext() {
            if (index >= importRows.length) {
                insertContractor.finalize((finalizeErr) => {
                    if (finalizeErr) {
                        finalizeWithError(`Finalize contractor statement failed: ${finalizeErr.message}`);
                        return;
                    }

                    insertPayment.finalize((paymentFinalizeErr) => {
                        if (paymentFinalizeErr) {
                            finalizeWithError(`Finalize payment statement failed: ${paymentFinalizeErr.message}`);
                            return;
                        }

                        commitAndClose();
                    });
                });
                return;
            }

            const row = importRows[index];
            index += 1;

            insertContractor.run(
                [
                    row.contractor_name,
                    row.fabrication,
                    row.cement_sheet,
                    row.electrical,
                    row.tiles,
                    row.plumbing,
                    row.door_fitting,
                    row.outer_colour,
                    row.inner_colour,
                    row.total_amount,
                    row.remark
                ],
                function(insertErr) {
                    if (insertErr) {
                        finalizeWithError(`Insert contractor failed for ${row.contractor_name}: ${insertErr.message}`);
                        return;
                    }

                    contractorCount += 1;
                    const contractorId = this.lastID;

                    if (row.total_payment > 0) {
                        insertPayment.run(
                            [
                                contractorId,
                                today,
                                row.total_payment,
                                'Imported',
                                'Excel Migration',
                                'Opening payment imported from Final Contractor Sheet.xlsx'
                            ],
                            (paymentErr) => {
                                if (paymentErr) {
                                    finalizeWithError(`Insert payment failed for ${row.contractor_name}: ${paymentErr.message}`);
                                    return;
                                }

                                paymentCount += 1;
                                insertNext();
                            }
                        );
                    } else {
                        insertNext();
                    }
                }
            );
        }

        insertNext();
    });
}

run();
