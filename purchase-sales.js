(function () {
    'use strict';

    const API_URL = '/api/purchase-sales';
    const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
    const rows = document.querySelector('#transactionRows');
    const count = document.querySelector('#recordCount');
    const transactions = [];

    const COMPANY_DETAILS = {
        name: 'ARNEEL INDUSTRIES 26-27',
        addressLines: ['Plot No. 66, Gut No.41,', 'Karodi Industrial Area,Waluj MIDC,', 'Chhatrapati Sambhajinagar - 431136.'],
        gstin: '27ELXPK3596P1ZP',
        stateName: 'Maharashtra',
        stateCode: '27',
        contact: '9096947530',
        email: 'anilkhoje03@gmail.com',
        jurisdiction: 'SUBJECT TO CHHATRAPATI SAMBHAJI NAGAR JURISDICTION'
    };

    function numberToWordsIndian(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        function twoDigits(value) {
            if (value < 20) return ones[value];
            return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`;
        }
        function threeDigits(value) {
            if (value < 100) return twoDigits(value);
            return `${ones[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${twoDigits(value % 100)}` : ''}`;
        }
        let value = Math.floor(Math.abs(num));
        if (value === 0) return 'Zero';
        const crore = Math.floor(value / 10000000); value %= 10000000;
        const lakh = Math.floor(value / 100000); value %= 100000;
        const thousand = Math.floor(value / 1000); value %= 1000;
        const hundred = value;
        const parts = [];
        if (crore) parts.push(`${threeDigits(crore)} Crore`);
        if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
        if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
        if (hundred) parts.push(threeDigits(hundred));
        return parts.join(' ');
    }

    function amountInWords(amount) {
        return `INR ${numberToWordsIndian(amount)} Only`;
    }

    const inrGrouped = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function inrNumber(value) {
        return inrGrouped.format(Number(value || 0));
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>\"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
    }

    function today() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function formatDate(value) {
        return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function taxCell(amount, percent) {
        return `${currency.format(Number(amount || 0))}<small class="tax-rate">${Number(percent || 0)}%</small>`;
    }

    function compactCurrency(value) {
        const amount = Number(value || 0);
        if (amount >= 100000) return `₹${Number((amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1))}L`;
        if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
        return `₹${Math.round(amount)}`;
    }

    function chartMonths(period) {
        const now = new Date();
        const months = [];
        if (period === 'This Year') {
            for (let month = 0; month <= now.getMonth(); month += 1) months.push(new Date(now.getFullYear(), month, 1));
        } else {
            const total = period === 'Last 12 Months' ? 12 : 6;
            for (let offset = total - 1; offset >= 0; offset -= 1) months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
        }
        return months;
    }

    function renderChart() {
        const yAxis = document.querySelectorAll('.chart-y-axis span');
        const barsContainer = document.querySelector('.bars');
        if (!barsContainer) return;
        const period = document.querySelector('.period-select');
        const months = chartMonths(period ? period.value : 'Last 6 Months');
        const monthlyTotals = months.map((date) => {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthTransactions = transactions.filter((transaction) => String(transaction.invoice_date || '').startsWith(key));
            const purchase = monthTransactions.filter((transaction) => transaction.transaction_type === 'Purchase').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
            const sale = monthTransactions.filter((transaction) => transaction.transaction_type === 'Sale').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
            return { date, purchase, sale };
        });
        const hasData = monthlyTotals.some((month) => month.purchase > 0 || month.sale > 0);
        const maxValue = hasData ? Math.max(...monthlyTotals.map((month) => Math.max(month.purchase, month.sale))) : 0;
        if (yAxis.length) {
            const step = maxValue / (yAxis.length - 1);
            yAxis.forEach((label, index) => {
                label.textContent = hasData ? compactCurrency(step * (yAxis.length - 1 - index)) : '₹0';
            });
        }
        barsContainer.innerHTML = monthlyTotals.map(({ date, purchase, sale }) => `<div class="month">
            <div class="bar purchase" style="height:${hasData ? Math.max(2, Math.round((purchase / maxValue) * 100)) : 0}%" title="${compactCurrency(purchase)}"></div>
            <div class="bar sale" style="height:${hasData ? Math.max(2, Math.round((sale / maxValue) * 100)) : 0}%" title="${compactCurrency(sale)}"></div>
            <span>${date.toLocaleDateString('en-IN', { month: 'short' })}</span>
        </div>`).join('');
    }

    function renderTopProducts() {
        const productList = document.querySelector('.product-list');
        if (!productList) return;
        const totals = transactions.filter((transaction) => transaction.transaction_type === 'Sale').reduce((summary, transaction) => {
            const name = transaction.item_name || 'Unknown';
            summary[name] = (summary[name] || 0) + Number(transaction.quantity || 0);
            return summary;
        }, {});
        const topProducts = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4);
        if (!topProducts.length) {
            productList.innerHTML = '<p class="empty-state">No sales recorded yet.</p>';
            return;
        }
        const maxQuantity = topProducts[0][1];
        productList.innerHTML = topProducts.map(([name, quantity]) => `<div class="product-row">
            <div class="product-icon"><i class="fa-solid fa-cube"></i></div>
            <div class="product-info"><strong>${escapeHtml(name)}</strong><span>${quantity} units sold</span></div>
            <div class="product-progress"><div style="width:${Math.max(4, Math.round((quantity / maxQuantity) * 100))}%"></div></div>
        </div>`).join('');
    }

    function filteredTransactions() {
        const fromDate = document.querySelector('#fromDate').value;
        const toDate = document.querySelector('#toDate').value;
        const type = document.querySelector('#transactionTypeFilter').value;
        const product = document.querySelector('#productFilter').value;
        const query = document.querySelector('#transactionSearch').value.trim().toLowerCase();
        return transactions.filter((transaction) => {
            const searchable = `${transaction.invoice_number} ${transaction.bill_to} ${transaction.item_name} ${transaction.ewaybill}`.toLowerCase();
            return (!fromDate || transaction.invoice_date >= fromDate) && (!toDate || transaction.invoice_date <= toDate) &&
                (type === 'All Transactions' || transaction.transaction_type === type) &&
                (product === 'All Products' || transaction.item_name === product) && (!query || searchable.includes(query));
        });
    }

    function render() {
        const visibleTransactions = filteredTransactions();
        rows.innerHTML = visibleTransactions.length ? visibleTransactions.map((transaction) => `<tr>
            <td><span class="type-badge ${transaction.transaction_type.toLowerCase()}">${transaction.transaction_type}</span></td>
            <td>${formatDate(transaction.invoice_date)}</td>
            <td><strong>${escapeHtml(transaction.invoice_number)}</strong></td>
            <td>${escapeHtml(transaction.bill_to)}</td>
            <td>${escapeHtml(transaction.ship_to || '-')}</td>
            <td>${escapeHtml(transaction.item_name)}</td>
            <td>${Number(transaction.quantity)}</td>
            <td>${escapeHtml(transaction.hsn_code)}</td>
            <td>${currency.format(transaction.rate)}</td>
            <td><strong>${currency.format(transaction.value_amount)}</strong></td>
            <td>${taxCell(transaction.cgst_amount, transaction.cgst_percent)}</td>
            <td>${taxCell(transaction.sgst_amount, transaction.sgst_percent)}</td>
            <td>${taxCell(transaction.igst_amount, transaction.igst_percent)}</td>
            <td><strong>${currency.format(transaction.amount)}</strong></td>
            <td>${escapeHtml(transaction.delivery || '-')}</td>
            <td>${escapeHtml(transaction.dc_number || '-')}</td>
            <td>${escapeHtml(transaction.ewaybill)}</td>
            <td><div class="action-buttons">${transaction.transaction_type === 'Sale' ? `<button type="button" class="print-transaction" data-id="${transaction.id}" title="Print Invoice"><i class="fa-solid fa-print"></i></button>` : ''}${transaction.ewaybill ? `<button type="button" class="print-ewaybill" data-id="${transaction.id}" title="Print E-Way Bill"><i class="fa-solid fa-truck"></i></button>` : ''}<button type="button" class="edit-transaction" data-id="${transaction.id}" title="Edit"><i class="fa-solid fa-pen"></i></button><button type="button" class="delete-transaction delete-action" data-id="${transaction.id}" title="Delete"><i class="fa-solid fa-trash"></i></button></div></td>
        </tr>`).join('') : '<tr><td class="empty-state" colspan="18">No transactions found.</td></tr>';
        count.textContent = `Showing ${visibleTransactions.length} transaction${visibleTransactions.length === 1 ? '' : 's'}`;
        updateSummary();
        renderChart();
        renderTopProducts();
    }

    function updateSummary() {
        const totals = transactions.reduce((summary, transaction) => {
            summary[transaction.transaction_type] += Number(transaction.amount || 0);
            const gst = Number(transaction.cgst_amount || 0) + Number(transaction.sgst_amount || 0) + Number(transaction.igst_amount || 0);
            summary.tax += gst;
            if (transaction.transaction_type === 'Purchase') summary.purchaseTax += gst;
            if (transaction.transaction_type === 'Sale') summary.salesTax += gst;
            return summary;
        }, { Purchase: 0, Sale: 0, tax: 0, purchaseTax: 0, salesTax: 0 });
        document.querySelector('#totalPurchases').textContent = currency.format(totals.Purchase);
        document.querySelector('#totalSales').textContent = currency.format(totals.Sale);
        document.querySelector('#totalTax').textContent = currency.format(totals.tax);
        document.querySelector('#totalPurchaseTax').textContent = currency.format(totals.purchaseTax);
        document.querySelector('#totalSalesTax').textContent = currency.format(totals.salesTax);
        document.querySelector('#totalAmount').textContent = currency.format(totals.Purchase + totals.Sale);
    }

    function createModal() {
        document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="transactionModal" aria-hidden="true"><div class="modal transaction-modal" role="dialog" aria-modal="true">
            <form id="transactionForm"><div class="modal-header"><div><h2 id="transactionModalTitle">New Purchase</h2><p>Value and GST amounts are calculated automatically.</p></div><button class="close-modal" type="button" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
            <div class="modal-body"><div class="form-grid">
                <div class="form-group"><label>Invoice Date</label><input name="invoice_date" type="date" required></div>
                <div class="form-group"><label>Invoice Number</label><input name="invoice_number" type="text" required></div>
                <div class="form-group full-width"><label>Bill To</label><input name="bill_to" type="text" required></div>
                <div class="form-group full-width sales-only"><label>Ship To</label><input name="ship_to" type="text"></div>
                <div class="form-group"><label>Item</label><input name="item_name" type="text" list="transactionItems" required></div>
                <div class="form-group"><label>Quantity</label><input name="quantity" type="number" min="0.01" step="0.01" required></div>
                <div class="form-group"><label>HSN Code</label><input name="hsn_code" type="text" required></div>
                <div class="form-group"><label>Rate</label><input name="rate" type="number" min="0" step="0.01" required></div>
                <div class="form-group"><label>Value</label><output id="calculatedValue">₹0.00</output></div>
                <div class="form-group"><label>CGST %</label><input name="cgst_percent" type="number" min="0" step="0.01" value="0"></div>
                <div class="form-group"><label>SGST %</label><input name="sgst_percent" type="number" min="0" step="0.01" value="0"></div>
                <div class="form-group"><label>IGST %</label><input name="igst_percent" type="number" min="0" step="0.01" value="0"></div>
                <div class="form-group"><label>Amount</label><output id="calculatedAmount">₹0.00</output></div>
                <div class="form-group sales-only"><label>Delivery</label><input name="delivery" type="text"></div>
                <div class="form-group sales-only"><label>DC Number</label><input name="dc_number" type="text"></div>
                <div class="form-group full-width"><label>E-Way Bill</label><input name="ewaybill" type="text" required></div>
            </div></div><div class="modal-footer"><button class="btn btn-secondary close-modal" type="button">Cancel</button><button class="btn btn-primary" type="submit"><i class="fa-solid fa-check"></i><span id="saveTransactionLabel">Save Purchase</span></button></div></form>
        </div></div><datalist id="transactionItems"></datalist>`);
    }

    function updateCalculations() {
        const form = document.querySelector('#transactionForm');
        const value = Number(form.elements.quantity.value || 0) * Number(form.elements.rate.value || 0);
        const gst = ['cgst_percent', 'sgst_percent', 'igst_percent'].reduce((total, name) => total + value * Number(form.elements[name].value || 0) / 100, 0);
        document.querySelector('#calculatedValue').textContent = currency.format(value);
        document.querySelector('#calculatedAmount').textContent = currency.format(value + gst);
    }

    function openModal(type, transaction) {
        const modal = document.querySelector('#transactionModal');
        const form = document.querySelector('#transactionForm');
        form.reset();
        form.dataset.id = transaction ? transaction.id : '';
        form.dataset.type = transaction ? transaction.transaction_type : type;
        const isSale = form.dataset.type === 'Sale';
        document.querySelector('#transactionModalTitle').textContent = `${transaction ? 'Edit' : 'New'} ${form.dataset.type}`;
        document.querySelector('#saveTransactionLabel').textContent = `${transaction ? 'Update' : 'Save'} ${form.dataset.type}`;
        document.querySelectorAll('.sales-only').forEach((field) => { field.hidden = !isSale; });
        if (transaction) Object.entries(transaction).forEach(([name, value]) => { if (form.elements[name]) form.elements[name].value = value == null ? '' : value; });
        else form.elements.invoice_date.value = today();
        updateCalculations();
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        form.elements.invoice_date.focus();
    }

    function closeModal() {
        const modal = document.querySelector('#transactionModal');
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    function handleSessionExpired() {
        window.alert('Your session has expired or you are not logged in. Please log in again.');
        window.location.href = '/';
    }

    async function loadTransactions() {
        const response = await fetch(API_URL, { credentials: 'same-origin' });
        if (response.status === 401) return handleSessionExpired();
        if (!response.ok) throw new Error('Unable to load transactions.');
        transactions.splice(0, transactions.length, ...await response.json());
        document.querySelector('#transactionItems').innerHTML = [...new Set(transactions.map((transaction) => transaction.item_name))].map((item) => `<option value="${escapeHtml(item)}"></option>`).join('');
        render();
    }

    async function saveTransaction(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form));
        payload.transaction_type = form.dataset.type;
        const response = await fetch(form.dataset.id ? `${API_URL}/${form.dataset.id}` : API_URL, { method: form.dataset.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
        if (response.status === 401) return handleSessionExpired();
        const result = await response.json().catch(() => ({}));
        if (!response.ok) return window.alert(result.error || 'Unable to save transaction.');
        closeModal();
        await loadTransactions();
    }

    async function deleteTransaction(id) {
        if (!window.confirm('Delete this transaction?')) return;
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'same-origin' });
        if (response.status === 401) return handleSessionExpired();
        if (!response.ok) return window.alert('Unable to delete transaction.');
        await loadTransactions();
    }

    function printTransaction(transaction) {
        if (!transaction) return;
        const printWindow = window.open('', '_blank', 'width=850,height=750');
        if (!printWindow) return window.alert('Please allow pop-ups to print this record.');
        const gstRate = Number(transaction.cgst_percent || 0) + Number(transaction.sgst_percent || 0) + Number(transaction.igst_percent || 0);
        const taxRows = [
            Number(transaction.cgst_amount) > 0 ? `<tr><td class="desc-cell right" colspan="8"><em>Output CGST @${Number(transaction.cgst_percent || 0)}%</em></td><td class="right">${Number(transaction.cgst_percent || 0)}%</td><td class="right">${inrNumber(transaction.cgst_amount)}</td></tr>` : '',
            Number(transaction.sgst_amount) > 0 ? `<tr><td class="desc-cell right" colspan="8"><em>Output SGST @${Number(transaction.sgst_percent || 0)}%</em></td><td class="right">${Number(transaction.sgst_percent || 0)}%</td><td class="right">${inrNumber(transaction.sgst_amount)}</td></tr>` : '',
            Number(transaction.igst_amount) > 0 ? `<tr><td class="desc-cell right" colspan="8"><em>Output IGST @${Number(transaction.igst_percent || 0)}%</em></td><td class="right">${Number(transaction.igst_percent || 0)}%</td><td class="right">${inrNumber(transaction.igst_amount)}</td></tr>` : ''
        ].join('');
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tax Invoice ${escapeHtml(transaction.invoice_number)}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, Helvetica, sans-serif; padding: 16px; color: #000; font-size: 12px; }
                .title { text-align: center; font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
                .invoice-box { border: 1.5px solid #000; }
                table.layout { width: 100%; border-collapse: collapse; }
                table.layout > tbody > tr > td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
                .no-border { border: none !important; padding: 0 !important; }
                .company-name { font-weight: bold; font-size: 13px; }
                .field-label { font-size: 10px; color: #333; }
                .field-value { font-weight: bold; }
                .section-label { font-size: 11px; margin-bottom: 2px; }
                .party-name { font-weight: bold; font-size: 12px; }
                table.items { width: 100%; border-collapse: collapse; }
                table.items th, table.items td { border: 1px solid #000; padding: 4px 6px; font-size: 11px; }
                table.items th { font-weight: normal; text-align: center; }
                .right { text-align: right; }
                .center { text-align: center; }
                .desc-cell { text-align: left; }
                .bold { font-weight: bold; }
                .chargeable-row td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; }
                table.taxsummary { width: 100%; border-collapse: collapse; }
                table.taxsummary th, table.taxsummary td { border: 1px solid #000; padding: 4px 6px; font-size: 11px; text-align: center; }
                .declaration { font-size: 10.5px; padding: 6px 8px; border: 1px solid #000; border-top: none; }
                .sign-row td { border: 1px solid #000; border-top: none; padding: 18px 8px 6px; font-size: 11px; vertical-align: bottom; }
                .footer-note { text-align: center; font-size: 10.5px; margin-top: 10px; }
                .footer-note div:first-child { margin-bottom: 4px; }
            </style>
        </head><body>
            <div class="title">TAX INVOICE</div>
            <div class="invoice-box">
                <table class="layout">
                    <tr>
                        <td style="width:55%;" rowspan="2">
                            <div class="company-name">${escapeHtml(COMPANY_DETAILS.name)}</div>
                            ${COMPANY_DETAILS.addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
                            <div>GSTIN/UIN: ${escapeHtml(COMPANY_DETAILS.gstin)}</div>
                            <div>State Name : ${escapeHtml(COMPANY_DETAILS.stateName)}, Code : ${escapeHtml(COMPANY_DETAILS.stateCode)}</div>
                            <div>Contact : ${escapeHtml(COMPANY_DETAILS.contact)}</div>
                            <div>E-Mail : ${escapeHtml(COMPANY_DETAILS.email)}</div>
                        </td>
                        <td><span class="field-label">Invoice No.</span><br><span class="field-value">${escapeHtml(transaction.invoice_number)}</span></td>
                        <td><span class="field-label">e-Way Bill No.</span><br><span class="field-value">${escapeHtml(transaction.ewaybill || '-')}</span></td>
                        <td><span class="field-label">Dated</span><br><span class="field-value">${formatDate(transaction.invoice_date)}</span></td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="field-label">Delivery Note</span><br>&nbsp;</td>
                        <td><span class="field-label">Mode/Terms of Payment</span><br>&nbsp;</td>
                    </tr>
                    <tr>
                        <td rowspan="2">
                            <div class="section-label">Consignee (Ship to)</div>
                            <div class="party-name">${escapeHtml(transaction.ship_to || transaction.bill_to || '-')}</div>
                        </td>
                        <td colspan="2"><span class="field-label">Buyer's Order No.</span><br>&nbsp;</td>
                        <td><span class="field-label">Dated</span><br>&nbsp;</td>
                    </tr>
                    <tr>
                        <td><span class="field-label">Dispatch Doc No.</span><br><span class="field-value">${escapeHtml(transaction.dc_number || '-')}</span></td>
                        <td colspan="2"><span class="field-label">Delivery Note Date</span><br>&nbsp;</td>
                    </tr>
                    <tr>
                        <td rowspan="3">
                            <div class="section-label">Buyer (Bill to)</div>
                            <div class="party-name">${escapeHtml(transaction.bill_to)}</div>
                        </td>
                        <td><span class="field-label">Dispatched through</span><br><span class="field-value">${escapeHtml(transaction.delivery || '-')}</span></td>
                        <td colspan="2"><span class="field-label">Destination</span><br>&nbsp;</td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="field-label">Bill of Lading/LR-RR No.</span><br>&nbsp;</td>
                        <td><span class="field-label">Motor Vehicle No.</span><br>&nbsp;</td>
                    </tr>
                    <tr>
                        <td colspan="3"><span class="field-label">Terms of Delivery</span><br>&nbsp;</td>
                    </tr>
                </table>
                <table class="items">
                    <thead>
                        <tr>
                            <th style="width:4%;">Sl<br>No.</th>
                            <th>Description of Goods</th>
                            <th style="width:9%;">HSN/SAC</th>
                            <th style="width:7%;">GST<br>Rate</th>
                            <th style="width:8%;">Quantity</th>
                            <th style="width:10%;">Rate</th>
                            <th style="width:6%;">per</th>
                            <th style="width:7%;">Disc. %</th>
                            <th style="width:12%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="center">1</td>
                            <td class="desc-cell">${escapeHtml(transaction.item_name)}</td>
                            <td class="center">${escapeHtml(transaction.hsn_code)}</td>
                            <td class="center">${gstRate}%</td>
                            <td class="right">${Number(transaction.quantity)} NOS</td>
                            <td class="right">${inrNumber(transaction.rate)}</td>
                            <td class="center">NOS</td>
                            <td></td>
                            <td class="right bold">${inrNumber(transaction.value_amount)}</td>
                        </tr>
                        ${taxRows}
                        <tr>
                            <td colspan="4" class="right bold">Total</td>
                            <td class="right bold">${Number(transaction.quantity)} NOS</td>
                            <td colspan="3"></td>
                            <td class="right bold">₹ ${inrNumber(transaction.amount)}</td>
                        </tr>
                    </tbody>
                </table>
                <table class="layout">
                    <tr class="chargeable-row">
                        <td style="width:80%;">Amount Chargeable (in words)<br><span class="bold">${amountInWords(transaction.amount)}</span></td>
                        <td class="right" style="vertical-align:bottom;">E. &amp; O.E</td>
                    </tr>
                </table>
                <table class="taxsummary">
                    <thead>
                        <tr>
                            <th rowspan="2">HSN/SAC</th>
                            <th rowspan="2">Taxable Value</th>
                            <th colspan="2">CGST</th>
                            <th colspan="2">SGST/UTGST</th>
                            <th rowspan="2">Total<br>Tax Amount</th>
                        </tr>
                        <tr><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${escapeHtml(transaction.hsn_code)}</td>
                            <td class="right">${inrNumber(transaction.value_amount)}</td>
                            <td>${Number(transaction.cgst_percent || 0)}%</td>
                            <td class="right">${inrNumber(transaction.cgst_amount || 0)}</td>
                            <td>${Number(transaction.sgst_percent || 0)}%</td>
                            <td class="right">${inrNumber(transaction.sgst_amount || 0)}</td>
                            <td class="right">${inrNumber(Number(transaction.cgst_amount || 0) + Number(transaction.sgst_amount || 0) + Number(transaction.igst_amount || 0))}</td>
                        </tr>
                        <tr class="bold">
                            <td class="right">Total</td>
                            <td class="right">${inrNumber(transaction.value_amount)}</td>
                            <td></td>
                            <td class="right">${inrNumber(transaction.cgst_amount || 0)}</td>
                            <td></td>
                            <td class="right">${inrNumber(transaction.sgst_amount || 0)}</td>
                            <td class="right">${inrNumber(Number(transaction.cgst_amount || 0) + Number(transaction.sgst_amount || 0) + Number(transaction.igst_amount || 0))}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="chargeable-row" style="border:1px solid #000;border-top:none;padding:6px 8px;">
                    Tax Amount (in words) : <span class="bold">${amountInWords(Number(transaction.cgst_amount || 0) + Number(transaction.sgst_amount || 0) + Number(transaction.igst_amount || 0))}</span>
                </div>
                <div class="declaration">
                    <u>Declaration</u><br>
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </div>
                <table class="layout">
                    <tr class="sign-row">
                        <td style="width:50%;">Customer's Seal and Signature</td>
                        <td class="right">for ${escapeHtml(COMPANY_DETAILS.name)}<br><br><br>Authorised Signatory</td>
                    </tr>
                </table>
            </div>
            <div class="footer-note">
                <div>${escapeHtml(COMPANY_DETAILS.jurisdiction)}</div>
                <div>This is a Computer Generated Invoice</div>
            </div>
        </body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => { printWindow.print(); };
    }

    function printEwaybill(transaction) {
        if (!transaction) return;
        const printWindow = window.open('', '_blank', 'width=800,height=700');
        if (!printWindow) return window.alert('Please allow pop-ups to print this record.');
        const isSale = transaction.transaction_type === 'Sale';
        const supplyType = isSale ? 'Outward' : 'Inward';
        const subType = 'Supply';
        const fromLabel = isSale ? 'From (Supplier)' : 'From (Vendor / Bill From)';
        const toLabel = isSale ? 'To (Ship To)' : 'To (Bill To)';
        const fromValue = isSale ? (transaction.bill_to || '-') : (transaction.bill_to || '-');
        const toValue = isSale ? (transaction.ship_to || transaction.bill_to || '-') : (transaction.bill_to || '-');
        printWindow.document.write(`<!DOCTYPE html><html><head><title>E-Way Bill ${escapeHtml(transaction.ewaybill)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                .ewb-box { border: 2px solid #111827; }
                .ewb-header { background: #123d70; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
                .ewb-header h1 { font-size: 16px; margin: 0; letter-spacing: 0.5px; }
                .ewb-header .ewb-no { font-size: 14px; font-weight: bold; }
                .ewb-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #111827; }
                .ewb-meta div { padding: 8px 14px; border-right: 1px solid #d1d5db; font-size: 12px; }
                .ewb-meta div:last-child { border-right: none; }
                .ewb-meta label { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 2px; }
                .ewb-parties { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #111827; }
                .ewb-parties div { padding: 10px 14px; font-size: 12px; border-right: 1px solid #d1d5db; }
                .ewb-parties div:last-child { border-right: none; }
                .ewb-parties label { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
                .ewb-parties strong { font-size: 13px; }
                table.items { width: 100%; border-collapse: collapse; }
                table.items th, table.items td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
                table.items th { background: #f3f4f6; }
                .ewb-footer { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #111827; }
                .ewb-footer div { padding: 10px 14px; font-size: 12px; border-right: 1px solid #d1d5db; }
                .ewb-footer div:last-child { border-right: none; }
                .ewb-footer label { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 2px; }
                .disclaimer { margin-top: 10px; font-size: 10px; color: #6b7280; }
            </style>
        </head><body>
            <div class="ewb-box">
                <div class="ewb-header">
                    <h1>E-WAY BILL</h1>
                    <span class="ewb-no">EWB No: ${escapeHtml(transaction.ewaybill)}</span>
                </div>
                <div class="ewb-meta">
                    <div><label>Generated Date</label>${formatDate(transaction.invoice_date)}</div>
                    <div><label>Document No.</label>${escapeHtml(transaction.invoice_number)}</div>
                    <div><label>Supply Type</label>${supplyType} - ${subType}</div>
                </div>
                <div class="ewb-parties">
                    <div><label>${fromLabel}</label><strong>${escapeHtml(fromValue)}</strong></div>
                    <div><label>${toLabel}</label><strong>${escapeHtml(toValue)}</strong></div>
                </div>
                <table class="items">
                    <thead><tr><th>Product / Item</th><th>HSN Code</th><th>Quantity</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total Value</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>${escapeHtml(transaction.item_name)}</td>
                            <td>${escapeHtml(transaction.hsn_code)}</td>
                            <td>${Number(transaction.quantity)}</td>
                            <td>${currency.format(transaction.value_amount)}</td>
                            <td>${currency.format(transaction.cgst_amount)} (${Number(transaction.cgst_percent || 0)}%)</td>
                            <td>${currency.format(transaction.sgst_amount)} (${Number(transaction.sgst_percent || 0)}%)</td>
                            <td>${currency.format(transaction.igst_amount)} (${Number(transaction.igst_percent || 0)}%)</td>
                            <td><strong>${currency.format(transaction.amount)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                <div class="ewb-footer">
                    <div><label>Delivery / Transport Mode</label>${escapeHtml(transaction.delivery || '-')}</div>
                    <div><label>DC Number</label>${escapeHtml(transaction.dc_number || '-')}</div>
                </div>
            </div>
            <p class="disclaimer">This document is system-generated from internal transaction records and is not a substitute for the official E-Way Bill generated on the GST E-Way Bill portal.</p>
        </body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => { printWindow.print(); };
    }

    createModal();
    document.querySelector('#newPurchaseBtn').addEventListener('click', () => openModal('Purchase'));
    document.querySelector('#newSaleBtn').addEventListener('click', () => openModal('Sale'));
    document.querySelector('#applyFiltersBtn').addEventListener('click', render);
    const periodSelect = document.querySelector('.period-select');
    if (periodSelect) periodSelect.addEventListener('change', renderChart);
    ['#fromDate', '#toDate', '#transactionTypeFilter', '#productFilter', '#transactionSearch'].forEach((selector) => document.querySelector(selector).addEventListener('input', render));
    document.querySelector('#transactionRows').addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-transaction');
        const deleteButton = event.target.closest('.delete-transaction');
        const printButton = event.target.closest('.print-transaction');
        const printEwaybillButton = event.target.closest('.print-ewaybill');
        if (editButton) openModal('', transactions.find((transaction) => transaction.id === Number(editButton.dataset.id)));
        if (deleteButton) deleteTransaction(deleteButton.dataset.id);
        if (printButton) printTransaction(transactions.find((transaction) => transaction.id === Number(printButton.dataset.id)));
        if (printEwaybillButton) printEwaybill(transactions.find((transaction) => transaction.id === Number(printEwaybillButton.dataset.id)));
    });
    document.querySelector('#transactionModal').addEventListener('click', (event) => { if (event.target === event.currentTarget || event.target.closest('.close-modal')) closeModal(); });
    document.querySelector('#transactionForm').addEventListener('input', updateCalculations);
    document.querySelector('#transactionForm').addEventListener('submit', saveTransaction);
    loadTransactions().catch((error) => { rows.innerHTML = '<tr><td class="empty-state" colspan="18">Unable to load transactions.</td></tr>'; window.console.error(error); });
}());