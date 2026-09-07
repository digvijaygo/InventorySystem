const CONTRACTOR_API_URL = './api/contractor-payments';
const CONTRACTOR_LIST_API_URL = './api/contractor-payment-contractors';
const PAGE_SIZE = 8;

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
	paymentModalTitle: document.querySelector('#paymentModal h2'),
	paymentModalSubtitle: document.querySelector('#paymentModal .modal-header p'),
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
	contractorDetailsModal: document.getElementById('contractorDetailsModal'),
	closeDetailsModal: document.getElementById('closeDetailsModal'),
	detailsModalTitle: document.getElementById('detailsModalTitle'),
	detailsModalSubtitle: document.getElementById('detailsModalSubtitle'),
	contractorDetailsBody: document.getElementById('contractorDetailsBody')
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

const state = {
	rows: [],
	contractors: [],
	detailPayments: [],
	currentPage: 1,
	editingContractorId: null
	,editingPaymentId: null
};

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
	if (!Number.isFinite(amount) || amount < 0) {
		return 0;
	}
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
	if (Number.isInteger(amount)) {
		return String(amount);
	}

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

function applyDefaultDates() {
	const today = getTodayISO();
	const monthStart = getMonthStartISO();
	elements.fromDate.value = monthStart;
	elements.toDate.value = today;
	elements.paymentDate.value = today;

	const readableDate = new Date(today).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
	elements.currentDate.textContent = readableDate;
}

function resetContractorForm() {
	elements.contractorForm.reset();
	elements.contractorIdInput.value = '';
	elements.fabricationInput.value = '0';
	elements.cementSheetInput.value = '0';
	elements.electricalInput.value = '0';
	elements.tilesInput.value = '0';
	elements.plumbingInput.value = '0';
	elements.doorFittingInput.value = '0';
	elements.outerColourInput.value = '0';
	elements.innerColourInput.value = '0';
	elements.totalAmountInput.value = '0';
	state.editingContractorId = null;
}

function openContractorModal(mode, row) {
	resetContractorForm();

	if (mode === 'edit' && row) {
		state.editingContractorId = Number(row.id) || null;
		elements.contractorModalTitle.textContent = 'Edit Contractor';
		elements.contractorIdInput.value = String(row.id || '');
		elements.contractorNameInput.value = row.contractor_name || '';
		elements.fabricationInput.value = String(Number(row.fabrication) || 0);
		elements.cementSheetInput.value = String(Number(row.cement_sheet) || 0);
		elements.electricalInput.value = String(Number(row.electrical) || 0);
		elements.tilesInput.value = String(Number(row.tiles) || 0);
		elements.plumbingInput.value = String(Number(row.plumbing) || 0);
		elements.doorFittingInput.value = String(Number(row.door_fitting) || 0);
		elements.outerColourInput.value = String(Number(row.outer_colour) || 0);
		elements.innerColourInput.value = String(Number(row.inner_colour) || 0);
		elements.totalAmountInput.value = String(Number(row.total_amount) || 0);
		elements.contractorRemarkInput.value = row.remark || '';
	} else {
		elements.contractorModalTitle.textContent = 'Add Contractor';
	}

	elements.contractorModal.style.display = 'flex';
}

function closeContractorModal() {
	elements.contractorModal.style.display = 'none';
	resetContractorForm();
}

function closeDetailsModal() {
	elements.contractorDetailsModal.style.display = 'none';
	elements.contractorDetailsBody.innerHTML = '';
}

function showNoDetailsModal(contractorName, subtitleText) {
	elements.detailsModalTitle.textContent = `${contractorName} - Day-wise Details`;
	elements.detailsModalSubtitle.textContent = subtitleText;
	elements.contractorDetailsBody.innerHTML = '';
	const tr = document.createElement('tr');
	tr.innerHTML = '<td colspan="5">No records available.</td>';
	elements.contractorDetailsBody.appendChild(tr);
	elements.contractorDetailsModal.style.display = 'flex';
}

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
	});
	if (!response.ok) {
		const errorPayload = await response.json().catch(() => ({}));
		throw new Error(errorPayload.error || 'Unable to load contractor data.');
	}

	const payload = await response.json();
	state.rows = Array.isArray(payload.rows) ? payload.rows : [];
	state.currentPage = 1;
	renderAll();
}

async function fetchContractorsForModal() {
	const response = await fetch(CONTRACTOR_LIST_API_URL, {
		credentials: 'include'
	});
	if (!response.ok) {
		const errorPayload = await response.json().catch(() => ({}));
		throw new Error(errorPayload.error || 'Unable to load contractors.');
	}

	const rows = await response.json();
	state.contractors = Array.isArray(rows) ? rows : [];

	elements.paymentContractor.innerHTML = '<option value="">Select Contractor</option>';
	state.contractors.forEach((entry) => {
		const option = document.createElement('option');
		option.value = String(entry.id);
		option.textContent = entry.contractor_name;
		elements.paymentContractor.appendChild(option);
	});
}

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

		if (bar) {
			bar.style.width = `${percent}%`;
		}
		if (valueNode) {
			valueNode.textContent = formatNumber(value);
		}
	});
}

function renderTable() {
	const totalEntries = state.rows.length;
	const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
	if (state.currentPage > totalPages) {
		state.currentPage = totalPages;
	}

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

		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${startIndex + index + 1}</td>
			<td>
				<a class="name-link" href="#contractorDetailsModal" data-view-details-id="${row.id}">${escapeHtml(row.contractor_name)}</a>
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
	});

	const shownFrom = totalEntries === 0 ? 0 : startIndex + 1;
	const shownTo = Math.min(endIndex, totalEntries);
	elements.tableResultText.textContent = `Showing ${shownFrom} to ${shownTo} of ${totalEntries} entries`;
	elements.paginationInfo.textContent = `Showing ${shownFrom} to ${shownTo} of ${totalEntries} entries`;

	renderPagination(totalPages);
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

function openPaymentModal(contractorId) {
	elements.paymentForm.reset();
	state.editingPaymentId = null;
	elements.paymentModalTitle.textContent = 'Add Contractor Payment';
	elements.paymentModalSubtitle.textContent = 'Record a new contractor payment';
	elements.paymentDate.value = getTodayISO();
	elements.paymentContractor.value = contractorId ? String(contractorId) : '';
	elements.paymentModal.style.display = 'flex';
}

function openEditPaymentModal(contractorId, payment) {
	state.editingPaymentId = Number(payment.id);
	elements.paymentForm.reset();
	elements.paymentContractor.value = String(contractorId);
	elements.paymentContractor.disabled = true;
	elements.paymentDate.value = payment.payment_date || '';
	elements.paymentAmount.value = payment.total_amount || '';
	elements.paymentMode.value = payment.payment_mode || 'Online';
	elements.paidBy.value = payment.paid_by || '';
	elements.paymentRemarks.value = payment.remarks || '';
	elements.paymentModalTitle.textContent = 'Edit Contractor Payment';
	elements.paymentModalSubtitle.textContent = 'Update the selected payment record';
	elements.paymentModal.style.display = 'flex';
}

function closePaymentModal() {
	elements.paymentModal.style.display = 'none';
	state.editingPaymentId = null;
	elements.paymentContractor.disabled = false;
	elements.paymentModalTitle.textContent = 'Add Contractor Payment';
	elements.paymentModalSubtitle.textContent = 'Record a new contractor payment';
}

function exportTableToExcel() {
	if (!state.rows.length) {
		alert('No rows available for export.');
		return;
	}

	if (typeof XLSX === 'undefined') {
		alert('Excel export library unavailable. Please refresh and try again.');
		return;
	}

	const exportRows = state.rows.map((row, index) => ({
		'#': index + 1,
		'Contractor Name': row.contractor_name,
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

function getContractorPayloadFromForm() {
	return {
		contractor_name: elements.contractorNameInput.value.trim(),
		fabrication: parseAmount(elements.fabricationInput.value),
		cement_sheet: parseAmount(elements.cementSheetInput.value),
		electrical: parseAmount(elements.electricalInput.value),
		tiles: parseAmount(elements.tilesInput.value),
		plumbing: parseAmount(elements.plumbingInput.value),
		door_fitting: parseAmount(elements.doorFittingInput.value),
		outer_colour: parseAmount(elements.outerColourInput.value),
		inner_colour: parseAmount(elements.innerColourInput.value),
		total_amount: parseAmount(elements.totalAmountInput.value),
		remark: elements.contractorRemarkInput.value.trim()
	};
}

async function submitContractor(event) {
	event.preventDefault();

	const payload = getContractorPayloadFromForm();
	if (!payload.contractor_name) {
		alert('Contractor name is required.');
		return;
	}

	const editingId = Number(elements.contractorIdInput.value || 0);
	const isEdit = Number.isInteger(editingId) && editingId > 0;
	const url = isEdit ? `${CONTRACTOR_API_URL}/${editingId}` : CONTRACTOR_API_URL;
	const method = isEdit ? 'PUT' : 'POST';

	try {
		const response = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			throw new Error(errorPayload.error || 'Unable to save contractor.');
		}

		closeContractorModal();
		await fetchContractorsForModal();
		await fetchContractorRows();
	} catch (error) {
		console.error(error);
		alert(error.message || 'Unable to save contractor.');
	}
}

async function deleteContractor(contractorId, contractorName) {
	if (!Number.isInteger(contractorId) || contractorId <= 0) {
		alert('Invalid contractor selected.');
		return;
	}

	const yes = window.confirm(`Delete contractor "${contractorName}"? This will remove its payment history too.`);
	if (!yes) {
		return;
	}

	try {
		const response = await fetch(`${CONTRACTOR_API_URL}/${contractorId}`, {
			method: 'DELETE',
			credentials: 'include'
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			throw new Error(errorPayload.error || 'Unable to delete contractor.');
		}

		await fetchContractorsForModal();
		await fetchContractorRows();
	} catch (error) {
		console.error(error);
		alert(error.message || 'Unable to delete contractor.');
	}
}

async function openDetailsModal(row, showAllPayments = false) {
	const contractorId = Number(row && row.id);
	if (!Number.isInteger(contractorId) || contractorId <= 0) {
		alert('Invalid contractor selected.');
		return;
	}

	const contractorName = row && row.contractor_name ? row.contractor_name : 'Contractor';
	const params = new URLSearchParams();
	if (!showAllPayments && elements.fromDate.value) params.set('fromDate', elements.fromDate.value);
	if (!showAllPayments && elements.toDate.value) params.set('toDate', elements.toDate.value);

	try {
		const response = await fetch(`${CONTRACTOR_API_URL}/${contractorId}/daywise?${params.toString()}`, {
			credentials: 'include'
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			throw new Error(errorPayload.error || 'Unable to load details.');
		}

		const payload = await response.json();
		const dayWise = Array.isArray(payload.dayWise) ? payload.dayWise : [];
		state.detailPayments = dayWise;
		const resolvedContractorName = (payload.contractor && payload.contractor.contractor_name) || contractorName;

		elements.detailsModalTitle.textContent = `${resolvedContractorName} - Day-wise Details`;
		if (payload.period && payload.period.fromDate && payload.period.toDate) {
			elements.detailsModalSubtitle.textContent = `${payload.period.fromDate} to ${payload.period.toDate}`;
		} else {
			elements.detailsModalSubtitle.textContent = 'All available payment dates';
		}

		elements.contractorDetailsBody.innerHTML = '';
		if (!dayWise.length) {
			showNoDetailsModal(resolvedContractorName, elements.detailsModalSubtitle.textContent);
		} else {
			dayWise.forEach((entry) => {
				const tr = document.createElement('tr');
				tr.innerHTML = `
					<td>${escapeHtml(entry.payment_date)}</td>
					<td>${escapeHtml(entry.paid_by || '-')}</td>
					<td>${escapeHtml(entry.payment_mode || '-')}</td>
					<td>₹${formatCurrency(entry.total_amount)}</td>
					<td><button class="details-edit-btn" type="button" data-edit-payment-id="${entry.id}" data-contractor-id="${contractorId}">Edit</button> <button class="details-delete-btn" type="button" data-delete-payment-id="${entry.id}" data-contractor-id="${contractorId}">Delete</button></td>
				`;
				tr.dataset.paymentId = String(entry.id);
				elements.contractorDetailsBody.appendChild(tr);
				tr.dataset.contractorId = String(contractorId);
			});
			elements.contractorDetailsModal.style.display = 'flex';
		}
	} catch (error) {
		console.error(error);
		showNoDetailsModal(contractorName, 'Unable to load details right now');
	}
}

async function submitPayment(event) {
	event.preventDefault();

	const contractorId = Number(elements.paymentContractor.value);
	const payload = {
		payment_date: elements.paymentDate.value,
		payment_amount: Number(elements.paymentAmount.value || 0),
		payment_mode: elements.paymentMode.value,
		paid_by: elements.paidBy.value.trim(),
		remarks: elements.paymentRemarks.value.trim()
	};

	if (!Number.isInteger(contractorId) || contractorId <= 0) {
		alert('Please select a contractor.');
		return;
	}

	try {
		const isEditing = Number.isInteger(state.editingPaymentId) && state.editingPaymentId > 0;
		const response = await fetch(isEditing ? `${CONTRACTOR_API_URL}/${contractorId}/payments/${state.editingPaymentId}` : `${CONTRACTOR_API_URL}/${contractorId}/payments`, {
			method: isEditing ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorPayload = await response.json().catch(() => ({}));
			throw new Error(errorPayload.error || 'Unable to save payment.');
		}

		closePaymentModal();
		await fetchContractorRows();
		if (isEditing) {
			const updatedRow = state.rows.find((row) => Number(row.id) === contractorId);
			if (updatedRow) await openDetailsModal(updatedRow, true);
		}
	} catch (error) {
		console.error(error);
		alert(error.message || 'Unable to save payment.');
	}
}

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
	elements.contractorModal.addEventListener('click', (event) => {
		if (event.target === elements.contractorModal) {
			closeContractorModal();
		}
	});
	elements.contractorForm.addEventListener('submit', submitContractor);

	elements.addPaymentBtn.addEventListener('click', () => openPaymentModal());
	elements.closePaymentModal.addEventListener('click', closePaymentModal);
	elements.cancelPaymentBtn.addEventListener('click', closePaymentModal);
	elements.paymentModal.addEventListener('click', (event) => {
		if (event.target === elements.paymentModal) {
			closePaymentModal();
		}
	});

	elements.closeDetailsModal.addEventListener('click', closeDetailsModal);
	elements.contractorDetailsModal.addEventListener('click', (event) => {
		if (event.target === elements.contractorDetailsModal) {
			closeDetailsModal();
		}
		const editButton = event.target.closest('[data-edit-payment-id]');
		const deleteButton = event.target.closest('[data-delete-payment-id]');
		if (!editButton && !deleteButton) return;
		const paymentId = Number((editButton || deleteButton).getAttribute(editButton ? 'data-edit-payment-id' : 'data-delete-payment-id'));
		const row = event.target.closest('tr');
		const contractorId = Number((editButton || deleteButton).getAttribute('data-contractor-id') || (row && row.dataset.contractorId));
		if (!paymentId || !contractorId) {
			alert('Unable to identify this payment record. Please refresh the details.');
			return;
		}
		if (editButton) {
			const payment = state.detailPayments && state.detailPayments.find((entry) => Number(entry.id) === paymentId);
			if (payment) {
				openEditPaymentModal(contractorId, payment);
				return;
			}
			fetch(`${CONTRACTOR_API_URL}/${contractorId}/transactions`, { credentials: 'include' })
				.then((response) => response.json())
				.then((payload) => {
					const freshPayment = (payload.dayWise || []).find((entry) => Number(entry.id) === paymentId);
					if (!freshPayment) throw new Error('Payment transaction not found.');
					state.detailPayments = payload.dayWise;
					openEditPaymentModal(contractorId, freshPayment);
				})
				.catch((error) => alert(error.message));
			return;
		}
		if (!window.confirm('Delete this payment record?')) return;
		fetch(`${CONTRACTOR_API_URL}/${contractorId}/payments/${paymentId}`, { method: 'DELETE', credentials: 'include' })
			.then(async (response) => { if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Unable to delete payment.'); await fetchContractorRows(); closeDetailsModal(); })
			.catch((error) => alert(error.message));
	});

	elements.paymentForm.addEventListener('submit', submitPayment);

	elements.firstPageBtn.addEventListener('click', () => {
		state.currentPage = 1;
		renderTable();
	});

	elements.previousPageBtn.addEventListener('click', () => {
		state.currentPage = Math.max(1, state.currentPage - 1);
		renderTable();
	});

	elements.nextPageBtn.addEventListener('click', () => {
		const totalPages = Math.max(1, Math.ceil(state.rows.length / PAGE_SIZE));
		state.currentPage = Math.min(totalPages, state.currentPage + 1);
		renderTable();
	});

	elements.lastPageBtn.addEventListener('click', () => {
		state.currentPage = Math.max(1, Math.ceil(state.rows.length / PAGE_SIZE));
		renderTable();
	});

	elements.contractorTableBody.addEventListener('click', (event) => {
		const addBtn = event.target.closest('button[data-add-payment-id]');
		if (addBtn) {
			openPaymentModal(Number(addBtn.getAttribute('data-add-payment-id')) || 0);
			return;
		}

		const editBtn = event.target.closest('button[data-edit-id]');
		if (editBtn) {
			const contractorId = Number(editBtn.getAttribute('data-edit-id')) || 0;
			const row = state.rows.find((item) => Number(item.id) === contractorId);
			if (!row) {
				alert('Unable to find selected contractor details.');
				return;
			}
			openContractorModal('edit', row);
			return;
		}

		const deleteBtn = event.target.closest('button[data-delete-id]');
		if (deleteBtn) {
			const contractorId = Number(deleteBtn.getAttribute('data-delete-id')) || 0;
			const row = state.rows.find((item) => Number(item.id) === contractorId);
			deleteContractor(contractorId, row ? row.contractor_name : 'selected contractor');
			return;
		}

		const detailsBtn = event.target.closest('[data-view-details-id]');
		if (detailsBtn) {
			event.preventDefault();
			const contractorId = Number(detailsBtn.getAttribute('data-view-details-id')) || 0;
			const row = state.rows.find((item) => Number(item.id) === contractorId);
			if (!row) {
				alert('Unable to find selected contractor details.');
				return;
			}
			openDetailsModal(row);
		}
	});

	elements.contractorSearch.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			fetchContractorRows();
		}
	});
}

async function initializePage() {
	applyDefaultDates();
	bindEvents();

	try {
		await fetchContractorsForModal();
		await fetchContractorRows();
	} catch (error) {
		console.error(error);
		alert(error.message || 'Unable to initialize contractor payment module.');
	}
}

initializePage();
