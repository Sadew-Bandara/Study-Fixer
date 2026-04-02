// 1. Theme Toggle Logic
const themeBtn = document.getElementById('theme-btn');

function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.innerHTML = isDark 
        ? '<span>☀️</span> Light Mode' 
        : '<span>🌙</span> Dark Mode';
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
}

// 3. Financial Tracker with Chart.js
let financeData = { income: 0, expenses: 0, savings: 0 };
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
    chart.update();
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

function updateFinance() {
    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);
    const type = document.getElementById('type').value;
    const currency = document.getElementById('currency').value;
    const subCategory = document.getElementById('sub-category').value;
    
    if (isNaN(amount) || !chart) return;
    
    financeData[type] += amount;
    chart.data.datasets[0].data = [financeData.income, financeData.expenses, financeData.savings];
    chart.update();

    // Add to transactions log
    const entry = {
        amount,
        type,
        currency,
        subCategory,
        date: new Date().toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    };
    transactions.push(entry);
    renderLog();
    
    amountInput.value = '';
}

function renderLog() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    transactions.slice().reverse().forEach(item => {
        const li = document.createElement('li');
        li.className = `history-item type-${item.type}`;
        li.innerHTML = `
            <span>${item.date}</span>
            <span><strong>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</strong> (${item.subCategory})</span>
            <span>${item.currency} ${item.amount.toFixed(2)}</span>
        `;
        list.appendChild(li);
    });
}

// 4. GPA Calculator & Prediction
function addSubjectRow() {
    const container = document.getElementById('subject-list');
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
        <input type="text" placeholder="Subject Name">
        <input type="number" class="credits" placeholder="Credits">
        <input type="number" class="marks" placeholder="Marks (0-100)">
    `;
    container.appendChild(row);
}

function calculateGPA() {
    const credits = document.querySelectorAll('.credits');
    const marks = document.querySelectorAll('.marks');
    
    let totalPoints = 0;
    let totalCredits = 0;

    credits.forEach((c, index) => {
        const credit = parseFloat(c.value);
        const mark = parseFloat(marks[index].value);
        
        if (!isNaN(credit) && !isNaN(mark)) {
            // Simple GPA Mapping (4.0 scale)
            let gradePoint = (mark / 100) * 4; 
            totalPoints += (gradePoint * credit);
            totalCredits += credit;
        }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    document.getElementById('current-gpa').innerText = gpa;

    // 7. Prediction Logic
    let prediction = "";
    if (gpa >= 3.7) prediction = "You are on track for a First Class!";
    else if (gpa >= 3.3) prediction = "You are on track for a Second Class (Upper).";
    else prediction = "Keep pushing to reach the next honors tier!";
    
    document.getElementById('prediction-msg').innerText = prediction;
}

// 5. Clock & Progress
function updateClock() {
    const now = new Date();
    document.getElementById('clock-display').innerText = now.toLocaleTimeString();
    
    // Mock progress calculation based on hour of day
    const progress = (now.getHours() / 24) * 100;
    document.getElementById('work-progress').value = progress;
}

// 6. Deadlines & Calendar
let events = [];
let currentCalendarDate = new Date();

function addEvent() {
    const nameInput = document.getElementById('event-name');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const typeInput = document.getElementById('event-type');

    if (!nameInput.value || !dateInput.value) return;

    events.push({
        name: nameInput.value,
        date: dateInput.value,
        time: timeInput.value,
        type: typeInput.value
    });

    renderEvents();
    renderCalendarGrid();
    nameInput.value = '';
    dateInput.value = '';
}

function addLecture() {
    const name = document.getElementById('lec-name').value;
    const date = document.getElementById('lec-date').value;
    const time = document.getElementById('lec-time').value;
    const type = document.getElementById('lec-type').value;

    if (!name || !date) return;

    events.push({ name, date, time, type });
    renderEvents();
    renderCalendarGrid();
    
    // Clear inputs
    document.getElementById('lec-name').value = '';
    document.getElementById('lec-date').value = '';
    document.getElementById('lec-time').value = '';
    showSection('calendar'); // Redirect to calendar to show the entry
}

function renderEvents() {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    events.forEach((event, index) => {
        const li = document.createElement('li');
        li.className = `event-item type-${event.type}`;
        li.innerHTML = `
            <div style="flex:1">
                <strong>${event.name}</strong><br>
                <small>${new Date(event.date).toLocaleDateString()} 
                ${event.time ? ' • ' + event.time : ''}</small>
            </div>
            <span class="event-badge">${event.type}</span>
            <button class="delete-btn" onclick="deleteEvent(${index})"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
        `;
        list.appendChild(li);
    });
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
        
        if (events.some(e => e.date === dateString)) {
            dayDiv.classList.add('has-event');
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
    renderEvents();
    renderCalendarGrid();
}

// Initialization
window.onload = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateThemeUI(savedTheme);
    updateSubCategories();
    initChart();
    renderCalendarGrid();
    lucide.createIcons();
    setInterval(updateClock, 1000);
};

// Notepad Save Mockup
function saveNote() {
    alert("Note saved for " + document.getElementById('unit-selector').value);
}