// ===== Navigation & Sidebar Logic =====
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const modeTitle = document.getElementById('modeTitle');
const navItems = document.querySelectorAll('.nav-links li[data-mode]');
const modeContainers = document.querySelectorAll('.mode-container');

menuBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('active'); });
closeBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// ===== Mode Switching Logic =====
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const mode = item.dataset.mode;
    
    // UI highlight
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    modeTitle.textContent = mode;
    
    // Hide all containers
    modeContainers.forEach(c => c.classList.remove('active-mode'));
    
    // Show requested mode
    if (['Standard', 'Scientific', 'Date'].includes(mode)) {
      document.getElementById(`mode-${mode}`).classList.add('active-mode');
    } 
    else if (['Length', 'Weight', 'Temperature', 'Energy', 'Area', 'Speed', 'Time', 'Volume'].includes(mode)) {
      document.getElementById('mode-Converter').classList.add('active-mode');
      setupConverter(mode);
    } 
    else {
      // Graphing, Programmer, Currency
      document.getElementById('mode-Other').classList.add('active-mode');
      document.getElementById('other-title').textContent = mode;
    }
    
    closeSidebar();
  });
});

// ==========================================
// 1. CALCULATOR LOGIC (Standard & Scientific)
// ==========================================
let calcState = {
  currentInput: '0',
  previousValue: null,
  operator: null,
  shouldResetDisplay: false,
  historyString: '',
  isScientific: false,
  waitingForPow: false
};

function getDisplayEls() {
  return calcState.isScientific 
    ? { main: document.getElementById('sci-display'), hist: document.getElementById('sci-history') }
    : { main: document.getElementById('std-display'), hist: document.getElementById('std-history') };
}

function updateDisplay() {
  const els = getDisplayEls();
  let displayStr = calcState.currentInput;
  
  if (displayStr === 'Error') {
    els.main.textContent = 'Error';
  } else {
    const num = parseFloat(displayStr);
    if (!isNaN(num) && displayStr.length > 3 && !displayStr.includes('.')) {
      els.main.textContent = Number(displayStr).toLocaleString('en-US');
    } else {
      els.main.textContent = displayStr;
    }
  }

  if (calcState.previousValue !== null && calcState.operator !== null) {
    let opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }[calcState.operator];
    els.hist.textContent = `${calcState.previousValue} ${opSymbol}`;
  } else {
    els.hist.textContent = calcState.historyString;
  }
}

function inputNumber(num) {
  if (calcState.shouldResetDisplay) {
    calcState.currentInput = num === '.' ? '0.' : num;
    calcState.shouldResetDisplay = false;
  } else {
    if (num === '.' && calcState.currentInput.includes('.')) return;
    if (calcState.currentInput === '0' && num !== '.') calcState.currentInput = num;
    else calcState.currentInput += num;
  }
  updateDisplay();
}

function chooseOperator(op) {
  if (calcState.operator !== null && !calcState.shouldResetDisplay) {
    calculate();
  }
  calcState.previousValue = parseFloat(calcState.currentInput);
  calcState.operator = op;
  calcState.shouldResetDisplay = true;
  calcState.historyString = '';
  updateDisplay();
}

function calculate() {
  if (calcState.operator === null || calcState.previousValue === null) return;

  const current = parseFloat(calcState.currentInput);
  let result;

  switch (calcState.operator) {
    case '+': result = calcState.previousValue + current; break;
    case '-': result = calcState.previousValue - current; break;
    case '*': result = calcState.previousValue * current; break;
    case '/':
      if (current === 0) { calcState.currentInput = 'Error'; resetCalcState(); return; }
      result = calcState.previousValue / current;
      break;
    case '^': result = Math.pow(calcState.previousValue, current); break;
  }

  result = Math.round(result * 1e12) / 1e12;
  let opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }[calcState.operator];
  calcState.historyString = `${calcState.previousValue} ${opSymbol} ${current} =`;

  calcState.currentInput = result.toString();
  calcState.previousValue = null;
  calcState.operator = null;
  calcState.shouldResetDisplay = true;
  updateDisplay();
}

function resetCalcState() {
  calcState.previousValue = null;
  calcState.operator = null;
  calcState.shouldResetDisplay = true;
  updateDisplay();
}

// Scientific functions
function handleScientific(fn) {
  calcState.isScientific = true; // Ensure targeting scientific UI
  const val = parseFloat(calcState.currentInput);
  
  switch(fn) {
    case 'sin': calcState.currentInput = Math.sin(val).toString(); break;
    case 'cos': calcState.currentInput = Math.cos(val).toString(); break;
    case 'tan': calcState.currentInput = Math.tan(val).toString(); break;
    case 'log': calcState.currentInput = Math.log10(val).toString(); break;
    case 'ln': calcState.currentInput = Math.log(val).toString(); break;
    case 'pi': calcState.currentInput = Math.PI.toString(); break;
    case 'sqrt': calcState.currentInput = Math.sqrt(val).toString(); break;
    case 'square': calcState.currentInput = (val * val).toString(); break;
    case 'pow': 
      calcState.previousValue = val;
      calcState.operator = '^';
      calcState.shouldResetDisplay = true;
      break;
  }
  calcState.shouldResetDisplay = true;
  updateDisplay();
}

// Action handler
function handleAction(action) {
  switch (action) {
    case 'clear':
      calcState.currentInput = '0';
      calcState.historyString = '';
      resetCalcState();
      break;
    case 'ce':
      calcState.currentInput = '0';
      calcState.shouldResetDisplay = false;
      updateDisplay();
      break;
    case 'delete':
      if (calcState.currentInput === 'Error' || calcState.currentInput.length === 1) calcState.currentInput = '0';
      else calcState.currentInput = calcState.currentInput.slice(0, -1);
      updateDisplay();
      break;
    case 'percent':
      calcState.currentInput = (parseFloat(calcState.currentInput) / 100).toString();
      calcState.shouldResetDisplay = true;
      updateDisplay();
      break;
    case 'reciprocal':
      const valRec = parseFloat(calcState.currentInput);
      if (valRec === 0) calcState.currentInput = 'Error';
      else calcState.currentInput = (1 / valRec).toString();
      calcState.shouldResetDisplay = true;
      updateDisplay();
      break;
    case 'square':
      calcState.currentInput = (parseFloat(calcState.currentInput) * parseFloat(calcState.currentInput)).toString();
      calcState.shouldResetDisplay = true;
      updateDisplay();
      break;
    case 'sqrt':
      const valSqrt = parseFloat(calcState.currentInput);
      if (valSqrt < 0) calcState.currentInput = 'Error';
      else calcState.currentInput = Math.sqrt(valSqrt).toString();
      calcState.shouldResetDisplay = true;
      updateDisplay();
      break;
    case 'negate':
      if (calcState.currentInput !== '0' && calcState.currentInput !== 'Error') {
        calcState.currentInput = calcState.currentInput.startsWith('-') 
          ? calcState.currentInput.substring(1) : '-' + calcState.currentInput;
        updateDisplay();
      }
      break;
    case 'equals':
      calculate();
      break;
  }
}

// Attach events to Standard & Scientific keypads
document.querySelectorAll('.key').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Detect if clicked inside Scientific mode
    calcState.isScientific = btn.closest('#mode-Scientific') !== null;

    if (btn.dataset.num) inputNumber(btn.dataset.num);
    else if (btn.dataset.op) chooseOperator(btn.dataset.op);
    else if (btn.dataset.action) handleAction(btn.dataset.action);
    else if (btn.dataset.sci) handleScientific(btn.dataset.sci);
  });
});

// Keyboard support (Standard only)
document.addEventListener('keydown', e => {
  if (!document.getElementById('mode-Standard').classList.contains('active-mode')) return;
  const key = e.key;
  if (/[0-9.]/.test(key)) inputNumber(key);
  else if (['+', '-', '*', '/'].includes(key)) chooseOperator(key);
  else if (key === 'Enter' || key === '=') { e.preventDefault(); calculate(); }
  else if (key === 'Backspace') handleAction('delete');
  else if (key === 'Escape') handleAction('clear');
});


// ==========================================
// 2. CONVERTER LOGIC
// ==========================================
const convData = {
  Length: { Meters: 1, Kilometers: 1000, Centimeters: 0.01, Miles: 1609.34, Inches: 0.0254, Feet: 0.3048 },
  Weight: { Kilograms: 1, Grams: 0.001, Pounds: 0.453592, Ounces: 0.0283495 },
  Temperature: { Celsius: 'C', Fahrenheit: 'F', Kelvin: 'K' },
  Energy: { Joules: 1, Kilojoules: 1000, Calories: 4.184 },
  Area: { "Sq Meters": 1, "Sq Kilometers": 1e6, "Sq Feet": 0.092903, Acres: 4046.86 },
  Speed: { "m/s": 1, "km/h": 0.277778, "mph": 0.44704 },
  Time: { Seconds: 1, Minutes: 60, Hours: 3600, Days: 86400 },
  Volume: { Liters: 1, Milliliters: 0.001, Gallons: 3.78541 }
};

function setupConverter(mode) {
  const fromSelect = document.getElementById('conv-from');
  const toSelect = document.getElementById('conv-to');
  const input = document.getElementById('conv-input');
  const output = document.getElementById('conv-output');

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  const units = Object.keys(convData[mode]);
  units.forEach(unit => {
    fromSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
    toSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
  });

  // Default to different units
  if(units.length > 1) toSelect.selectedIndex = 1;

  const convert = () => {
    const val = parseFloat(input.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;
    let result = 0;

    if (mode === 'Temperature') {
      // Special Temp Logic
      let celsius = val;
      if (from === 'Fahrenheit') celsius = (val - 32) * 5/9;
      if (from === 'Kelvin') celsius = val - 273.15;

      if (to === 'Celsius') result = celsius;
      else if (to === 'Fahrenheit') result = (celsius * 9/5) + 32;
      else if (to === 'Kelvin') result = celsius + 273.15;
    } else {
      // Standard ratio logic
      const baseVal = val * convData[mode][from];
      result = baseVal / convData[mode][to];
    }

    output.value = parseFloat(result.toFixed(6)); // clean decimals
  };

  input.addEventListener('input', convert);
  fromSelect.addEventListener('change', convert);
  toSelect.addEventListener('change', convert);
  
  convert(); // Initial calculate
}


// ==========================================
// 3. DATE CALCULATION LOGIC
// ==========================================
document.getElementById('calc-date-btn').addEventListener('click', () => {
  const fromDate = new Date(document.getElementById('date-from').value);
  const toDate = new Date(document.getElementById('date-to').value);
  const resultEl = document.getElementById('date-result');

  if (isNaN(fromDate) || isNaN(toDate)) {
    resultEl.textContent = "Please select both dates!";
    return;
  }

  const diffTime = Math.abs(toDate - fromDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  resultEl.textContent = `${diffDays} Days`;
});

// Init
updateDisplay();