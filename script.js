
"use strict";

// ==========================================
// FINTRACK 2.0 - ADVANCED FINANCE TRACKER
// ==========================================

// ELEMENT HTML
const $ = (id) => document.getElementById(id);

const form = $("transactionForm");
const descriptionInput = $("description");
const amountInput = $("amount");
const typeInput = $("type");
const categoryInput = $("category");
const dateInput = $("date");

const totalBalance = $("totalBalance");
const totalIncome = $("totalIncome");
const totalExpense = $("totalExpense");

const transactionList = $("transactionList");
const searchInput = $("searchInput");
const filterMonth = $("filterMonth");
const filterType = $("filterType");
const chartMonth = $("chartMonth");

const submitButton = $("submitButton");
const cancelEdit = $("cancelEdit");
const formTitle = $("formTitle");
const themeToggle = $("themeToggle");
const financeChart = $("financeChart");

// ==========================================
// CONFIGURATION
// ==========================================

const STORAGE_KEY = "fintrack_v2_transactions";
const THEME_KEY = "fintrack_v2_theme";

const today = new Date().toLocaleDateString("en-CA");

dateInput.value = today;
dateInput.max = today;
chartMonth.value = today.slice(0, 7);

// Format Rupiah
function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(value);
}

// ==========================================
// DATA MANAGEMENT
// ==========================================

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) return [];

        const data = JSON.parse(raw);

        if (!Array.isArray(data)) return [];

        return data.filter(item =>
            item &&
            Number.isSafeInteger(item.id) &&
            typeof item.description === "string" &&
            item.description.length > 0 &&
            Number.isSafeInteger(item.amount) &&
            item.amount > 0 &&
            ["income", "expense"].includes(item.type) &&
            typeof item.category === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
            item.date <= today
        );
    } catch (error) {
        console.error("Data tidak dapat dibaca:", error);
        return [];
    }
}

let transactions = loadData();
let editingId = null;

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
        return true;
    } catch (error) {
        console.error("Gagal menyimpan data:", error);
        alert("Penyimpanan gagal. Periksa kapasitas browser.");
        return false;
    }
}

// ==========================================
// ADD AND EDIT TRANSACTION
// ==========================================

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || description.length > 60) {
        alert("Nama transaksi harus berisi 1-60 karakter.");
        return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
        alert("Jumlah transaksi harus berupa angka positif.");
        return;
    }

    if (!date || date > today) {
        alert("Tanggal transaksi tidak valid.");
        return;
    }

    if (editingId !== null) {
        const index = transactions.findIndex(
            item => item.id === editingId
        );

        if (index === -1) {
            alert("Transaksi tidak ditemukan.");
            resetForm();
            return;
        }

        const updated = {
            ...transactions[index],
            description,
            amount,
            type,
            category,
            date
        };

        const previous = transactions[index];
        transactions[index] = updated;

        if (!saveData()) {
            transactions[index] = previous;
            return;
        }

        alert("Transaksi berhasil diperbarui!");

    } else {
        const newTransaction = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            description,
            amount,
            type,
            category,
            date
        };

        transactions.push(newTransaction);

        if (!saveData()) {
            transactions.pop();
            return;
        }
    }

    resetForm();
    updateDashboard();
});

function editTransaction(id) {
    const item = transactions.find(
        transaction => transaction.id === id
    );

    if (!item) return;

    editingId = id;

    descriptionInput.value = item.description;
    amountInput.value = item.amount;
    typeInput.value = item.type;
    categoryInput.value = item.category;
    dateInput.value = item.date;

    formTitle.textContent = "Edit Transaksi";
    submitButton.textContent = "Simpan Perubahan";

    cancelEdit.classList.remove("hidden");

    $("dashboard").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function resetForm() {
    editingId = null;

    form.reset();
    dateInput.value = today;

    formTitle.textContent = "Tambah Transaksi";
    submitButton.textContent = "+ Simpan Transaksi";

    cancelEdit.classList.add("hidden");
}

cancelEdit.addEventListener("click", resetForm);

// ==========================================
// DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {
    const confirmation = confirm(
        "Yakin ingin menghapus transaksi ini?"
    );

    if (!confirmation) return;

    const previous = transactions;

    transactions = transactions.filter(
        item => item.id !== id
    );

    if (!saveData()) {
        transactions = previous;
        return;
    }

    if (editingId === id) resetForm();

    updateDashboard();
}

// ==========================================
// CALCULATE FINANCIAL SUMMARY
// ==========================================

function calculateTotals(items = transactions) {
    let income = 0;
    let expense = 0;

    items.forEach(item => {
        if (item.type === "income") {
            income += item.amount;
        } else {
            expense += item.amount;
        }
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}

// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {
    const totals = calculateTotals();

    totalBalance.textContent = rupiah(totals.balance);
    totalIncome.textContent = rupiah(totals.income);
    totalExpense.textContent = rupiah(totals.expense);

    renderTransactions();
    drawChart();
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function getFilteredTransactions() {
    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    const selectedMonth = filterMonth.value;
    const selectedType = filterType.value;

    return transactions
        .filter(item => {
            const matchesSearch =
                item.description.toLowerCase().includes(keyword) ||
                item.category.toLowerCase().includes(keyword);

            const matchesMonth =
                !selectedMonth ||
                item.date.startsWith(selectedMonth);

            const matchesType =
                selectedType === "all" ||
                item.type === selectedType;

            return matchesSearch &&
                matchesMonth &&
                matchesType;
        })
        .sort((a, b) =>
            b.date.localeCompare(a.date) || b.id - a.id
        );
}

function renderTransactions() {
    const items = getFilteredTransactions();

    transactionList.replaceChildren();

    $("transactionCount").textContent =
        `${items.length} transaksi`;

    if (items.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = "Tidak ada transaksi ditemukan.";

        row.appendChild(cell);
        transactionList.appendChild(row);

        return;
    }

    items.forEach(item => {
        const row = document.createElement("tr");

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = item.description;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = item.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(
            item.date + "T00:00:00"
        ).toLocaleDateString("id-ID");

        const amountCell = document.createElement("td");

        amountCell.textContent =
            (item.type === "income" ? "+ " : "- ") +
            rupiah(item.amount);

        amountCell.className =
            item.type === "income"
                ? "income-text"
                : "expense-text";

        const actionCell = document.createElement("td");
        const actions = document.createElement("div");

        actions.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-button";
        editButton.type = "button";

        editButton.addEventListener("click", () => {
            editTransaction(item.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Hapus";
        deleteButton.className = "delete-button";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(item.id);
        });

        actions.append(editButton, deleteButton);
        actionCell.appendChild(actions);

        row.append(
            descriptionCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        transactionList.appendChild(row);
    });
}

// Filter listeners
searchInput.addEventListener("input", renderTransactions);
filterMonth.addEventListener("change", renderTransactions);
filterType.addEventListener("change", renderTransactions);

$("resetFilters").addEventListener("click", () => {
    searchInput.value = "";
    filterMonth.value = "";
    filterType.value = "all";

    renderTransactions();
});

// ==========================================
// MONTHLY CHART
// ==========================================

function drawChart() {
    const canvas = financeChart;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const selectedMonth = chartMonth.value;

    const monthTransactions = transactions.filter(
        item => item.date.startsWith(selectedMonth)
    );

    const daysInMonth = selectedMonth
        ? new Date(
            Number(selectedMonth.slice(0, 4)),
            Number(selectedMonth.slice(5, 7)),
            0
        ).getDate()
        : 30;

    const dailyIncome = Array(daysInMonth).fill(0);
    const dailyExpense = Array(daysInMonth).fill(0);

    monthTransactions.forEach(item => {
        const day = Number(item.date.slice(8, 10)) - 1;

        if (item.type === "income") {
            dailyIncome[day] += item.amount;
        } else {
            dailyExpense[day] += item.amount;
        }
    });

    const maxValue = Math.max(
        ...dailyIncome,
        ...dailyExpense,
        1
    );

    const left = 42;
    const right = 12;
    const top = 25;
    const bottom = 35;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const styles = getComputedStyle(document.body);

    const muted = styles.getPropertyValue("--muted").trim();
    const border = styles.getPropertyValue("--border").trim();

    // Grid lines
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";

    for (let i = 0; i <= 4; i++) {
        const y = top + chartHeight * i / 4;

        ctx.beginPath();
        ctx.strokeStyle = border;
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();

        const value = maxValue * (4 - i) / 4;

        const label = value >= 1000000
            ? (value / 1000000).toFixed(1) + "jt"
            : value >= 1000
                ? Math.round(value / 1000) + "rb"
                : Math.round(value);

        ctx.fillStyle = muted;
        ctx.fillText(label, left - 7, y + 3);
    }

    // Bar chart
    const groupWidth = chartWidth / daysInMonth;
    const barWidth = Math.max(
        1,
        Math.min(9, groupWidth * 0.32)
    );

    dailyIncome.forEach((income, index) => {
        const expense = dailyExpense[index];

        const center = left + groupWidth * (index + 0.5);

        const incomeHeight = income / maxValue * chartHeight;
        const expenseHeight = expense / maxValue * chartHeight;

        ctx.fillStyle = "#16a875";

        ctx.fillRect(
            center - barWidth - 1,
            top + chartHeight - incomeHeight,
            barWidth,
            incomeHeight
        );

        ctx.fillStyle = "#e65365";

        ctx.fillRect(
            center + 1,
            top + chartHeight - expenseHeight,
            barWidth,
            expenseHeight
        );
    });

    // X-axis labels
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.font = "10px Inter, sans-serif";

    const step = daysInMonth > 20 ? 5 : 3;

    for (let day = 0; day < daysInMonth; day += step) {
        const x = left + groupWidth * (day + 0.5);

        ctx.fillText(
            String(day + 1),
            x,
            height - 12
        );
    }
}

chartMonth.addEventListener("change", drawChart);

// Redraw when chart size changes
const observer = new ResizeObserver(drawChart);

observer.observe(
    document.querySelector(".chart-container")
);

// ==========================================
// EXPORT CSV
// ==========================================

$("exportButton").addEventListener("click", () => {
    const items = getFilteredTransactions();

    if (items.length === 0) {
        alert("Tidak ada transaksi untuk diekspor.");
        return;
    }

    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const rows = [
        ["Nama Transaksi", "Jenis", "Kategori", "Tanggal", "Jumlah"],
        ...items.map(item => [
            item.description,
            item.type === "income" ? "Pemasukan" : "Pengeluaran",
            item.category,
            item.date,
            item.amount
        ])
    ];

    const csv = "\uFEFF" + rows
        .map(row => row.map(escapeCSV).join(";"))
        .join("\r\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "laporan-keuangan-fintrack.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});

// ==========================================
// DARK MODE
// ==========================================

function applyTheme(theme) {
    document.body.classList.toggle(
        "dark-mode",
        theme === "dark"
    );

    themeToggle.textContent =
        theme === "dark" ? "☀️" : "🌙";

    themeToggle.setAttribute(
        "aria-label",
        theme === "dark"
            ? "Aktifkan mode terang"
            : "Aktifkan mode gelap"
    );

    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("Tema tidak dapat disimpan.");
    }

    drawChart();
}

let currentTheme = "light";

try {
    currentTheme =
        localStorage.getItem(THEME_KEY) || "light";
} catch (error) {
    console.warn("Pengaturan tema tidak tersedia.");
}

applyTheme(currentTheme);

themeToggle.addEventListener("click", () => {
    currentTheme =
        currentTheme === "light" ? "dark" : "light";

    applyTheme(currentTheme);
});

// ==========================================
// NAVIGATION
// ==========================================

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function() {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

updateDashboard();
