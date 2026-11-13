// =====================================
// FINTRACK - PERSONAL FINANCE TRACKER
// =====================================

// Mengambil elemen HTML
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");

const transactionList = document.getElementById("transactionList");
const filterType = document.getElementById("filterType");
const financeChart = document.getElementById("financeChart");

// Format mata uang Rupiah
const rupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
}).format(number);
};

// Tanggal hari ini
const today = new Date().toLocaleDateString("en-CA");
dateInput.value = today;
dateInput.max = today;

// Mengambil data dari LocalStorage
function loadTransactions() {
    try {
        const saved = localStorage.getItem("fintrack_transactions");
        const data = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(data)) return [];

        return data.filter(item =>
            item &&
            Number.isSafeInteger(item.id) &&
            typeof item.description === "string" &&
            typeof item.amount === "number" &&
            Number.isSafeInteger(item.amount) &&
            item.amount > 0 &&
            ["income", "expense"].includes(item.type) &&
            typeof item.category === "string" &&
            typeof item.date === "string"
        );
    } catch (error) {
        console.error("Gagal membaca data:", error);
        return [];
    }
}

let transactions = loadTransactions();
// Simpan data
function saveTransactions() {
    try {
        localStorage.setItem(
            "fintrack_transactions",
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Data gagal disimpan. Periksa penyimpanan browser.");
        console.error(error);
    }
}

// Menambahkan transaksi
transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || !Number.isSafeInteger(amount) || amount <= 0) {
        alert("Masukkan nama dan jumlah transaksi yang valid!");
        return;
    }
  if (!date || date > today) {
        alert("Tanggal transaksi tidak valid!");
        return;
    }

    const transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    transactions.push(transaction);

    saveTransactions();
    updateDashboard();

    transactionForm.reset();
    dateInput.value = today;
});

totalBalance.textContent = rupiah(totals.balance);
    totalIncome.textContent = rupiah(totals.income);
    totalExpense.textContent = rupiah(totals.expense);

    renderTransactions();
    drawChart(totals);
}

// Menampilkan transaksi
function renderTransactions() {
    const filter = filterType.value;

    const filteredTransactions = transactions
        .filter(transaction =>
            filter === "all" || transaction.type === filter
        )
        .sort((a, b) => {
            return b.date.localeCompare(a.date) || b.id - a.id;
        });
  
const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(
            transaction.date + "T00:00:00"
        ).toLocaleDateString("id-ID");

        const amountCell = document.createElement("td");
        amountCell.textContent =
            (transaction.type === "income" ? "+ " : "- ") +
            rupiah(transaction.amount);

        amountCell.className = transaction.type === "income"
            ? "income-text"
            : "expense-text";
  const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Hapus";
        deleteButton.className = "delete-button";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);

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
// Menghapus transaksi
function deleteTransaction(id) {
    const confirmation = confirm(
        "Apakah kamu yakin ingin menghapus transaksi ini?"
    );

    if (!confirmation) return;

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    saveTransactions();
    updateDashboard();
}

// Filter transaksi
filterType.addEventListener("change", renderTransactions);
// =====================================
// GRAFIK KEUANGAN MENGGUNAKAN CANVAS
// =====================================

function drawChart(totals) {
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

    const values = [totals.income, totals.expense];
    const maxValue = Math.max(...values, 1);
  const chartTop = 25;
    const chartBottom = height - 45;
    const chartHeight = chartBottom - chartTop;

    // Garis grafik
    ctx.strokeStyle = "#e8edf5";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = chartTop + (chartHeight / 4) * i;

        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(width - 15, y);
        ctx.stroke();
    }

    // Bar grafik
    const barWidth = Math.min(65, width * 0.18);
    const positions = [
        width * 0.35,
        width * 0.68
    ];
  const colors = ["#16a875", "#e65365"];

    values.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = positions[index] - barWidth / 2;
        const y = chartBottom - barHeight;

        ctx.fillStyle = colors[index];

        ctx.beginPath();
        ctx.roundRect(
            x,
            y,
            barWidth,
            Math.max(barHeight, 2),
            [7, 7, 0, 0]
        );
        ctx.fill();

        // Label jumlah
        ctx.fillStyle = "#526079";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "center";

        const label = value >= 1000000
            ? (value / 1000000).toFixed(1) + " jt"
            : value >= 1000
                ? (value / 1000).toFixed(0) + " rb"
                : String(value);
      ctx.fillText(
            label,
            positions[index],
            Math.max(chartTop + 12, y - 9)
        );

        // Label kategori
        ctx.fillStyle = "#8290a8";
        ctx.font = "12px Inter, sans-serif";

        ctx.fillText(
            index === 0 ? "Pemasukan" : "Pengeluaran",
            positions[index],
            height - 15
        );
    });
}

// Menyesuaikan grafik ketika layar berubah
const resizeObserver = new ResizeObserver(() => {
    drawChart(calculateTotals());
});

resizeObserver.observe(
    document.querySelector(".chart-container")
);
// Navigasi sidebar
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function() {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});

// Menjalankan dashboard pertama kali
updateDashboard();
