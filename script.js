// 1. Theme Toggle Logic
const themeBtn = document.getElementById('theme-btn');

function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.innerHTML = isDark 
        ? '<i data-lucide="sun"></i> Light Mode' 
        : '<i data-lucide="moon"></i> Dark Mode';
    lucide.createIcons();
}

themeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
    updateThemeUI(targetTheme);
    localStorage.setItem('theme', targetTheme);
});

// 2. Section Navigation
function showSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    targetSection.style.display = 'block';
    
    // Scroll to top of content area on section change (important for mobile)
    const contentArea = document.querySelector('.content');
    if (contentArea) contentArea.scrollTop = 0;
}

// 3. Financial Tracker with Chart.js
let transactions = [];
let chart;

const subCategories = {
    income: ['Salary', 'Business', 'Freelance', 'Gift', 'Investment', 'Other'],
    expenses: ['Food', 'Rent/EMI', 'Transport', 'Utilities', 'Medical', 'Entertainment', 'Shopping', 'Education', 'Other'],
    savings: ['Emergency Fund', 'Goal', 'Retirement', 'Other']
};

function updateSubCategories() {
    const type = document.getElementById('type').value;
    const subCatSelect = document.getElementById('sub-category');
    if (!subCatSelect) return;
    
    subCatSelect.innerHTML = '';
    subCategories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        subCatSelect.appendChild(option);
    });
}

function updateChartLabel() {
    if (!chart) return;
    const currency = document.getElementById('currency').value;
    chart.data.datasets[0].label = `${currency} Amount`;
    updateChartData();
}

function initChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');
    const currency = document.getElementById('currency').value;
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses', 'Savings'],
            datasets: [{
                label: `${currency} Amount`,
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f43f5e', '#0ea5e9']
            }]
        },
        options: { responsive: true }
    });
}

function addFinanceEntry() {
    const amountInput = document.getElementById('amount');
    const accountSelect = document.getElementById('transaction-account');
    const amount = parseFloat(amountInput.value);
    const type = document.getElementById('type').value;
    const currency = document.getElementById('currency').value;
    const subCategory = document.getElementById('sub-category').value;
    const accountIndex = accountSelect.value;
    const transactionDate = new Date(); // Capture current date for transaction
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    if (accountIndex === "") {
        alert('Please select an account for this transaction.');
        return;
    }

    // Update Account Balance
    const account = accounts[accountIndex];
    if (type === 'income') {
        account.balance += amount;
    } else {
        account.balance -= amount;
    }
    saveAccounts();
    renderAccounts();
    
    // Add to transactions log
    const entry = {
        amount,
        type,
        currency,
        subCategory,
        accountName: account.name,
        accountIndex: parseInt(accountIndex),
        date: transactionDate.toISOString().split('T')[0], // Store as YYYY-MM-DD for easier parsing
        displayDate: transactionDate.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    };
    transactions.push(entry);
    saveTransactions();
    calculateFinanceOverview();
    updateChartData();
    renderSavingGoals();
    renderLog(); // Re-render log after adding
    
    amountInput.value = '';
    accountSelect.value = '';
}

function deleteTransaction(index) {
    const item = transactions[index];
    if (!item) return;

    // Robust reversal: Find account by name since indices shift when accounts are deleted
    const account = accounts.find(acc => acc.name === item.accountName);
    if (account) {
        if (item.type === 'income') {
            account.balance -= Number(item.amount);
        } else {
            account.balance += Number(item.amount);
        }
        saveAccounts();
        renderAccounts();
    }

    // Remove from array FIRST
    transactions.splice(index, 1);
    
    // Save and Refresh all UI components
    saveTransactions();
    calculateFinanceOverview();
    if (typeof renderSavingGoals === 'function') renderSavingGoals();
    updateChartData(); 
    renderLog();
}

function renderLog() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    transactions.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `history-item type-${item.type}`;
        li.innerHTML = `
            <div style="flex:1">
                <span>${item.displayDate}</span><br>
                <small style="opacity:0.7"><strong>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</strong> (${item.subCategory})</small>
            </div>
            <div style="text-align:right">
                <div style="display:flex; align-items:center; gap:10px; justify-content: flex-end;">
                    <span>${item.currency} ${item.amount.toFixed(2)}</span>
                    <button class="delete-btn" onclick="deleteTransaction(${index})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
                </div>
                <small style="opacity:0.6; font-size: 0.75rem;">via ${item.accountName || 'Unknown'}</small>
            </div>
        `;
        list.prepend(li);
    });
    lucide.createIcons();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

function calculateFinanceOverview() {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavings = 0;
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(item => {
        const itemDate = new Date(item.date); // Use the stored YYYY-MM-DD date
        const amt = Number(item.amount) || 0;
        if (item.type === 'income') {
            totalIncome += amt;
            if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
                currentMonthIncome += amt;
            }
        } else if (item.type === 'expenses') {
            totalExpenses += amt;
            if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
                currentMonthExpenses += amt;
            }
        } else if (item.type === 'savings') {
            totalSavings += amt;
        }
    });

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    document.getElementById('total-balance').innerText = totalBalance.toFixed(2);
    document.getElementById('monthly-income').innerText = currentMonthIncome.toFixed(2);
    document.getElementById('monthly-expenses').innerText = currentMonthExpenses.toFixed(2); // Renamed from upcoming-expenses

    // Update Overview Goal Card with total progress
    const totalGoalTarget = savingGoals.reduce((sum, g) => sum + g.target, 0);
    const bar = document.getElementById('saving-goals-bar');
    const val = document.getElementById('saving-goals-val');

    if (totalGoalTarget > 0) {
        const progress = Math.min((totalSavings / totalGoalTarget) * 100, 100);
        if (bar) bar.style.width = `${progress}%`;
        if (val) val.innerText = `${progress.toFixed(0)}% Achieved`;
    } else {
        if (bar) bar.style.width = `0%`;
        if (val) val.innerText = "No active goals";
    }
}

function updateChartData() {
    if (!chart) return;

    let inc = 0, exp = 0, sav = 0;
    transactions.forEach(t => {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') inc += amt;
        else if (t.type === 'expenses') exp += amt;
        else if (t.type === 'savings') sav += amt;
    });

    const currency = document.getElementById('currency').value;

    // Combine Finance Totals and Account Balances into the same chart
    chart.data.labels = ['Income', 'Expenses', 'Savings', ...accounts.map(acc => acc.name)];
    chart.data.datasets[0].data = [inc, exp, sav, ...accounts.map(acc => acc.balance)];
    chart.data.datasets[0].backgroundColor = [
        '#10b981', '#f43f5e', '#0ea5e9', 
        ...accounts.map(() => '#6366f1')
    ];
    chart.data.datasets[0].label = `${currency} Value`;
    chart.update();
}

// 3.1 Accounts Management
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

function addAccount() {
    const nameInput = document.getElementById('acc-name');
    const typeInput = document.getElementById('acc-type');
    const balanceInput = document.getElementById('acc-balance');

    if (!nameInput.value || isNaN(parseFloat(balanceInput.value))) {
        alert('Please enter a valid name and balance.');
        return;
    }

    accounts.push({
        name: nameInput.value,
        type: typeInput.value,
        balance: parseFloat(balanceInput.value)
    });

    saveAccounts();
    renderAccounts();
    calculateFinanceOverview();
    nameInput.value = '';
    balanceInput.value = '';
}

function renderAccounts() {
    const container = document.getElementById('accounts-list');
    if (!container) return;
    container.innerHTML = '';

    accounts.forEach((acc, index) => {
        const card = document.createElement('div');
        card.className = 'overview-card';
        card.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                <i data-lucide="${acc.type === 'Bank' ? 'landmark' : 'credit-card'}" style="color: ${acc.type === 'Bank' ? '#0ea5e9' : '#ec4899'}"></i>
                <button class="delete-btn" onclick="deleteAccount(${index})"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
            <h4 style="margin-top:10px">${acc.name}</h4>
            <p>Rs. ${acc.balance.toFixed(2)}</p>
            <small style="opacity:0.7">${acc.type}</small>
        `;
        container.appendChild(card);
    });
    populateAccountDropdown();
    updateChartData();
    lucide.createIcons();
}

function populateAccountDropdown() {
    const select = document.getElementById('transaction-account');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Account</option>';
    accounts.forEach((acc, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = acc.name;
        select.appendChild(option);
    });
    select.value = currentValue;
}

function deleteAccount(index) {
    accounts.splice(index, 1);
    saveAccounts();
    renderAccounts();
    calculateFinanceOverview();
}

function saveAccounts() {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

// 3.2 Saving Goals Management
let savingGoals = JSON.parse(localStorage.getItem('savingGoals')) || [];

function addSavingGoal() {
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');

    if (!nameInput.value || isNaN(parseFloat(targetInput.value))) {
        alert('Please enter a goal name and target amount.');
        return;
    }

    savingGoals.push({
        name: nameInput.value,
        target: parseFloat(targetInput.value)
    });

    saveSavingGoals();
    renderSavingGoals();
    calculateFinanceOverview(); // Update the overview card text
    nameInput.value = '';
    targetInput.value = '';
}

function renderSavingGoals() {
    const container = document.getElementById('goals-list');
    if (!container) return;
    container.innerHTML = '';

    // Calculate total actual savings made through transactions
    let remainingSavings = transactions
        .filter(t => t.type === 'savings')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Distribute actual savings across goals sequentially
    savingGoals.forEach((goal, index) => {
        const achievedAmount = Math.min(goal.target, remainingSavings);
        remainingSavings -= achievedAmount;
        const progress = (achievedAmount / goal.target) * 100;

        const card = document.createElement('div');
        card.className = 'overview-card';
        card.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h4 style="margin:0">${goal.name}</h4>
                <div style="display:flex; gap: 5px;">
                    <button class="add-money-btn" onclick="goToAddSavings()" title="Add Money">
                        <i data-lucide="plus-circle" style="width:18px;height:18px; color:#10b981"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteSavingGoal(${index})">
                        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                </div>
            </div>
            <div class="goal-progress-container">
                <div class="goal-progress-bar" style="width: ${progress}%"></div>
            </div>
            <p style="font-size: 1rem;">Rs. ${achievedAmount.toFixed(2)} / ${goal.target.toFixed(2)}</p>
            <small>${progress.toFixed(1)}% complete</small>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

function deleteSavingGoal(index) {
    savingGoals.splice(index, 1);
    saveSavingGoals();
    renderSavingGoals();
    calculateFinanceOverview();
}

function saveSavingGoals() {
    localStorage.setItem('savingGoals', JSON.stringify(savingGoals));
}

function showFinanceSubSection(sectionId) {
    document.querySelectorAll('.finance-sub-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById('finance-' + sectionId).style.display = 'block';

    document.querySelectorAll('.finance-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.finance-tab-btn[onclick="showFinanceSubSection('${sectionId}')"]`).classList.add('active');

    // Ensure chart updates if switching to summary
    if (sectionId === 'summary') {
        updateChartData();
    }
}

function goToAddSavings() {
    showFinanceSubSection('add');
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.value = 'savings';
        updateSubCategories();
        document.getElementById('sub-category').value = 'Goal';
    }
}

// 4. GPA Calculator & Prediction
function addSubjectRow() {
    const container = document.getElementById('subject-list');
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
        <input type="text" placeholder="Subject Name">
        <input type="number" class="credits" placeholder="Credits" oninput="calculateGPA()">
        <select class="grade" onchange="calculateGPA()">
            <option value="4.0">A+</option>
            <option value="4.0">A</option>
            <option value="3.7">A-</option>
            <option value="3.3">B+</option>
            <option value="3.0">B</option>
            <option value="2.7">B-</option>
            <option value="2.3">C+</option>
            <option value="2.0">C</option>
            <option value="1.7">C-</option>
            <option value="1.3">D+</option>
            <option value="1.0">D</option>
            <option value="0.0">F</option>
        </select>
        <button class="delete-btn" onclick="this.parentElement.remove(); calculateGPA();">
            <i data-lucide="trash-2" style="width:14px;height:14px"></i>
        </button>
    `;
    container.appendChild(row);
    lucide.createIcons();
}

function calculateGPA() {
    const credits = document.querySelectorAll('.credits');
    const grades = document.querySelectorAll('.grade');
    
    let totalPoints = 0;
    let totalCredits = 0;

    credits.forEach((c, index) => {
        const credit = parseFloat(c.value);
        const gradePoint = parseFloat(grades[index].value);
        
        if (!isNaN(credit) && !isNaN(gradePoint)) {
            totalPoints += (gradePoint * credit);
            totalCredits += credit;
        }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    document.getElementById('current-gpa').innerText = gpa;

    // Update Dashboard GPA Progress
    const dashGpaBar = document.getElementById('gpa-progress-bar');
    const dashGpaVal = document.getElementById('dash-gpa-val');
    if (dashGpaBar) dashGpaBar.style.width = `${(gpa / 4) * 100}%`;
    if (dashGpaVal) dashGpaVal.innerText = gpa;

    // 7. Prediction Logic
    let prediction = "";
    if (gpa >= 3.7) prediction = "You are on track for a First Class!";
    else if (gpa >= 3.3) prediction = "You are on track for a Second Class (Upper).";
    else prediction = "Keep pushing to reach the next honors tier!";
    
    document.getElementById('prediction-msg').innerText = prediction;
}

// 6. Work Schedule Logic
let currentScheduleDate = new Date().toISOString().split('T')[0];
let scheduleData = [];

function getScheduleKey(date) {
    return `workSchedule_${date}`;
}

function loadScheduleForDate(date) {
    currentScheduleDate = date;
    const saved = localStorage.getItem(getScheduleKey(date));
    scheduleData = saved ? JSON.parse(saved) : Array.from({length: 48}, () => ({ name: '', done: false, merged: false }));
    
    const dateInput = document.getElementById('schedule-date');
    if (dateInput) dateInput.value = date;
}

function changeScheduleDate(date) {
    loadScheduleForDate(date);
    renderSchedule();
}

function renderSchedule() {
    const container = document.getElementById('schedule-grid');
    if (!container) return;
    container.innerHTML = '';

    scheduleData.forEach((item, i) => {
        const hour = Math.floor(i / 2);
        const min = i % 2 === 0 ? '00' : '30';
        const timeStr = `${String(hour).padStart(2, '0')}:${min}`;

        const isMerged = item.merged && i > 0;
        const nextIsMerged = scheduleData[i + 1] && scheduleData[i + 1].merged;

        const div = document.createElement('div');
        div.className = `schedule-item ${isMerged ? 'merged-item' : ''} ${nextIsMerged ? 'has-merged-next' : ''}`;
        
        div.innerHTML = `
            <span class="schedule-time">${timeStr}</span>
            ${!isMerged ? 
                `<input type="text" class="schedule-input" value="${item.name}" 
                    placeholder="Set task..." onchange="updateSchedule(${i}, 'name', this.value)" 
                    style="flex:1; border:none; background:transparent; color:var(--text-color);">` : 
                `<div style="flex:1; opacity:0.5; font-style:italic; font-size:0.8rem;">(Continued)</div>`
            }
            <div style="display:flex; align-items:center; gap:10px;">
                ${i > 0 ? `
                <button onclick="toggleMerge(${i})" title="Toggle Merge" style="background:none; border:none; cursor:pointer; padding:2px;">
                    <i data-lucide="${isMerged ? 'link-2-off' : 'link-2'}" style="width:16px; height:16px; color:#f59e0b"></i>
                </button>` : ''}
                <input type="checkbox" ${item.done ? 'checked' : ''} 
                    onchange="updateSchedule(${i}, 'done', this.checked)"
                    style="width:20px; height:20px; cursor:pointer;">
            </div>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
    updateWorkProgress();
}

function updateSchedule(index, field, value) {
    // Find the root of the merged group
    let rootIndex = index;
    while (rootIndex > 0 && scheduleData[rootIndex].merged) {
        rootIndex--;
    }

    // Update all items in the group
    scheduleData[rootIndex][field] = value;
    for (let i = rootIndex + 1; i < scheduleData.length && scheduleData[i].merged; i++) {
        scheduleData[i][field] = value;
    }

    localStorage.setItem(getScheduleKey(currentScheduleDate), JSON.stringify(scheduleData));
    renderSchedule();
}

function toggleMerge(index) {
    scheduleData[index].merged = !scheduleData[index].merged;
    if (scheduleData[index].merged) {
        scheduleData[index].name = scheduleData[index - 1].name;
        scheduleData[index].done = scheduleData[index - 1].done;
    }
    localStorage.setItem(getScheduleKey(currentScheduleDate), JSON.stringify(scheduleData));
    renderSchedule();
}

function updateWorkProgress() {
    const total = scheduleData.length;
    const done = scheduleData.filter(item => item.done).length;
    const progress = (done / total) * 100;
    
    const progressBar = document.getElementById('work-progress-bar');
    if (progressBar) progressBar.style.width = `${progress}%`;
}

function clearSchedule() {
    if (confirm("Reset all schedule tasks and ticks?")) {
        scheduleData = Array.from({length: 48}, () => ({ name: '', done: false, merged: false }));
        localStorage.setItem(getScheduleKey(currentScheduleDate), JSON.stringify(scheduleData));
        renderSchedule();
    }
}

// 6. Deadlines & Calendar
let events = JSON.parse(localStorage.getItem('events')) || [];
let currentCalendarDate = new Date();

function addEvent() {
    const nameInput = document.getElementById('event-name');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const typeInput = document.getElementById('event-type');
    const deadlineInput = document.getElementById('event-deadline');
    const deadlineTimeInput = document.getElementById('event-deadline-time');

    if (!nameInput.value || !dateInput.value) return;
    
    events.push({
        name: nameInput.value,
        date: dateInput.value,
        time: timeInput.value,
        type: typeInput.value,
        deadline: deadlineInput.value,
        deadlineTime: deadlineTimeInput.value
    });

    saveEvents();
    renderEvents();
    renderCalendarGrid();
    updateDashboardCounters();
    nameInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    deadlineInput.value = '';
    deadlineTimeInput.value = '';
}

function renderEvents() {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    events.forEach((event, index) => {
        const li = document.createElement('li');
        li.className = `event-item type-${event.type}`;
        
        // Format Date: YYYY-MM-DD to MM/DD/YYYY
        const [year, month, day] = event.date.split('-');
        const formattedDate = `${month}/${day}/${year}`;

        // Format Time: HH:mm to hh:mm AM/PM
        let formattedTime = '';
        if (event.time) {
            let [hours, minutes] = event.time.split(':');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            formattedTime = ` • ${hours}:${minutes} ${ampm}`;
        }

        let deadlineHtml = '';
        if (event.deadline) {
            const [dYear, dMonth, dDay] = event.deadline.split('-');
            let formattedDeadlineTime = '';
            if (event.deadlineTime) {
                let [dHours, dMinutes] = event.deadlineTime.split(':');
                const dAmpm = dHours >= 12 ? 'PM' : 'AM';
                dHours = dHours % 12 || 12;
                formattedDeadlineTime = ` at ${dHours}:${dMinutes} ${dAmpm}`;
            }
            deadlineHtml = `<br><small style="color: #ef4444; font-weight: 600;">Deadline: ${dMonth}/${dDay}/${dYear}${formattedDeadlineTime}</small>`;
        }

        li.innerHTML = `
            <div style="flex:1">
                <strong>${event.name}</strong>${deadlineHtml}<br>
                <small>${formattedDate}${formattedTime}</small>
            </div>
            <span class="event-badge">${event.type}</span>
            <button class="delete-btn" onclick="deleteEvent(${index})"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
        `;
        list.appendChild(li);
    });
    lucide.createIcons();
}

function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
}

function updateDashboardCounters() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const grid = document.getElementById('month-summary-grid');
    if (!grid) return;

    const monthEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const deadlineDate = e.deadline ? new Date(e.deadline) : null;
        return (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) ||
               (deadlineDate && deadlineDate.getMonth() === currentMonth && deadlineDate.getFullYear() === currentYear);
    });

    const counts = {
        assignment: monthEvents.filter(e => e.type === 'assignment').length,
        lecture: monthEvents.filter(e => e.type === 'lecture').length,
        exam: monthEvents.filter(e => e.type === 'exam').length,
        deadline: monthEvents.filter(e => e.type === 'deadline' || (e.deadline && e.deadline.trim() !== "")).length
    };

    const summaryCards = [
        { type: 'Assignment', count: counts.assignment, icon: 'clipboard-list', color: '#3b82f6' },
        { type: 'Lecture', count: counts.lecture, icon: 'presentation', color: '#10b981' },
        { type: 'Exam', count: counts.exam, icon: 'graduation-cap', color: '#ef4444' },
        { type: 'Deadline', count: counts.deadline, icon: 'clock', color: '#f59e0b' }
    ];

    grid.innerHTML = summaryCards.map(card => `
        <div class="overview-card">
            <i data-lucide="${card.icon}" style="color: ${card.color}; margin-bottom: 10px;"></i>
            <h4 style="color: ${card.color}; margin: 5px 0;">${card.type}s</h4>
            <p style="font-size: 1.5rem;">${card.count}</p>
            <small>This Month</small>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    if (!grid) return;

    grid.innerHTML = '';
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    monthYearLabel.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarDate);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Padding days for previous month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        grid.appendChild(emptyDiv);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerText = day;

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayEvents = events.filter(e => e.date === dateString || e.deadline === dateString);
        
        if (dayEvents.some(e => e.type === 'exam')) {
            dayDiv.classList.add('has-exam');
        } else if (dayEvents.some(e => e.deadline === dateString || e.type === 'deadline')) {
            dayDiv.classList.add('has-deadline');
        } else if (dayEvents.some(e => e.type === 'assignment')) {
            dayDiv.classList.add('has-assignment');
        } else if (dayEvents.some(e => e.type === 'lecture')) {
            dayDiv.classList.add('has-lecture');
        }

        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        grid.appendChild(dayDiv);
    }
}

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendarGrid();
}

function deleteEvent(index) {
    events.splice(index, 1);
    saveEvents();
    renderEvents();
    renderCalendarGrid();
    updateDashboardCounters();
}

// 7. Module Notes Section
let moduleNotes = JSON.parse(localStorage.getItem('moduleNotes')) || [];

async function addModuleNote() {
    const nameInput = document.getElementById('module-note-name');
    const linkInput = document.getElementById('module-note-link');
    const fileInput = document.getElementById('module-file-upload');
    const typeInput = document.getElementById('module-note-type');

    let finalLink = linkInput.value;
    let isLocalFile = false;

    // Handle File Upload if present
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 2 * 1024 * 1024) { // 2MB limit check for localStorage safety
            alert("File is too large for local storage (Max 2MB). Please use a URL link instead.");
            return;
        }
        
        finalLink = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        isLocalFile = true;
        if (!nameInput.value) nameInput.value = file.name;
    }

    if (!nameInput.value || !finalLink) {
        alert('Please provide a name and either a link or a file.');
        return;
    }

    moduleNotes.push({
        name: nameInput.value,
        link: finalLink,
        type: typeInput.value,
        isLocalFile: isLocalFile,
        dateAdded: new Date().toLocaleDateString()
    });

    saveModuleNotes();
    renderModuleNotes();
    nameInput.value = '';
    linkInput.value = '';
    fileInput.value = '';
}

function renderModuleNotes() {
    const list = document.getElementById('module-notes-list');
    list.innerHTML = '';

    moduleNotes.forEach((note, index) => {
        const li = document.createElement('li');
        li.className = `event-item type-${note.type}`; // Reusing event-item styling for consistency
        const linkText = note.isLocalFile ? "View/Download Stored File" : note.link;
        
        li.innerHTML = `
            <div style="flex:1">
                <strong>${note.name}</strong><br>
                <small><a href="${note.link}" ${note.isLocalFile ? 'download="'+note.name+'"' : 'target="_blank"'} rel="noopener noreferrer">
                    ${linkText}
                </a></small>
            </div>
            <span class="event-badge">${note.type}</span>
            <button class="delete-btn" onclick="deleteModuleNote(${index})"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
        `;
        list.appendChild(li);
    });
    lucide.createIcons();
}

function deleteModuleNote(index) {
    moduleNotes.splice(index, 1);
    saveModuleNotes();
    renderModuleNotes();
}

function saveModuleNotes() {
    localStorage.setItem('moduleNotes', JSON.stringify(moduleNotes));
}

// 8. Notepad Persistence
const noteArea = document.getElementById('note-area');
const unitSelector = document.getElementById('unit-selector');

function saveNote() {
    const unit = unitSelector.value;
    const text = noteArea.value;
    localStorage.setItem(`note_${unit}`, text);
    alert("Note saved successfully for " + unit.toUpperCase());
}

function loadNote() {
    const unit = unitSelector.value;
    const savedNote = localStorage.getItem(`note_${unit}`) || '';
    noteArea.value = savedNote;
}

// Initialization
window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateThemeUI(savedTheme);
    updateSubCategories();
    loadTransactions(); // Load transactions before initializing finance section
    initChart();
    calculateFinanceOverview();
    updateChartData();
    renderLog(); // Render log after loading transactions
    renderAccounts();
    renderSavingGoals();
    showFinanceSubSection('overview'); // Show overview by default
    loadScheduleForDate(new Date().toISOString().split('T')[0]);
    renderSchedule();
    renderCalendarGrid();
    renderEvents();
    updateDashboardCounters();
    renderModuleNotes();
    loadNote(); // Load the initial unit's note
    lucide.createIcons();
};

// 9. Curriculum Modules Logic
let curriculumData = JSON.parse(localStorage.getItem('curriculumData')) || {
    1: [
        { sem: 1, code: 'IS 1201', title: 'Programming and Problem Solving', credits: '2L+1P' },
        { sem: 1, code: 'IS 1202', title: 'Computer Systems', credits: '2L' },
        { sem: 1, code: 'IS 1203', title: 'Foundations of Information Systems', credits: '2L' },
        { sem: 1, code: 'IS 1204', title: 'Fundamentals of Software Engineering', credits: '2L' },
        { sem: 1, code: 'IS 1205', title: 'Introduction to Management', credits: '2L' },
        { sem: 1, code: 'IS 1206', title: 'Mathematics for Computing', credits: '2L' },
        { sem: 1, code: 'IS 1207', title: 'Internet and Web Technologies', credits: '2L+1P' },
        { sem: 1, code: 'EN 1201', title: 'Communication Skills', credits: '1P', nonGpa: true },
        { sem: 1, code: 'EN 1202', title: 'Application Laboratory', credits: '1P', nonGpa: true },
        { sem: 2, code: 'IS 1208', title: 'Systems Analysis and Design', credits: '2L' },
        { sem: 2, code: 'IS 1209', title: 'Information Technology Project Management', credits: '2L' },
        { sem: 2, code: 'IS 1210', title: 'Database Systems', credits: '2L+1P' },
        { sem: 2, code: 'IS 1211', title: 'Computer Networks', credits: '2L+1P' },
        { sem: 2, code: 'IS 1212', title: 'Probability and Statistics', credits: '2L+1P' },
        { sem: 2, code: 'IS 1213', title: 'Organizational Behavior', credits: '2L' },
        { sem: 2, code: 'IS 1214', title: 'Data Structures and Algorithms', credits: '2L+1P' },
        { sem: 2, code: 'EN 1203', title: 'Aesthetic Studies', credits: '1P', nonGpa: true }
    ],
    2: [
        { sem: 1, code: 'IS 2201', title: 'Group Project', credits: '4P' },
        { sem: 1, code: 'IS 2202', title: 'Advanced Data Structures and Algorithms', credits: '2L' },
        { sem: 1, code: 'IS 2203', title: 'Object Oriented Programming', credits: '2L+1P' },
        { sem: 1, code: 'IS 2204', title: 'Information Systems Security', credits: '2L' },
        { sem: 1, code: 'IS 2205', title: 'Mobile Application Design and Development', credits: '2L+1P' },
        { sem: 1, code: 'IS 2206', title: 'Business Process Management', credits: '2L+1P' },
        { sem: 1, code: 'IS 2207', title: 'Electronics and Physical Computing', credits: '2L+1P' },
        { sem: 2, code: 'IS 2208', title: 'Information Systems Management and Strategy', credits: '2L' },
        { sem: 2, code: 'IS 2209', title: 'Data Management and Governance', credits: '3L+1P' },
        { sem: 2, code: 'IS 2210', title: 'Applied Data Science', credits: '2L+1P' },
        { sem: 2, code: 'IS 2211', title: 'UI/UX Design', credits: '2L+1P' },
        { sem: 2, code: 'IS 2212', title: 'Cloud Infrastructure and Applications', credits: '2L' },
        { sem: 2, code: 'EN 2201', title: 'Entrepreneurship', credits: '2L', nonGpa: true }
    ],
    3: [
        { sem: 1, code: 'IS 3201', title: 'Industry Project', credits: '4P' },
        { sem: 1, code: 'IS 3202', title: 'Research Methods', credits: '2L' },
        { sem: 1, code: 'IS 3203', title: 'Cybercrime, Privacy, and Legislation', credits: '2L' },
        { sem: 1, code: 'IS 3204', title: 'Enterprise Resource Planning Systems', credits: '2L' },
        { sem: 1, code: 'IS 3205', title: 'Data Visualization', credits: '2L+1P' },
        { sem: 2, code: 'IS 3213', title: 'Literature Survey', credits: '2P' },
        { sem: 2, code: 'IS 3214', title: 'Professional Practice and Behavior', credits: '1P' },
        { sem: 2, code: 'EN 3201', title: 'Industrial Placement', credits: '8P', nonGpa: true }
    ],
    4: [
        { sem: 1, code: 'IS 4201', title: 'Final Year Project', credits: '8P' },
        { sem: 1, code: 'IS 4202', title: 'Research Seminar', credits: '2P' },
        { sem: 1, code: 'IS 4203', title: 'Data Analytics', credits: '2L+1P' },
        { sem: 2, code: 'IS 4209', title: 'Business Intelligence Systems', credits: '2L' },
        { sem: 2, code: 'IS 4210', title: 'Philosophy of Science', credits: '1L' }
    ]
};

let completedModules = JSON.parse(localStorage.getItem('completedModules')) || [];

function renderCurriculum(year, btn) {
    const container = document.getElementById('modules-container');
    if (btn) {
        document.querySelectorAll('#curriculum-modules .finance-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    container.innerHTML = '';
    const yearData = curriculumData[year];

    [1, 2].forEach(semester => {
        const semTitle = document.createElement('h3');
        semTitle.innerText = `Semester ${semester}`;
        semTitle.style.marginTop = '20px';
        container.appendChild(semTitle);

        yearData.filter(m => m.sem === semester).forEach(module => {
            const isDone = completedModules.includes(module.code);
            const div = document.createElement('div');
            div.className = `module-card ${isDone ? 'completed' : ''}`;
            div.innerHTML = `
                <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleModule('${module.code}')" style="width:20px; height:20px;">
                <div style="flex: 1; padding-right: 80px;">
                    <strong style="display:block;">${module.code}: ${module.title}</strong>
                    <small>${module.credits} Credits ${module.nonGpa ? '<span class="event-badge">Non-GPA</span>' : ''}</small>
                </div>
                <div class="module-actions">
                    <button class="edit-btn" onclick="editModule(${year}, '${module.code}')" title="Edit">
                        <i data-lucide="edit" style="width:14px;height:14px"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteModule(${year}, '${module.code}')" title="Delete">
                        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    });
    lucide.createIcons();
}

function toggleModule(code) {
    if (completedModules.includes(code)) {
        completedModules = completedModules.filter(c => c !== code);
    } else {
        completedModules.push(code);
    }
    localStorage.setItem('completedModules', JSON.stringify(completedModules));
    // Refresh current view
    const activeBtn = document.querySelector('#curriculum-modules .finance-tab-btn.active');
    const year = activeBtn ? parseInt(activeBtn.innerText.replace('Year ', '')) : 1;
    renderCurriculum(year);
}

function saveCurriculum() {
    localStorage.setItem('curriculumData', JSON.stringify(curriculumData));
}

function saveModule() {
    const activeBtn = document.querySelector('#curriculum-modules .finance-tab-btn.active');
    const year = activeBtn ? parseInt(activeBtn.innerText.replace('Year ', '')) : 1;
    
    const code = document.getElementById('mod-code').value;
    const title = document.getElementById('mod-title').value;
    const credits = document.getElementById('mod-credits').value;
    const sem = parseInt(document.getElementById('mod-semester').value);
    const nonGpa = document.getElementById('mod-nongpa').checked;
    const editCode = document.getElementById('edit-module-code').value;

    if (!code || !title) {
        alert('Please enter Code and Title');
        return;
    }

    const modObj = { sem, code, title, credits, nonGpa };

    if (editCode) {
        const idx = curriculumData[year].findIndex(m => m.code === editCode);
        if (idx !== -1) curriculumData[year][idx] = modObj;
    } else {
        curriculumData[year].push(modObj);
    }

    saveCurriculum();
    renderCurriculum(year);
    resetModuleForm();
}

function editModule(year, code) {
    const mod = curriculumData[year].find(m => m.code === code);
    if (!mod) return;

    document.getElementById('mod-code').value = mod.code;
    document.getElementById('mod-title').value = mod.title;
    document.getElementById('mod-credits').value = mod.credits;
    document.getElementById('mod-semester').value = mod.sem;
    document.getElementById('mod-nongpa').checked = !!mod.nonGpa;
    document.getElementById('edit-module-code').value = mod.code;

    document.getElementById('save-mod-btn').innerText = 'Update Module';
    document.getElementById('cancel-mod-btn').style.display = 'inline-block';
}

function deleteModule(year, code) {
    if (!confirm('Are you sure you want to delete this module?')) return;
    curriculumData[year] = curriculumData[year].filter(m => m.code !== code);
    saveCurriculum();
    renderCurriculum(year);
}

function resetModuleForm() {
    document.getElementById('mod-code').value = '';
    document.getElementById('mod-title').value = '';
    document.getElementById('mod-credits').value = '';
    document.getElementById('mod-nongpa').checked = false;
    document.getElementById('edit-module-code').value = '';
    document.getElementById('save-mod-btn').innerText = 'Add Module';
    document.getElementById('cancel-mod-btn').style.display = 'none';
}