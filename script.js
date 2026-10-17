/* ==========================================================================
   ESTADO DA APLICAÇÃO & PERSISTÊNCIA (LOCALSTORAGE + FIRESTORE COMPATIBLE)
   ========================================================================== */

let currentType = 'expense';
let transactions = [];
let categoryChartInstance = null;

const motivationalQuotes = [
    "Cuide do seu futuro com o mesmo carinho que cuida de você! ✨",
    "Independência financeira é o acessório mais elegante que você pode usar. 💅",
    "Poderosa é quem domina suas próprias finanças! 👑",
    "Seus sonhos merecem um orçamento bem planejado. 🌸",
    "Pequenas economias de hoje constroem o império de amanhã! 💎",
    "Gastar com sabedoria é investir na sua própria liberdade. ✨"
];

// Evento Inicial
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('input-date').valueAsDate = new Date();
    loadTransactions();
    rotateMotivationalQuote();
    updateUI();
});

/* ==========================================================================
   PERSISTÊNCIA E LÓGICA DE DADOS
   ========================================================================== */

function loadTransactions() {
    const saved = localStorage.getItem('glowfinance_transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao carregar dados do LocalStorage", e);
            transactions = [];
        }
    } else {
        // Dados demonstrativos padrão
        transactions = [
            { id: '1', type: 'income', amount: 3500, description: 'Salário Principal', date: new Date().toISOString().split('T')[0], category: 'Entrada' },
            { id: '2', type: 'expense', amount: 150, description: 'Skin Care & Perfume', date: new Date().toISOString().split('T')[0], category: 'Saúde/Autocuidado' },
            { id: '3', type: 'expense', amount: 89.90, description: 'Jantar com as Amigas', date: new Date().toISOString().split('T')[0], category: 'Comida/Alimentação' }
        ];
        saveTransactions();
    }
}

function saveTransactions() {
    localStorage.setItem('glowfinance_transactions', JSON.stringify(transactions));
}

function setTransactionType(type) {
    currentType = type;
    const expenseBtn = document.getElementById('type-expense-btn');
    const incomeBtn = document.getElementById('type-income-btn');
    const categoryContainer = document.getElementById('category-container');

    if (type === 'expense') {
        expenseBtn.className = "py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-brand-primary shadow-sm flex items-center justify-center gap-2";
        incomeBtn.className = "py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-500 hover:text-gray-800 flex items-center justify-center gap-2";
        categoryContainer.style.display = 'block';
    } else {
        incomeBtn.className = "py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-emerald-600 shadow-sm flex items-center justify-center gap-2";
        expenseBtn.className = "py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 text-gray-500 hover:text-gray-800 flex items-center justify-center gap-2";
        categoryContainer.style.display = 'none';
    }
}

function handleFormSubmit(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('input-amount').value);
    const description = document.getElementById('input-description').value.trim();
    const date = document.getElementById('input-date').value;
    const category = currentType === 'expense' ? document.getElementById('input-category').value : 'Rendimentos/Entrada';

    if (!amount || amount <= 0 || !description || !date) {
        showToast("Por favor, preencha todos os campos!");
        return;
    }

    const newTransaction = {
        id: Date.now().toString(),
        type: currentType,
        amount: amount,
        description: description,
        date: date,
        category: category
    };

    transactions.unshift(newTransaction);
    saveTransactions();
    updateUI();

    document.getElementById('transaction-form').reset();
    document.getElementById('input-date').valueAsDate = new Date();
    
    showToast("Transação adicionada com sucesso! ✨");
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
    showToast("Item removido do histórico.");
}

/* ==========================================================================
   RENDERIZAÇÃO DA INTERFACE
   ========================================================================== */

function updateUI() {
    renderSummaryCards();
    renderTransactions();
    renderChart();
}

function renderSummaryCards() {
    const totalIncomes = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncomes - totalExpenses;

    document.getElementById('total-incomes').textContent = formatCurrency(totalIncomes);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('total-balance').textContent = formatCurrency(balance);

    const balanceStatus = document.getElementById('balance-status');
    if (balance >= 0) {
        balanceStatus.innerHTML = `<i class="fa-solid fa-sparkles"></i> Balanço positivo! Parabéns! 🎉`;
    } else {
        balanceStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Cuidado, despesas superiores ao saldo!`;
    }
}

function renderTransactions() {
    const listElement = document.getElementById('transaction-list');
    const searchKeyword = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;

    listElement.innerHTML = '';

    const filtered = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchKeyword) || t.category.toLowerCase().includes(searchKeyword);
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
        listElement.innerHTML = `
            <li class="text-center py-8 text-gray-400 text-sm">
                <i class="fa-solid fa-heart-crack text-2xl mb-2 text-rose-200"></i>
                <p>Nenhuma transação encontrada.</p>
            </li>
        `;
        return;
    }

    filtered.forEach(item => {
        const isIncome = item.type === 'income';
        const badgeColor = getCategoryBadgeColor(item.category, isIncome);
        const icon = getCategoryIcon(item.category, isIncome);

        const li = document.createElement('li');
        li.className = "flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/30 hover:bg-rose-50/70 transition-colors border border-rose-100/50";
        
        li.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-brand-primary'} flex items-center justify-center text-sm">
                    <i class="${icon}"></i>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-800">${escapeHtml(item.description)}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}">
                            ${item.category}
                        </span>
                        <span class="text-[11px] text-gray-400">${formatDate(item.date)}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
                    ${isIncome ? '+' : '-'} ${formatCurrency(item.amount)}
                </span>
                <button onclick="deleteTransaction('${item.id}')" title="Excluir" class="text-gray-300 hover:text-rose-500 transition-colors p-1">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>
        `;

        listElement.appendChild(li);
    });
}

function renderChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const noDataEl = document.getElementById('no-chart-data');

    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length === 0) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        noDataEl.classList.remove('hidden');
        return;
    } else {
        noDataEl.classList.add('hidden');
    }

    const categoriesMap = {};
    expenses.forEach(e => {
        categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(categoriesMap);
    const dataValues = Object.values(categoriesMap);

    const colorPalette = [
        '#EC407A', '#F48FB1', '#D81B60', '#E5A9A9',
        '#AB47BC', '#FF7043', '#8E24AA', '#FF4081'
    ];

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colorPalette.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#FFFFFF',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw || 0;
                            return ` ${context.label}: R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            },
            cutout: '68%'
        }
    });
}

/* ==========================================================================
   FUNÇÕES UTILITÁRIAS
   ========================================================================== */

function rotateMotivationalQuote() {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    document.getElementById('motivation-text').textContent = randomQuote;
    document.getElementById('motivation-text-mobile').textContent = randomQuote;
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function getCategoryIcon(category, isIncome) {
    if (isIncome) return 'fa-solid fa-coins';
    switch (category) {
        case 'Comida/Alimentação': return 'fa-solid fa-utensils';
        case 'Roupas/Moda': return 'fa-solid fa-shirt';
        case 'Maquiagem/Beleza': return 'fa-solid fa-wand-magic-sparkles';
        case 'Moradia/Contas': return 'fa-solid fa-house-heart';
        case 'Transporte': return 'fa-solid fa-car';
        case 'Lazer': return 'fa-solid fa-champagne-glasses';
        case 'Saúde/Autocuidado': return 'fa-solid fa-spa';
        default: return 'fa-solid fa-bag-shopping';
    }
}

function getCategoryBadgeColor(category, isIncome) {
    if (isIncome) return 'bg-emerald-100 text-emerald-700';
    switch (category) {
        case 'Maquiagem/Beleza': return 'bg-pink-100 text-pink-700';
        case 'Roupas/Moda': return 'bg-purple-100 text-purple-700';
        case 'Comida/Alimentação': return 'bg-amber-100 text-amber-700';
        case 'Lazer': return 'bg-rose-100 text-rose-700';
        case 'Saúde/Autocuidado': return 'bg-teal-100 text-teal-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}