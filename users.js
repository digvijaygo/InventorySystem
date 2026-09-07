const API_URL = './api/users';

const usersTableBody = document.getElementById('usersTableBody');
const statusText = document.getElementById('statusText');
const addUserBtn = document.getElementById('addUserBtn');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const cancelBtn = document.getElementById('cancelBtn');
const closeUserModalBtn = document.getElementById('closeUserModal');
const saveUserBtn = document.getElementById('saveUserBtn');

const userIdInput = document.getElementById('userId');
const fullNameInput = document.getElementById('fullName');
const mobileNumberInput = document.getElementById('mobileNumber');
const roleInput = document.getElementById('role');
const isActiveInput = document.getElementById('isActive');

let users = [];

function setStatus(message, isError = false) {
    statusText.textContent = message || '';
    statusText.classList.toggle('error', Boolean(isError));
}

function normalizeMobileNumber(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function closeModal() {
    userModal.style.display = 'none';
    userForm.reset();
    userIdInput.value = '';
}

function openAddModal() {
    modalTitle.textContent = 'Add New User';
    modalSubtitle.textContent = 'Create a user account with role and status';
    saveUserBtn.textContent = 'Save User';
    userIdInput.value = '';
    fullNameInput.value = '';
    mobileNumberInput.value = '';
    roleInput.value = 'Employee';
    isActiveInput.value = '1';
    userModal.style.display = 'grid';
}

function openEditModal(user) {
    modalTitle.textContent = 'Edit User';
    modalSubtitle.textContent = 'Update user details, role and status';
    saveUserBtn.textContent = 'Update User';
    userIdInput.value = String(user.id);
    fullNameInput.value = user.full_name || '';
    mobileNumberInput.value = user.mobile_number || '';
    roleInput.value = user.role || 'Employee';
    isActiveInput.value = String(Number(user.is_active) === 1 ? 1 : 0);
    userModal.style.display = 'grid';
}

function renderUsers() {
    usersTableBody.innerHTML = '';

    if (!users.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6">No users found.</td>';
        usersTableBody.appendChild(tr);
        return;
    }

    users.forEach((user) => {
        const isActive = Number(user.is_active) === 1;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${escapeHtml(user.full_name)}</td>
            <td>${escapeHtml(user.mobile_number)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td><span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="actions">
                    <button type="button" class="edit-btn" data-edit-id="${user.id}">Edit</button>
                    <button type="button" class="delete-btn" data-delete-id="${user.id}">Delete</button>
                </div>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function fetchUsers() {
    setStatus('Loading users...');
    try {
        const response = await fetch(API_URL, { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(payload.error || 'Failed to load users.');
        }

        users = payload;
        renderUsers();
        setStatus('Users loaded successfully.');
    } catch (error) {
        setStatus(error.message || 'Failed to load users.', true);
    }
}

async function saveUser(event) {
    event.preventDefault();

    const id = Number(userIdInput.value);
    const full_name = fullNameInput.value.trim();
    const mobile_number = normalizeMobileNumber(mobileNumberInput.value);
    const role = roleInput.value;
    const is_active = Number(isActiveInput.value) === 1 ? 1 : 0;

    if (!full_name) {
        setStatus('Full name is required.', true);
        return;
    }

    if (!/^\d{10}$/.test(mobile_number)) {
        setStatus('Enter a valid 10-digit mobile number.', true);
        return;
    }

    const payload = { full_name, mobile_number, role, is_active };
    const isEdit = Number.isInteger(id) && id > 0;

    try {
        const response = await fetch(isEdit ? `${API_URL}/${id}` : API_URL, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.error || 'Failed to save user.');
        }

        closeModal();
        setStatus(isEdit ? 'User updated successfully.' : 'User added successfully.');
        await fetchUsers();
    } catch (error) {
        setStatus(error.message || 'Failed to save user.', true);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.error || 'Failed to delete user.');
        }

        setStatus('User deleted successfully.');
        await fetchUsers();
    } catch (error) {
        setStatus(error.message || 'Failed to delete user.', true);
    }
}

addUserBtn.addEventListener('click', openAddModal);
cancelBtn.addEventListener('click', closeModal);
closeUserModalBtn.addEventListener('click', closeModal);
userModal.addEventListener('click', (event) => {
    if (event.target === userModal) {
        closeModal();
    }
});
userForm.addEventListener('submit', saveUser);

usersTableBody.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-id]');
    if (editButton) {
        const userId = Number(editButton.getAttribute('data-edit-id'));
        const user = users.find((entry) => entry.id === userId);
        if (user) {
            openEditModal(user);
        }
        return;
    }

    const deleteButton = event.target.closest('[data-delete-id]');
    if (deleteButton) {
        const userId = Number(deleteButton.getAttribute('data-delete-id'));
        if (Number.isInteger(userId) && userId > 0) {
            deleteUser(userId);
        }
    }
});

fetchUsers();
