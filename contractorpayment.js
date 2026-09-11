const CONTRACTOR_API_URL = './api/contractor-payments';
const CONTRACTOR_LIST_API_URL = './api/contractor-payment-contractors';
const RATE_CARD_API_URL = './api/contractor-rate-cards';
const PAGE_SIZE = 8;

const WORK_TYPES = [
	{ key: 'fabrication', label: 'Fabrication' },
	{ key: 'cement_sheet', label: 'Cement Sheet' },
	{ key: 'electrical', label: 'Electrical' },
	{ key: 'tiles', label: 'Tiles' },
	{ key: 'plumbing', label: 'Plumbing' },
	{ key: 'door_fitting', label: 'Door Fitting' },
	{ key: 'outer_colour', label: 'Outer Colour' },
	{ key: 'inner_colour', label: 'Inner Colour' }
];

// Column order + labels for the contractor work-entries matrix
const MATRIX_WORK_TYPES = [
	{ key: 'cement_sheet', label: 'CEMENT SHEET' },
	{ key: 'electrical', label: 'ELEC' },
	{ key: 'door_fitting', label: 'DOOR FITTIN' },
	{ key: 'fabrication', label: 'FABRICATION' },
	{ key: 'tiles', label: 'TILES' },
	{ key: 'plumbing', label: 'PLUMBING' },
	{ key: 'outer_colour', label: 'OUTER COLOUR' },
	{ key: 'inner_colour', label: 'INNER COLOUR' }
];

const elements = {
	currentDate: document.getElementById('currentDate'),
	fromDate: document.getElementById('fromDate'),
	toDate: document.getElementById('toDate'),
	contractorSearch: document.getElementById('contractorSearch'),
	paymentStatus: document.getElementById('paymentStatus'),
	workType: document.getElementById('workType'),
	applyFilterBtn: document.getElementById('applyFilterBtn'),
	resetFilterBtn: document.getElementById('resetFilterBtn'),
	exportExcelBtn: document.getElementById('exportExcelBtn'),
	printBtn: document.getElementById('printBtn'),
	addContractorBtn: document.getElementById('addContractorBtn'),
	addPaymentBtn: document.getElementById('addPaymentBtn'),
	rateCardBtn: document.getElementById('rateCardBtn'),
	refreshTableBtn: document.getElementById('refreshTableBtn'),
	downloadTableBtn: document.getElementById('downloadTableBtn'),
	contractorTableBody: document.getElementById('contractorTableBody'),
	tableResultText: document.getElementById('tableResultText'),
	paginationInfo: document.getElementById('paginationInfo'),
	pageNumbers: document.getElementById('pageNumbers'),
	firstPageBtn: document.getElementById('firstPageBtn'),
	previousPageBtn: document.getElementById('previousPageBtn'),
	nextPageBtn: document.getElementById('nextPageBtn'),
	lastPageBtn: document.getElementById('lastPageBtn'),
	totalContractors: document.getElementById('totalContractors'),
	totalAmount: document.getElementById('totalAmount'),
	totalPayment: document.getElementById('totalPayment'),
	totalBalance: document.getElementById('totalBalance'),
	totalQuantity: document.getElementById('totalQuantity'),
	paymentModal: document.getElementById('paymentModal'),
	closePaymentModal: document.getElementById('closePaymentModal'),
	cancelPaymentBtn: document.getElementById('cancelPaymentBtn'),
	paymentForm: document.getElementById('paymentForm'),
	paymentContractor: document.getElementById('paymentContractor'),
	paymentDate: document.getElementById('paymentDate'),
	paymentAmount: document.getElementById('paymentAmount'),
	paymentMode: document.getElementById('paymentMode'),
	paidBy: document.getElementById('paidBy'),
	paymentRemarks: document.getElementById('paymentRemarks'),
	contractorModal: document.getElementById('contractorModal'),
	contractorModalTitle: document.getElementById('contractorModalTitle'),
	closeContractorModal: document.getElementById('closeContractorModal'),
	cancelContractorBtn: document.getElementById('cancelContractorBtn'),
	contractorForm: document.getElementById('contractorForm'),
	contractorIdInput: document.getElementById('contractorIdInput'),
	contractorNameInput: document.getElementById('contractorNameInput'),
	contractorDateInput: document.getElementById('contractorDateInput'),
	entryLocationSelect: document.getElementById('entryLocationSelect'),
	addLocationEntryBtn: document.getElementById('addLocationEntryBtn'),
	addedLocationsSection: document.getElementById('addedLocationsSection'),
	addedLocationsBody: document.getElementById('addedLocationsBody'),
	clearAllLocationsBtn: document.getElementById('clearAllLocationsBtn'),
	fabricationInput: document.getElementById('fabricationInput'),
	cementSheetInput: document.getElementById('cementSheetInput'),
	electricalInput: document.getElementById('electricalInput'),
	tilesInput: document.getElementById('tilesInput'),
	plumbingInput: document.getElementById('plumbingInput'),
	doorFittingInput: document.getElementById('doorFittingInput'),
	outerColourInput: document.getElementById('outerColourInput'),
	innerColourInput: document.getElementById('innerColourInput'),
	totalAmountInput: document.getElementById('totalAmountInput'),
	contractorRemarkInput: document.getElementById('contractorRemarkInput'),
	rateCardModal: document.getElementById('rateCardModal'),
	closeRateCardModal: document.getElementById('closeRateCardModal'),
	cancelRateCardBtn: document.getElementById('cancelRateCardBtn'),
	saveRateCardBtn: document.getElementById('saveRateCardBtn'),
	rateCardContractorSelect: document.getElementById('rateCardContractorSelect'),
	rateCardDate: document.getElementById('rateCardDate'),
	rateFabrication: document.getElementById('rateFabrication'),
	rateCementSheet: document.getElementById('rateCementSheet'),
	rateElectrical: document.getElementById('rateElectrical'),
	rateTiles: document.getElementById('rateTiles'),
	ratePlumbing: document.getElementById('ratePlumbing'),
	rateDoorFitting: document.getElementById('rateDoorFitting'),
	rateOuterColour: document.getElementById('rateOuterColour'),
	rateInnerColour: document.getElementById('rateInnerColour'),
	rateHistoryBody: document.getElementById('rateHistoryBody'),
	workEntryModal: document.getElementById('workEntryModal'),
	workEntryModalTitle: document.getElementById('workEntryModalTitle'),
	workEntryModalSubtitle: document.getElementById('workEntryModalSubtitle'),
	closeWorkEntryModal: document.getElementById('closeWorkEntryModal'),
	cancelWorkEntryBtn: document.getElementById('cancelWorkEntryBtn'),
	workEntryForm: document.getElementById('workEntryForm'),
	workEntryIdInput: document.getElementById('workEntryIdInput'),
	workEntryContractorIdInput: document.getElementById('workEntryContractorIdInput'),
	workEntryLocationSelect: document.getElementById('workEntryLocationSelect'),
	workEntryDateInput: document.getElementById('workEntryDateInput'),
	workEntryFabrication: document.getElementById('workEntryFabrication'),
	workEntryCementSheet: document.getElementById('workEntryCementSheet'),
	workEntryElectrical: document.getElementById('workEntryElectrical'),
	workEntryTiles: document.getElementById('workEntryTiles'),
	workEntryPlumbing: document.getElementById('workEntryPlumbing'),
	workEntryDoorFitting: document.getElementById('workEntryDoorFitting'),
	workEntryOuterColour: document.getElementById('workEntryOuterColour'),
	workEntryInnerColour: document.getElementById('workEntryInnerColour')
};

const workSummaryConfig = [
	{ key: 'fabrication', label: 'Fabrication', className: 'fabrication-bar' },
	{ key: 'cement_sheet', label: 'Cement Sheet', className: 'cement-bar' },
	{ key: 'electrical', label: 'Electrical', className: 'electrical-bar' },
	{ key: 'tiles', label: 'Tiles', className: 'tiles-bar' },
	{ key: 'plumbing', label: 'Plumbing', className: 'plumbing-bar' },
	{ key: 'door_fitting', label: 'Door Fitting', className: 'door-bar' },
	{ key: 'outer_colour', label: 'Outer Colour', className: 'outer-bar' },
	{ key: 'inner_colour', label: 'Inner Colour', className: 'inner-bar' }
];

const DEFAULT_RATES = {
	fabrication: 100,
	cement_sheet: 150,
	electrical: 200,
	tiles: 120,
	plumbing: 130,
	door_fitting: 250,
	outer_colour: 80,
	inner_colour: 90
};

const state = {
	rows: [],
	contractors: [],
	rateCards: {},
	rateCardHistory: {},
	currentPage: 1,
	editingContractorId: null,
	expandedRowId: null,
	expandedPayments: {},
	pendingLocationEntries: []
};

/* ============================================================
   UTILITIES
============================================================ */

function getTodayISO() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getMonthStartISO() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}-01`;
}

function parseAmount(value) {
	const amount = Number(value);
	if (!Number.isFinite(amount) || amount < 0) return 0;
	return amount;
}

function formatCurrency(value) {
	const amount = Number(value) || 0;
	return new Intl.NumberFormat('en-IN', {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0
	}).format(amount);
}

function formatNumber(value) {
	const amount = Number(value) || 0;
	if (Number.isInteger(amount)) return String(amount);
	return amount.toFixed(2);
}

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function getStatusClass(status) {
	if (status === 'MATCH') return 'status-match';
	if (status === 'PENDING') return 'status-pending';
	if (status === 'MISMATCH') return 'status-mismatch';
	if (status === 'OVERPAID') return 'status-overpaid';
	return 'status-none';
}

function getBalanceClass(balance) {
	const value = Number(balance) || 0;
	if (value > 0) return 'balance-positive';
	if (value < 0) return 'balance-negative';
	return 'balance-zero';
}

/* ============================================================
   RATE LOOKUP
============================================================ */

function getRateForDate(contractorId, workTypeKey, dateStr) {
	const history = state.rateCardHistory[String(contractorId)] || [];
	if (!history.length) return DEFAULT_RATES[workTypeKey] || 0;

	const workDate = new Date(dateStr || getTodayISO());
	const sorted = [...history].sort(
		(a, b) => new Date(b.effective_date) - new Date(a.effective_date)
	);
	for (const card of sorted) {
		if (new Date(card.effective_date) <= workDate) {
			return Number(card.rates[workTypeKey]) || 0;
		}
	}
	const oldest = sorted[sorted.length - 1];
	return Number(oldest.rates[workTypeKey]) || 0;
}

function getLatestRateCard(contractorId) {
	const history = state.rateCardHistory[String(contractorId)] || [];
	if (!history.length) return null;
	return [...history].sort(
		(a, b) => new Date(b.effective_date) - new Date(a.effective_date)
	)[0];
}

function getRatesForContractor(contractorId) {
	const latest = getLatestRateCard(contractorId);
	if (latest && latest.rates) return latest.rates;
	return { ...DEFAULT_RATES };
}

function calculateEntryAmount(entry, contractorId) {
	let total = 0;
	WORK_TYPES.forEach((wt) => {
		const rate = getRateForDate(contractorId, wt.key, entry.entry_date || entry.date);
		total += (Number(entry[wt.key]) || 0) * rate;
	});
	return total;
}

function calculateTotalFromPendingEntries() {
	const contractorId = elements.contractorIdInput.value || '';
	let total = 0;
	state.pendingLocationEntries.forEach((entry) => {
		total += calculateEntryAmount(entry, contractorId);
	});
	elements.totalAmountInput.value = total.toFixed(2);
	return total;
}

function calculateLiveTotalPreview() {
	const contractorId = elements.contractorIdInput.value || '';
	let total = 0;
	state.pendingLocationEntries.forEach((entry) => {
		WORK_TYPES.forEach((wt) => {
			const rate = getRateForDate(contractorId, wt.key, entry.entry_date || entry.date);
			total += (Number(entry[wt.key]) || 0) * rate;
		});
	});

	const current = {
		fabrication: parseAmount(elements.fabricationInput.value),
		cement_sheet: parseAmount(elements.cementSheetInput.value),
		electrical: parseAmount(elements.electricalInput.value),
		tiles: parseAmount(elements.tilesInput.value),
		plumbing: parseAmount(elements.plumbingInput.value),
		door_fitting: parseAmount(elements.doorFittingInput.value),
		outer_colour: parseAmount(elements.outerColourInput.value),
		inner_colour: parseAmount(elements.innerColourInput.value)
	};
	WORK_TYPES.forEach((wt) => {
		const rate = getRateForDate(contractorId, wt.key, elements.contractorDateInput.value);
		total += (Number(current[wt.key]) || 0) * rate;
	});

	elements.totalAmountInput.value = total.toFixed(2);
}

/* ============================================================
   PENDING ENTRIES
============================================================ */

function resetEntryInputs() {
	elements.fabricationInput.value = '0';
	elements.cementSheetInput.value = '0';
	elements.electricalInput.value = '0';
	elements.tilesInput.value = '0';
	elements.plumbingInput.value = '0';
	elements.doorFittingInput.value = '0';
	elements.outerColourInput.value = '0';
	elements.innerColourInput.value = '0';
	elements.entryLocationSelect.value = '';
}

function resetPendingEntries() {
	state.pendingLocationEntries = [];
	renderPendingEntries();
	elements.totalAmountInput.value = '0';
}

function renderPendingEntries() {
	if (!state.pendingLocationEntries.length) {
		elements.addedLocationsSection.style.display = 'none';
		elements.addedLocationsBody.innerHTML = '';
		return;
	}
	elements.addedLocationsSection.style.display = 'block';
	elements.addedLocationsBody.innerHTML = '';
	state.pendingLocationEntries.forEach((entry, index) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${escapeHtml(entry.location)}</td>
			<td>${formatNumber(entry.fabrication)}</td>
			<td>${formatNumber(entry.cement_sheet)}</td>
			<td>${formatNumber(entry.electrical)}</td>
			<td>${formatNumber(entry.tiles)}</td>
			<td>${formatNumber(entry.plumbing)}</td>
			<td>${formatNumber(entry.door_fitting)}</td>
			<td>${formatNumber(entry.outer_colour)}</td>
			<td>${formatNumber(entry.inner_colour)}</td>
			<td><button type="button" class="remove-location-btn" data-remove-entry-index="${index}">Remove</button></td>
		`;
		elements.addedLocationsBody.appendChild(tr);
	});
}

function addLocationEntry() {
	const location = elements.entryLocationSelect.value;
	if (!location) { alert('Please select a location.'); return; }

	const entry = {
		location,
		entry_date: elements.contractorDateInput.value || getTodayISO(),
		fabrication: parseAmount(elements.fabricationInput.value),
		cement_sheet: parseAmount(elements.cementSheetInput.value),
		electrical: parseAmount(elements.electricalInput.value),
		tiles: parseAmount(elements.tilesInput.value),
		plumbing: parseAmount(elements.plumbingInput.value),
		door_fitting: parseAmount(elements.doorFittingInput.value),
		outer_colour: parseAmount(elements.outerColourInput.value),
		inner_colour: parseAmount(elements.innerColourInput.value)
	};

	const allZero = WORK_TYPES.every((wt) => !entry[wt.key]);
	if (allZero) { alert('Please enter at least one work quantity for this location.'); return; }

	const existingIdx = state.pendingLocationEntries.findIndex(
		(e) => e.location.toLowerCase() === location.toLowerCase()
	);
	if (existingIdx >= 0) {
		if (!window.confirm(`An entry for "${location}" already exists. Replace it?`)) return;
		state.pendingLocationEntries[existingIdx] = entry;
	} else {
		state.pendingLocationEntries.push(entry);
	}

	renderPendingEntries();
	resetEntryInputs();
	calculateTotalFromPendingEntries();
}

function removeLocationEntry(index) {
	if (!Number.isInteger(index) || index < 0 || index >= state.pendingLocationEntries.length) return;
	state.pendingLocationEntries.splice(index, 1);
	renderPendingEntries();
	calculateTotalFromPendingEntries();
}

function resetContractorForm() {
	elements.contractorForm.reset();
	elements.contractorIdInput.value = '';
	elements.contractorDateInput.value = getTodayISO();
	elements.contractorDateInput.max = getTodayISO();
	elements.totalAmountInput.value = '0';
	resetEntryInputs();
	resetPendingEntries();
	state.editingContractorId = null;
}

/* ============================================================
   RATE CARD HISTORY
============================================================ */

async function loadRateCardForContractor(contractorId, forceReload = false) {
	if (!contractorId) return;
	const key = String(contractorId);
	if (!forceReload && state.rateCardHistory[key]) return;

	try {
		const historyResponse = await fetch(`${RATE_CARD_API_URL}/${contractorId}/history`, {
			credentials: 'include'
		});
		if (historyResponse && historyResponse.ok) {
			const history = await historyResponse.json();
			if (Array.isArray(history)) {
				state.rateCardHistory[key] = history;
				return;
			}
		}

		const response = await fetch(`${RATE_CARD_API_URL}/${contractorId}`, {
			credentials: 'include'
		});
		if (response && response.ok) {
			const data = await response.json();
			if (data && data.rates) {
				state.rateCardHistory[key] = [data];
				return;
			}
		}
	} catch (e) {
		console.warn('Rate card load failed:', e);
	}
	state.rateCardHistory[key] = [];
}

/* ============================================================
   CONTRACTOR MODAL
============================================================ */

async function openContractorModal(mode, row) {
	resetContractorForm();

	if (mode === 'edit' && row) {
		state.editingContractorId = Number(row.id) || null;
		elements.contractorModalTitle.textContent = 'Edit Contractor';
		elements.contractorIdInput.value = String(row.id || '');
		elements.contractorNameInput.value = row.contractor_name || '';
		elements.contractorDateInput.value = row.contractor_date || getTodayISO();
		elements.contractorRemarkInput.value = row.remark || '';

		await loadRateCardForContractor(row.id, true);

		try {
			const response = await fetch(`/api/contractor-payments/${row.id}/entries`, {
				credentials: 'include'
			});
			if (response && response.ok) {
				const data = await response.json();
				if (Array.isArray(data) && data.length) {
					state.pendingLocationEntries = data.map((e) => ({
						location: e.location,
						entry_date: e.entry_date || row.contractor_date || '',
						fabrication: Number(e.fabrication) || 0,
						cement_sheet: Number(e.cement_sheet) || 0,
						electrical: Number(e.electrical) || 0,
						tiles: Number(e.tiles) || 0,
						plumbing: Number(e.plumbing) || 0,
						door_fitting: Number(e.door_fitting) || 0,
						outer_colour: Number(e.outer_colour) || 0,
						inner_colour: Number(e.inner_colour) || 0
					}));
				}
			}
		} catch (e) { /* ignore */ }

		renderPendingEntries();
		calculateTotalFromPendingEntries();
	} else {
		elements.contractorModalTitle.textContent = 'Add Contractor';
	}

	elements.contractorModal.style.display = 'flex';
}

function closeContractorModal() {
	elements.contractorModal.style.display = 'none';
	resetContractorForm();
}

/* ============================================================
   DATA FETCHING
============================================================ */

function getFilterQuery() {
	const params = new URLSearchParams();
	if (elements.fromDate.value) params.set('fromDate', elements.fromDate.value);
	if (elements.toDate.value) params.set('toDate', elements.toDate.value);
	if (elements.paymentStatus.value) params.set('status', elements.paymentStatus.value);
	if (elements.workType.value) params.set('workType', elements.workType.value);
	if (elements.contractorSearch.value.trim()) params.set('search', elements.contractorSearch.value.trim());
	return params;
}

async function fetchContractorRows() {
	const params = getFilterQuery();
	const response = await fetch(`${CONTRACTOR_API_URL}?${params.toString()}`, {
		credentials: 'include'
	}).catch(() => null);

	if (!response || !response.ok) {
		state.rows = [];
		renderAll();
		return;
	}
	const payload = await response.json();
	state.rows = Array.isArray(payload.rows) ? payload.rows : [];
	renderAll();
}

async function fetchContractorsForModal() {
	const response = await fetch(CONTRACTOR_LIST_API_URL, {
		credentials: 'include'
	}).catch(() => null);

	if (!response || !response.ok) {
		state.contractors = [];
	} else {
		const rows = await response.json();
		state.contractors = Array.isArray(rows) ? rows : [];
	}

	elements.paymentContractor.innerHTML = '<option value="">Select Contractor</option>';
	elements.rateCardContractorSelect.innerHTML = '<option value="">Select Contractor</option>';
	state.contractors.forEach((entry) => {
		const option = document.createElement('option');
		option.value = String(entry.id);
		option.textContent = entry.contractor_name;
		elements.paymentContractor.appendChild(option);

		const rcOption = option.cloneNode(true);
		elements.rateCardContractorSelect.appendChild(rcOption);
	});
}

async function fetchContractorPayments(contractorId) {
	try {
		const response = await fetch(`/api/contractor-payments/${contractorId}/transactions`, {
			credentials: 'include'
		});
		if (!response || !response.ok) return [];
		const data = await response.json();
		return Array.isArray(data.dayWise) ? data.dayWise : [];
	} catch (e) { return []; }
}

async function fetchContractorEntries(contractorId) {
	try {
		const response = await fetch(`/api/contractor-payments/${contractorId}/entries`, {
			credentials: 'include'
		});
		if (!response || !response.ok) return [];
		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (e) { return []; }
}

/* ============================================================
   KPIs + WORK SUMMARY
============================================================ */

function updateKpis() {
	const totalContractors = state.rows.length;
	const totalAmount = state.rows.reduce((sum, row) => sum + (Number(row.total_amount) || 0), 0);
	const totalPayment = state.rows.reduce((sum, row) => sum + (Number(row.total_payment) || 0), 0);
	const totalBalance = totalAmount - totalPayment;

	elements.totalContractors.textContent = String(totalContractors);
	elements.totalAmount.textContent = `₹${formatCurrency(totalAmount)}`;
	elements.totalPayment.textContent = `₹${formatCurrency(totalPayment)}`;
	elements.totalBalance.textContent = `₹${formatCurrency(totalBalance)}`;
}

function updateWorkSummary() {
	const totals = {};
	workSummaryConfig.forEach((item) => {
		totals[item.key] = state.rows.reduce((sum, row) => sum + (Number(row[item.key]) || 0), 0);
	});
	const maxValue = Math.max(1, ...Object.values(totals));
	const totalQty = Object.values(totals).reduce((sum, value) => sum + value, 0);
	elements.totalQuantity.textContent = formatNumber(totalQty);

	const rows = document.querySelectorAll('.work-row');
	rows.forEach((rowElement, index) => {
		const config = workSummaryConfig[index];
		if (!config) return;
		const value = totals[config.key] || 0;
		const bar = rowElement.querySelector('.progress-bar');
		const valueNode = rowElement.querySelector('.work-value');
		const percent = Math.round((value / maxValue) * 100);
		if (bar) bar.style.width = `${percent}%`;
		if (valueNode) valueNode.textContent = formatNumber(value);
	});
}

/* ============================================================
   CONTRACTOR WORK ENTRIES MATRIX (inside expansion row)

   Each work type has its OWN set of location sub-columns
   (only locations where that work type was actually worked).

   For each work type, we render ONE <th colspan="N"> on the
   top header row, and N <th> on the second row — one for each
   location of that work type.
============================================================ */

/* ============================================================
   CONTRACTOR WORK ENTRIES MATRIX (inside expansion row)

   Each work type has its OWN set of location sub-columns
   (only locations where that work type was actually worked).

   Cell value  = quantity
   LAST column = row total quantity for that date
   TOTAL row   = per work type, sum of quantities across
                 that work type's location sub-columns;
                 last cell = grand total quantity.
============================================================ */

/* ============================================================
   CONTRACTOR WORK ENTRIES MATRIX (inside expansion row)

   - Each work type has its OWN set of location subcolumns
     (only locations where that work type was actually worked).
   - Cell value under each location = QUANTITY.
   - Last column = AMOUNT for that date, computed as
         sum over all work types & locations of (qty × rate),
     where rate is picked from the contractor's rate card
     with the latest effective_date <= that entry date.
   - Bottom TOTAL row = per-location quantity summed across
     all dates (work-type wise), and grand total amount in
     the last cell.
============================================================ */

/* ============================================================
   CONTRACTOR WORK ENTRIES MATRIX (inside expansion row)

   - Each work type has its OWN set of location subcolumns.
   - Cell value under each location = QUANTITY.
   - AMOUNT column = qty × rate summed for that date.
   - ACTION column = edit / delete for the underlying
     contractor_work_entries rows for that date.
============================================================ */

function buildContractorWorkEntriesMatrix(contractorId, entries, rateHistory) {
	// ----- Empty state -----
	if (!entries || !entries.length) {
		return {
			thead: `<tr>
				<th rowspan="2" class="we-date-col">DATE</th>
				<th rowspan="2" class="we-amount-col">AMOUNT</th>
				<th rowspan="2" class="we-action-col">ACTION</th>
			</tr>`,
			tbody: `<tr><td colspan="3" class="empty-msg">No work entries found. Click "＋ Add Work Entry" to add one.</td></tr>`
		};
	}

	// ----- Rate lookup -----
	const sortedCards = [...(rateHistory || [])].sort(
		(a, b) => new Date(b.effective_date) - new Date(a.effective_date)
	);
	function pickRate(workTypeKey, entryDate) {
		if (!sortedCards.length) return 0;
		const workDate = new Date(entryDate || '9999-12-31');
		for (const card of sortedCards) {
			if (new Date(card.effective_date) <= workDate) {
				return Number(card.rates[workTypeKey]) || 0;
			}
		}
		const oldest = sortedCards[sortedCards.length - 1];
		return Number(oldest.rates[workTypeKey]) || 0;
	}

	// ----- Collect distinct locations PER WORK TYPE -----
	const locationsByWorkType = {};
	MATRIX_WORK_TYPES.forEach((wt) => { locationsByWorkType[wt.key] = new Set(); });

	entries.forEach((e) => {
		const loc = e.location || 'Unspecified';
		MATRIX_WORK_TYPES.forEach((wt) => {
			const qty = Number(e[wt.key]) || 0;
			if (qty > 0) locationsByWorkType[wt.key].add(loc);
		});
	});

	MATRIX_WORK_TYPES.forEach((wt) => {
		locationsByWorkType[wt.key] = [...locationsByWorkType[wt.key]].sort();
	});

	const activeWorkTypes = MATRIX_WORK_TYPES.filter(
		(wt) => locationsByWorkType[wt.key].length > 0
	);

	if (!activeWorkTypes.length) {
		return {
			thead: `<tr>
				<th rowspan="2" class="we-date-col">DATE</th>
				<th rowspan="2" class="we-amount-col">AMOUNT</th>
				<th rowspan="2" class="we-action-col">ACTION</th>
			</tr>`,
			tbody: `<tr><td colspan="3" class="empty-msg">No work quantities recorded.</td></tr>`
		};
	}

	// ----- Aggregate per date -----
	//   dateMap[date][workTypeKey][location]  = qty
	//   amountMap[date]                       = total amount for that date
	//   entriesByDate[date]                   = [list of underlying entry rows]
	const dateMap = {};
	const amountMap = {};
	const entriesByDate = {};
	const dateSet = new Set();

	entries.forEach((e) => {
		const d = e.entry_date || '';
		const loc = e.location || 'Unspecified';
		dateSet.add(d);

		if (!dateMap[d]) {
			dateMap[d] = {};
			activeWorkTypes.forEach((wt) => { dateMap[d][wt.key] = {}; });
			amountMap[d] = 0;
			entriesByDate[d] = [];
		}
		entriesByDate[d].push(e);

		activeWorkTypes.forEach((wt) => {
			const qty = Number(e[wt.key]) || 0;
			if (qty <= 0) return;
			if (!dateMap[d][wt.key][loc]) dateMap[d][wt.key][loc] = 0;
			dateMap[d][wt.key][loc] += qty;

			const rate = pickRate(wt.key, d);
			amountMap[d] += qty * rate;
		});
	});

	const dates = [...dateSet].sort();

	// ----- thead -----
	// Row 1: DATE | [WT1 span] | [WT2 span] | ... | AMOUNT | ACTION
	let headRow1 = `<tr>
		<th rowspan="2" class="we-date-col">DATE</th>`;
	activeWorkTypes.forEach((wt) => {
		const locCount = locationsByWorkType[wt.key].length;
		headRow1 += `<th colspan="${locCount}" class="we-worktype-header">${escapeHtml(wt.label)}</th>`;
	});
	headRow1 += `<th rowspan="2" class="we-amount-col">AMOUNT</th>
		<th rowspan="2" class="we-action-col">ACTION</th>
	</tr>`;

	// Row 2: location subcolumns per work type
	let headRow2 = '<tr>';
	activeWorkTypes.forEach((wt) => {
		locationsByWorkType[wt.key].forEach((loc) => {
			headRow2 += `<th class="we-location-header">${escapeHtml(loc)}</th>`;
		});
	});
	headRow2 += '</tr>';

	// ----- tbody rows -----
	let grandTotalAmount = 0;
	const bodyRows = dates.map((d) => {
		let cells = `<td class="we-date-cell">${escapeHtml(d || '—')}</td>`;

		activeWorkTypes.forEach((wt) => {
			locationsByWorkType[wt.key].forEach((loc) => {
				const qty = (dateMap[d][wt.key] && dateMap[d][wt.key][loc]) || 0;
				cells += `<td class="we-qty-cell">${qty > 0 ? formatNumber(qty) : '—'}</td>`;
			});
		});

		const amount = amountMap[d] || 0;
		grandTotalAmount += amount;
		cells += `<td class="we-row-total">₹${formatCurrency(amount)}</td>`;

		// Action column: pass the date, contractor id, and index of the entries
		// for this date via data attributes so we can resolve them on click.
		const entryCount = (entriesByDate[d] || []).length;
		cells += `<td class="we-action-cell">
			<button type="button" class="entry-edit-btn" data-we-action="edit" data-we-contractor-id="${contractorId}" data-we-date="${escapeHtml(d)}" title="Edit work entries for this date">Edit</button>
			<button type="button" class="entry-delete-btn" data-we-action="delete" data-we-contractor-id="${contractorId}" data-we-date="${escapeHtml(d)}" title="Delete work entries for this date">Delete</button>
			${entryCount > 1 ? `<span class="we-entry-count" title="${entryCount} entries on this date">(${entryCount})</span>` : ''}
		</td>`;
		return `<tr>${cells}</tr>`;
	}).join('');

	// ----- TOTAL row -----
	const footCells = activeWorkTypes.map((wt) => {
		return locationsByWorkType[wt.key].map((loc) => {
			let colSum = 0;
			dates.forEach((d) => {
				colSum += (dateMap[d][wt.key] && dateMap[d][wt.key][loc]) || 0;
			});
			return `<td class="we-qty-cell"><strong>${colSum > 0 ? formatNumber(colSum) : '—'}</strong></td>`;
		}).join('');
	}).join('');

	const footRow = `<tr class="we-total-row">
		<td class="we-date-cell"><strong>TOTAL</strong></td>
		${footCells}
		<td class="we-row-total"><strong>₹${formatCurrency(grandTotalAmount)}</strong></td>
		<td class="we-action-cell"></td>
	</tr>`;

	return {
		thead: headRow1 + headRow2,
		tbody: bodyRows + footRow
	};
}

async function loadWorkEntries(contractorId) {
	const tbody = document.getElementById(`work-entries-${contractorId}`);
	const thead = document.getElementById(`work-entries-thead-${contractorId}`);
	if (!tbody) return;

	await loadRateCardForContractor(contractorId, true);
	const rateHistory = state.rateCardHistory[String(contractorId)] || [];

	const entries = await fetchContractorEntries(contractorId);
	state.expandedPayments[`entries-${contractorId}`] = entries;

	const built = buildContractorWorkEntriesMatrix(contractorId, entries, rateHistory);

	if (thead) thead.innerHTML = built.thead;
	tbody.innerHTML = built.tbody;
}

/* ============================================================
   MAIN TABLE
============================================================ */

function renderTable() {
	const totalEntries = state.rows.length;
	const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
	if (state.currentPage > totalPages) state.currentPage = totalPages;

	const startIndex = (state.currentPage - 1) * PAGE_SIZE;
	const endIndex = startIndex + PAGE_SIZE;
	const pageRows = state.rows.slice(startIndex, endIndex);

	elements.contractorTableBody.innerHTML = '';

	if (!pageRows.length) {
		const tr = document.createElement('tr');
		tr.innerHTML = '<td colspan="16">No contractor records found for selected filter.</td>';
		elements.contractorTableBody.appendChild(tr);
	}

	pageRows.forEach((row, index) => {
		const balance = Number(row.balance_payable) || 0;
		const statusClass = getStatusClass(row.payment_status);
		const balanceClass = getBalanceClass(balance);
		const isExpanded = state.expandedRowId === Number(row.id);

		const tr = document.createElement('tr');
		tr.className = `contractor-row${isExpanded ? ' expanded' : ''}`;
		tr.setAttribute('data-row-id', String(row.id));
		tr.innerHTML = `
			<td>${startIndex + index + 1}</td>
			<td>
				<span class="expansion-toggle-icon">${isExpanded ? '▼' : '▶'}</span>
				<a class="name-link" href="#expand" data-view-details-id="${row.id}">${escapeHtml(row.contractor_name)}</a>
			</td>
			<td>${formatNumber(row.fabrication)}</td>
			<td>${formatNumber(row.cement_sheet)}</td>
			<td>${formatNumber(row.electrical)}</td>
			<td>${formatNumber(row.tiles)}</td>
			<td>${formatNumber(row.plumbing)}</td>
			<td>${formatNumber(row.door_fitting)}</td>
			<td>${formatNumber(row.outer_colour)}</td>
			<td>${formatNumber(row.inner_colour)}</td>
			<td>₹${formatCurrency(row.total_amount)}</td>
			<td>₹${formatCurrency(row.total_payment)}</td>
			<td class="${balanceClass}">₹${formatCurrency(balance)}</td>
			<td><span class="status-badge ${statusClass}">${escapeHtml(row.payment_status)}</span></td>
			<td>${escapeHtml(row.remark || '')}</td>
			<td>
				<div class="action-buttons">
					<button class="view-btn" type="button" data-add-payment-id="${row.id}" title="Add Payment">＋</button>
					<button class="edit-row-btn" type="button" data-edit-id="${row.id}" title="Edit Contractor">Edit</button>
					<button class="delete-row-btn" type="button" data-delete-id="${row.id}" title="Delete Contractor">Delete</button>
				</div>
			</td>
		`;
		elements.contractorTableBody.appendChild(tr);

		if (isExpanded) {
			const expansionTr = document.createElement('tr');
			expansionTr.className = 'expansion-row';
			expansionTr.setAttribute('data-expansion-id', String(row.id));
			expansionTr.innerHTML = `<td colspan="16">
				<div class="expansion-content">
					<div class="expansion-section">
						<div class="expansion-section-header">
							<span>Contractor Work Entries (${escapeHtml(row.contractor_name)})</span>
							<div class="expansion-section-header-actions">
								<button class="expansion-add-entry-btn" type="button" data-add-entry-contractor-id="${row.id}">＋ Add Work Entry</button>
							</div>
						</div>
						<div class="we-matrix-wrapper">
							<table class="we-matrix-table" id="work-entries-table-${row.id}">
								<thead id="work-entries-thead-${row.id}">
									<tr><th class="we-date-col">DATE</th><th class="we-amount-col">AMOUNT</th></tr>
								</thead>
								<tbody id="work-entries-${row.id}">
									<tr><td colspan="2" class="empty-msg">Loading entries...</td></tr>
								</tbody>
							</table>
						</div>
					</div>
					<div class="expansion-section">
						<div class="expansion-section-header">
							<span>Payment Details</span>
							<span>Total Paid: ₹${formatCurrency(row.total_payment)}</span>
						</div>
						<table class="expansion-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Paid By</th>
									<th>Mode</th>
									<th>Remarks</th>
									<th>Amount</th>
								</tr>
							</thead>
							<tbody id="payment-rows-${row.id}">
								<tr><td colspan="5" class="empty-msg">Loading payments...</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</td>`;
			elements.contractorTableBody.appendChild(expansionTr);

			loadWorkEntries(row.id);
			loadPaymentDetails(row.id);
		}
	});

	const shownFrom = totalEntries === 0 ? 0 : startIndex + 1;
	const shownTo = Math.min(endIndex, totalEntries);
	elements.tableResultText.textContent = `Showing ${shownFrom} to ${shownTo} of ${totalEntries} entries`;
	elements.paginationInfo.textContent = `Showing ${shownFrom} to ${shownTo} of ${totalEntries} entries`;

	renderPagination(totalPages);
}

async function loadPaymentDetails(contractorId) {
	const container = document.getElementById(`payment-rows-${contractorId}`);
	if (!container) return;
	const payments = await fetchContractorPayments(contractorId);
	state.expandedPayments[contractorId] = payments;

	if (!payments.length) {
		container.innerHTML = '<tr><td colspan="5" class="empty-msg">No payment records found.</td></tr>';
		return;
	}
	container.innerHTML = payments.map(p => `
		<tr>
			<td>${escapeHtml(p.payment_date || '—')}</td>
			<td>${escapeHtml(p.paid_by || '—')}</td>
			<td>${escapeHtml(p.payment_mode || '—')}</td>
			<td>${escapeHtml(p.remarks || '—')}</td>
			<td>₹${formatCurrency(p.total_amount)}</td>
		</tr>
	`).join('');
}

function renderPagination(totalPages) {
	elements.pageNumbers.innerHTML = '';
	for (let page = 1; page <= totalPages; page += 1) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = `page-number${page === state.currentPage ? ' active' : ''}`;
		button.textContent = String(page);
		button.addEventListener('click', () => {
			state.currentPage = page;
			state.expandedRowId = null;
			renderTable();
		});
		elements.pageNumbers.appendChild(button);
	}
	elements.firstPageBtn.disabled = state.currentPage === 1;
	elements.previousPageBtn.disabled = state.currentPage === 1;
	elements.nextPageBtn.disabled = state.currentPage === totalPages;
	elements.lastPageBtn.disabled = state.currentPage === totalPages;
}

function renderAll() {
	updateKpis();
	updateWorkSummary();
	renderTable();
}

/* ============================================================
   WORK ENTRY MODAL
============================================================ */

function resetWorkEntryForm() {
	elements.workEntryForm.reset();
	elements.workEntryIdInput.value = '';
	elements.workEntryContractorIdInput.value = '';
	elements.workEntryLocationSelect.value = '';
	elements.workEntryDateInput.value = getTodayISO();
	elements.workEntryFabrication.value = '0';
	elements.workEntryCementSheet.value = '0';
	elements.workEntryElectrical.value = '0';
	elements.workEntryTiles.value = '0';
	elements.workEntryPlumbing.value = '0';
	elements.workEntryDoorFitting.value = '0';
	elements.workEntryOuterColour.value = '0';
	elements.workEntryInnerColour.value = '0';
}

function openWorkEntryModal(mode, contractorId, entry) {
	resetWorkEntryForm();
	elements.workEntryContractorIdInput.value = String(contractorId || '');
	elements.workEntryDateInput.value = getTodayISO();

	if (mode === 'edit' && entry) {
		elements.workEntryModalTitle.textContent = 'Edit Work Entry';
		elements.workEntryModalSubtitle.textContent = 'Update the location entry details';
		elements.workEntryIdInput.value = String(entry.id || '');
		elements.workEntryLocationSelect.value = entry.location || '';
		elements.workEntryDateInput.value = entry.entry_date || getTodayISO();
		elements.workEntryFabrication.value = String(Number(entry.fabrication) || 0);
		elements.workEntryCementSheet.value = String(Number(entry.cement_sheet) || 0);
		elements.workEntryElectrical.value = String(Number(entry.electrical) || 0);
		elements.workEntryTiles.value = String(Number(entry.tiles) || 0);
		elements.workEntryPlumbing.value = String(Number(entry.plumbing) || 0);
		elements.workEntryDoorFitting.value = String(Number(entry.door_fitting) || 0);
		elements.workEntryOuterColour.value = String(Number(entry.outer_colour) || 0);
		elements.workEntryInnerColour.value = String(Number(entry.inner_colour) || 0);
	} else {
		elements.workEntryModalTitle.textContent = 'Add Work Entry';
		elements.workEntryModalSubtitle.textContent = 'Add a new location entry for this contractor';
	}

	elements.workEntryModal.style.display = 'flex';
}

function closeWorkEntryModal() {
	elements.workEntryModal.style.display = 'none';
	resetWorkEntryForm();
}

async function submitWorkEntry(event) {
	event.preventDefault();
	const contractorId = Number(elements.workEntryContractorIdInput.value);
	const entryId = Number(elements.workEntryIdInput.value || 0);
	const location = elements.workEntryLocationSelect.value;

	if (!Number.isInteger(contractorId) || contractorId <= 0) {
		alert('Invalid contractor.'); return;
	}
	if (!location) { alert('Please select a location.'); return; }

	const payload = {
		location,
		entry_date: elements.workEntryDateInput.value || getTodayISO(),
		fabrication: parseAmount(elements.workEntryFabrication.value),
		cement_sheet: parseAmount(elements.workEntryCementSheet.value),
		electrical: parseAmount(elements.workEntryElectrical.value),
		tiles: parseAmount(elements.workEntryTiles.value),
		plumbing: parseAmount(elements.workEntryPlumbing.value),
		door_fitting: parseAmount(elements.workEntryDoorFitting.value),
		outer_colour: parseAmount(elements.workEntryOuterColour.value),
		inner_colour: parseAmount(elements.workEntryInnerColour.value)
	};

	const allZero = WORK_TYPES.every((wt) => !payload[wt.key]);
	if (allZero) { alert('Please enter at least one work quantity.'); return; }

	const url = entryId > 0
		? `/api/contractor-payments/${contractorId}/entries/${entryId}`
		: `/api/contractor-payments/${contractorId}/entries`;
	const method = entryId > 0 ? 'PUT' : 'POST';

	let response;
	try {
		response = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload)
		});
	} catch (networkError) {
		alert(`Network error calling ${method} ${url}\n${networkError.message}`);
		return;
	}

	if (!response.ok) {
		const txt = await response.text();
		let err = null;
		try { err = JSON.parse(txt); } catch (e) {}
		alert(`Failed to save work entry\n${err && err.error ? err.error : txt.slice(0, 200)}`);
		return;
	}

	closeWorkEntryModal();
	await fetchContractorRows();

	if (state.expandedRowId === contractorId) {
		await loadWorkEntries(contractorId);
	}
}

async function deleteWorkEntry(contractorId, entryId) {
	if (!window.confirm('Delete this work entry?')) return;
	const url = `/api/contractor-payments/${contractorId}/entries/${entryId}`;
	let response;
	try {
		response = await fetch(url, { method: 'DELETE', credentials: 'include' });
	} catch (e) {
		alert(`Network error: ${e.message}`); return;
	}
	if (!response.ok) {
		alert('Failed to delete work entry.'); return;
	}
	await fetchContractorRows();
	if (state.expandedRowId === contractorId) {
		await loadWorkEntries(contractorId);
	}
}

/* ============================================================
   PAYMENT MODAL
============================================================ */

function openPaymentModal(contractorId) {
	elements.paymentForm.reset();
	elements.paymentDate.value = getTodayISO();
	elements.paymentContractor.value = contractorId ? String(contractorId) : '';
	elements.paymentModal.style.display = 'flex';
}

function closePaymentModal() {
	elements.paymentModal.style.display = 'none';
}

/* ============================================================
   EXPORT
============================================================ */

function exportTableToExcel() {
	if (!state.rows.length) { alert('No rows available for export.'); return; }
	if (typeof XLSX === 'undefined') { alert('Excel export library unavailable.'); return; }

	const exportRows = state.rows.map((row, index) => ({
		'#': index + 1,
		'Contractor Name': row.contractor_name,
		'Contract Date': row.contractor_date || '',
		Fabrication: row.fabrication,
		'Cement Sheet': row.cement_sheet,
		Electrical: row.electrical,
		Tiles: row.tiles,
		Plumbing: row.plumbing,
		'Door Fitting': row.door_fitting,
		'Outer Colour': row.outer_colour,
		'Inner Colour': row.inner_colour,
		'Total Amount': Number(row.total_amount) || 0,
		'Total Payment': Number(row.total_payment) || 0,
		'Balance Payable': Number(row.balance_payable) || 0,
		'Payment Status': row.payment_status,
		Remark: row.remark || ''
	}));

	const worksheet = XLSX.utils.json_to_sheet(exportRows);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Contractor Payments');
	XLSX.writeFile(workbook, `contractor-payments-${getTodayISO()}.xlsx`);
}

/* ============================================================
   CONTRACTOR SUBMIT / DELETE
============================================================ */

function buildAggregateFromEntries(entries) {
	const agg = {
		fabrication: 0, cement_sheet: 0, electrical: 0, tiles: 0,
		plumbing: 0, door_fitting: 0, outer_colour: 0, inner_colour: 0
	};
	entries.forEach((e) => {
		WORK_TYPES.forEach((wt) => { agg[wt.key] += Number(e[wt.key]) || 0; });
	});
	return agg;
}

async function submitContractor(event) {
	event.preventDefault();
	const contractorName = elements.contractorNameInput.value.trim();
	if (!contractorName) { alert('Contractor name is required.'); return; }
	if (!state.pendingLocationEntries.length) { alert('Please add at least one location entry.'); return; }

	const editingId = Number(elements.contractorIdInput.value || 0);
	const isEdit = Number.isInteger(editingId) && editingId > 0;

	const aggregated = buildAggregateFromEntries(state.pendingLocationEntries);
	const totalAmount = state.pendingLocationEntries.reduce(
		(sum, e) => sum + calculateEntryAmount(e, editingId || null), 0
	);
	const locations = state.pendingLocationEntries.map((e) => e.location);

	const payload = {
		contractor_name: contractorName,
		contractor_date: elements.contractorDateInput.value,
		locations,
		entries: state.pendingLocationEntries,
		fabrication: aggregated.fabrication,
		cement_sheet: aggregated.cement_sheet,
		electrical: aggregated.electrical,
		tiles: aggregated.tiles,
		plumbing: aggregated.plumbing,
		door_fitting: aggregated.door_fitting,
		outer_colour: aggregated.outer_colour,
		inner_colour: aggregated.inner_colour,
		total_amount: totalAmount,
		remark: elements.contractorRemarkInput.value.trim()
	};

	try {
		let response;
		if (isEdit) {
			response = await fetch(`/api/contractor-payments/${editingId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload)
			});
		} else {
			response = await fetch('/api/contractor-payments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload)
			});
		}

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			alert(`Failed to save contractor: ${err.error || 'Unknown error'}`);
			return;
		}
	} catch (error) {
		alert(`Network error: ${error.message}`);
		return;
	}

	closeContractorModal();
	await fetchContractorsForModal();
	await fetchContractorRows();
}

async function deleteContractor(contractorId, contractorName) {
	if (!window.confirm(`Delete contractor "${contractorName}"?`)) return;
	try {
		const response = await fetch(`/api/contractor-payments/${contractorId}`, {
			method: 'DELETE',
			credentials: 'include'
		});
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			alert(`Failed to delete: ${err.error || 'Unknown error'}`);
			return;
		}
	} catch (e) { alert(`Network error: ${e.message}`); return; }

	state.rows = state.rows.filter(r => Number(r.id) !== Number(contractorId));
	if (state.expandedRowId === Number(contractorId)) state.expandedRowId = null;
	await fetchContractorsForModal();
	await fetchContractorRows();
}

function toggleRowExpansion(contractorId) {
	const id = Number(contractorId);
	state.expandedRowId = (state.expandedRowId === id) ? null : id;
	renderTable();
}

/* ============================================================
   RATE CARD MODAL
============================================================ */

async function openRateCardModal() {
	elements.rateCardModal.style.display = 'flex';
	await fetchContractorsForModal();
	const selectedId = elements.rateCardContractorSelect.value;
	if (selectedId) {
		await loadRateCardHistory(selectedId);
		await loadRateCardIntoForm(selectedId);
	} else {
		renderRateHistory([]);
	}
}

async function loadRateCardHistory(contractorId) {
	if (!contractorId) { renderRateHistory([]); return; }
	await loadRateCardForContractor(contractorId, true);
	const history = state.rateCardHistory[String(contractorId)] || [];
	renderRateHistory(history);
}

function renderRateHistory(history) {
	if (!elements.rateHistoryBody) return;

	if (!history || !history.length) {
		elements.rateHistoryBody.innerHTML = `
			<tr>
				<td colspan="9" class="rate-history-empty">
					No rate cards found for this contractor.
				</td>
			</tr>`;
		return;
	}

	const sorted = [...history].sort(
		(a, b) => new Date(b.effective_date) - new Date(a.effective_date)
	);

	elements.rateHistoryBody.innerHTML = sorted.map((card, idx) => {
		const r = card.rates || {};
		const isLatest = idx === 0 ? ' rate-history-current' : '';
		return `
			<tr class="rate-history-row${isLatest}">
				<td>${escapeHtml(card.effective_date || '')}</td>
				<td>${formatCurrency(r.fabrication)}</td>
				<td>${formatCurrency(r.cement_sheet)}</td>
				<td>${formatCurrency(r.electrical)}</td>
				<td>${formatCurrency(r.tiles)}</td>
				<td>${formatCurrency(r.plumbing)}</td>
				<td>${formatCurrency(r.door_fitting)}</td>
				<td>${formatCurrency(r.outer_colour)}</td>
				<td>${formatCurrency(r.inner_colour)}</td>
			</tr>`;
	}).join('');
}

async function loadRateCardIntoForm(contractorId) {
	await loadRateCardForContractor(contractorId);
	const history = state.rateCardHistory[String(contractorId)] || [];
	const latest = history.length
		? [...history].sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0]
		: null;

	const rates = latest ? latest.rates : { ...DEFAULT_RATES };

	elements.rateFabrication.value = rates.fabrication || 0;
	elements.rateCementSheet.value = rates.cement_sheet || 0;
	elements.rateElectrical.value = rates.electrical || 0;
	elements.rateTiles.value = rates.tiles || 0;
	elements.ratePlumbing.value = rates.plumbing || 0;
	elements.rateDoorFitting.value = rates.door_fitting || 0;
	elements.rateOuterColour.value = rates.outer_colour || 0;
	elements.rateInnerColour.value = rates.inner_colour || 0;

	elements.rateCardDate.value = (latest && latest.effective_date)
		? latest.effective_date
		: getTodayISO();
}

async function saveRateCard() {
	const cid = elements.rateCardContractorSelect.value;
	if (!cid) { alert('Please select a contractor for the rate card.'); return; }

	const payload = {
		contractor_id: Number(cid),
		effective_date: elements.rateCardDate.value || getTodayISO(),
		rates: {
			fabrication: parseAmount(elements.rateFabrication.value),
			cement_sheet: parseAmount(elements.rateCementSheet.value),
			electrical: parseAmount(elements.rateElectrical.value),
			tiles: parseAmount(elements.rateTiles.value),
			plumbing: parseAmount(elements.ratePlumbing.value),
			door_fitting: parseAmount(elements.rateDoorFitting.value),
			outer_colour: parseAmount(elements.rateOuterColour.value),
			inner_colour: parseAmount(elements.rateInnerColour.value)
		}
	};

	try {
		const response = await fetch(RATE_CARD_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			alert(`Failed to save rate card: ${err.error || 'Unknown error'}`);
			return;
		}
		delete state.rateCardHistory[String(cid)];
		await loadRateCardHistory(cid);
		alert('Rate card saved successfully!');
		if (elements.contractorModal.style.display === 'flex') {
			calculateTotalFromPendingEntries();
			calculateLiveTotalPreview();
		}
		if (state.expandedRowId === Number(cid)) {
			await loadWorkEntries(Number(cid));
		}
	} catch (error) {
		alert(`Network error: ${error.message}`);
	}
}

/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {
	elements.applyFilterBtn.addEventListener('click', fetchContractorRows);
	elements.refreshTableBtn.addEventListener('click', fetchContractorRows);
	elements.downloadTableBtn.addEventListener('click', exportTableToExcel);
	elements.exportExcelBtn.addEventListener('click', exportTableToExcel);
	elements.printBtn.addEventListener('click', () => window.print());

	elements.resetFilterBtn.addEventListener('click', async () => {
		elements.contractorSearch.value = '';
		elements.paymentStatus.value = 'ALL';
		elements.workType.value = 'ALL';
		applyDefaultDates();
		await fetchContractorRows();
	});

	elements.addContractorBtn.addEventListener('click', () => openContractorModal('add'));
	elements.closeContractorModal.addEventListener('click', closeContractorModal);
	elements.cancelContractorBtn.addEventListener('click', closeContractorModal);
	elements.contractorForm.addEventListener('submit', submitContractor);

	elements.addLocationEntryBtn.addEventListener('click', addLocationEntry);
	elements.clearAllLocationsBtn.addEventListener('click', () => {
		if (!state.pendingLocationEntries.length) return;
		if (!window.confirm('Clear all pending location entries?')) return;
		resetPendingEntries();
	});

	elements.addedLocationsBody.addEventListener('click', (event) => {
		const removeBtn = event.target.closest('button[data-remove-entry-index]');
		if (removeBtn) {
			removeLocationEntry(Number(removeBtn.getAttribute('data-remove-entry-index')));
		}
	});

	[
		elements.fabricationInput, elements.cementSheetInput, elements.electricalInput,
		elements.tilesInput, elements.plumbingInput, elements.doorFittingInput,
		elements.outerColourInput, elements.innerColourInput
	].forEach((input) => input.addEventListener('input', calculateLiveTotalPreview));

	// Rate card modal
	elements.rateCardBtn.addEventListener('click', openRateCardModal);
	elements.closeRateCardModal.addEventListener('click', () => {
		elements.rateCardModal.style.display = 'none';
	});
	elements.cancelRateCardBtn.addEventListener('click', () => {
		elements.rateCardModal.style.display = 'none';
	});
	elements.rateCardContractorSelect.addEventListener('change', async () => {
		const cid = elements.rateCardContractorSelect.value;
		if (cid) {
			await loadRateCardHistory(cid);
			await loadRateCardIntoForm(cid);
		} else {
			renderRateHistory([]);
		}
	});
	elements.saveRateCardBtn.addEventListener('click', saveRateCard);

	// Payment modal
	elements.addPaymentBtn.addEventListener('click', () => openPaymentModal());
	elements.closePaymentModal.addEventListener('click', closePaymentModal);
	elements.cancelPaymentBtn.addEventListener('click', closePaymentModal);
	elements.paymentForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const contractorId = Number(elements.paymentContractor.value);
		if (!contractorId) { alert('Please select a contractor.'); return; }

		const payload = {
			payment_date: elements.paymentDate.value,
			payment_amount: parseAmount(elements.paymentAmount.value),
			payment_mode: elements.paymentMode.value,
			paid_by: elements.paidBy.value.trim(),
			remarks: elements.paymentRemarks.value.trim()
		};

		try {
			const response = await fetch(`/api/contractor-payments/${contractorId}/payments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(payload)
			});
			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				alert(`Failed to save payment: ${error.error || 'Unknown error'}`);
				return;
			}
		} catch (error) {
			alert(`Network error: ${error.message}`);
			return;
		}
		closePaymentModal();
		await fetchContractorRows();
	});

	// Work entry modal
	elements.closeWorkEntryModal.addEventListener('click', closeWorkEntryModal);
	elements.cancelWorkEntryBtn.addEventListener('click', closeWorkEntryModal);
	elements.workEntryForm.addEventListener('submit', submitWorkEntry);

	// Pagination
	elements.firstPageBtn.addEventListener('click', () => { state.currentPage = 1; state.expandedRowId = null; renderTable(); });
	elements.previousPageBtn.addEventListener('click', () => { state.currentPage = Math.max(1, state.currentPage - 1); state.expandedRowId = null; renderTable(); });
	elements.nextPageBtn.addEventListener('click', () => {
		const totalPages = Math.max(1, Math.ceil(state.rows.length / PAGE_SIZE));
		state.currentPage = Math.min(totalPages, state.currentPage + 1);
		state.expandedRowId = null; renderTable();
	});
	elements.lastPageBtn.addEventListener('click', () => {
		state.currentPage = Math.max(1, Math.ceil(state.rows.length / PAGE_SIZE));
		state.expandedRowId = null; renderTable();
	});

	// Main table interactions
	// Work entries matrix — Edit / Delete actions
		// Main table interactions (expansion + matrix actions + row buttons)
	elements.contractorTableBody.addEventListener('click', async (event) => {

		// ---------- 1. Work-entries matrix actions (Edit / Delete) ----------
		const matrixBtn = event.target.closest('button[data-we-action]');
		if (matrixBtn) {
			event.preventDefault();
			event.stopPropagation();

			const action = matrixBtn.getAttribute('data-we-action');
			const contractorId = Number(matrixBtn.getAttribute('data-we-contractor-id')) || 0;
			const date = matrixBtn.getAttribute('data-we-date') || '';

			if (!contractorId || !date) return;

			const allEntries = state.expandedPayments[`entries-${contractorId}`] || [];
			const dateEntries = allEntries.filter((e) => (e.entry_date || '') === date);

			if (!dateEntries.length) {
				alert('No entries found for this date.');
				return;
			}

			if (action === 'edit') {
				let target = null;
				if (dateEntries.length === 1) {
					target = dateEntries[0];
				} else {
					const labels = dateEntries.map((e, i) => `${i + 1}. ${e.location || 'Unspecified'}`);
					const choice = window.prompt(
						`Multiple entries exist for ${date}. Enter the number to edit:\n\n${labels.join('\n')}`,
						'1'
					);
					if (choice === null) return;
					const idx = Number(choice) - 1;
					if (!Number.isInteger(idx) || idx < 0 || idx >= dateEntries.length) {
						alert('Invalid selection.');
						return;
					}
					target = dateEntries[idx];
				}
				if (target) openWorkEntryModal('edit', contractorId, target);
				return;
			}

			if (action === 'delete') {
				if (dateEntries.length === 1) {
					if (!window.confirm(`Delete the entry for ${date} (${dateEntries[0].location})?`)) return;
					await deleteWorkEntry(contractorId, dateEntries[0].id);
					return;
				}
				const labels = dateEntries.map((e, i) => `${i + 1}. ${e.location || 'Unspecified'}`);
				const choice = window.prompt(
					`Multiple entries exist for ${date}. Enter the number to delete, or "all" to delete all:\n\n${labels.join('\n')}`,
					'all'
				);
				if (choice === null) return;
				if (String(choice).trim().toLowerCase() === 'all') {
					if (!window.confirm(`Delete ALL ${dateEntries.length} entries for ${date}?`)) return;
					for (const e of dateEntries) {
						await deleteWorkEntry(contractorId, e.id);
					}
					return;
				}
				const idx = Number(choice) - 1;
				if (!Number.isInteger(idx) || idx < 0 || idx >= dateEntries.length) {
					alert('Invalid selection.');
					return;
				}
				if (!window.confirm(`Delete the entry for ${date} (${dateEntries[idx].location})?`)) return;
				await deleteWorkEntry(contractorId, dateEntries[idx].id);
				return;
			}
			return;
		}

		// ---------- 2. Add Work Entry button (in expansion header) ----------
		const addEntryBtn = event.target.closest('button[data-add-entry-contractor-id]');
		if (addEntryBtn) {
			event.stopPropagation();
			const cid = Number(addEntryBtn.getAttribute('data-add-entry-contractor-id')) || 0;
			openWorkEntryModal('add', cid);
			return;
		}

		// ---------- 3. Add Payment ----------
		const addBtn = event.target.closest('button[data-add-payment-id]');
		if (addBtn) {
			event.stopPropagation();
			openPaymentModal(Number(addBtn.getAttribute('data-add-payment-id')) || 0);
			return;
		}

		// ---------- 4. Edit Contractor ----------
		const editBtn = event.target.closest('button[data-edit-id]');
		if (editBtn) {
			event.stopPropagation();
			const contractorId = Number(editBtn.getAttribute('data-edit-id')) || 0;
			const row = state.rows.find((item) => Number(item.id) === contractorId);
			if (row) openContractorModal('edit', row);
			return;
		}

		// ---------- 5. Delete Contractor ----------
		const deleteBtn = event.target.closest('button[data-delete-id]');
		if (deleteBtn) {
			event.stopPropagation();
			const contractorId = Number(deleteBtn.getAttribute('data-delete-id')) || 0;
			const row = state.rows.find((item) => Number(item.id) === contractorId);
			deleteContractor(contractorId, row ? row.contractor_name : 'selected contractor');
			return;
		}

		// ---------- 6. Name link to toggle expansion ----------
		const nameLink = event.target.closest('[data-view-details-id]');
		if (nameLink) {
			event.preventDefault();
			event.stopPropagation();
			toggleRowExpansion(Number(nameLink.getAttribute('data-view-details-id')) || 0);
			return;
		}

		// ---------- 7. Anywhere on the contractor row (but not on a button/link) ----------
		// This is what makes expansion work when you click on the row itself.
		if (event.target.closest('button, a, input, select, textarea')) {
			return; // let buttons/links do their own thing
		}
		const row = event.target.closest('.contractor-row');
		if (row) {
			toggleRowExpansion(Number(row.getAttribute('data-row-id')) || 0);
		}
	});
}

function applyDefaultDates() {
	const today = getTodayISO();
	const monthStart = getMonthStartISO();
	elements.fromDate.value = monthStart;
	elements.toDate.value = today;
	elements.paymentDate.value = today;

	if (elements.contractorDateInput) {
		elements.contractorDateInput.max = today;
		elements.contractorDateInput.value = today;
	}

	const readableDate = new Date(today).toLocaleDateString('en-GB', {
		day: '2-digit', month: 'short', year: 'numeric'
	});
	elements.currentDate.textContent = readableDate;
}

async function initializePage() {
	applyDefaultDates();
	bindEvents();
	await fetchContractorsForModal();
	await fetchContractorRows();
}

initializePage();