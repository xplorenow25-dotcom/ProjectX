// --- MOBILE MENU LOGIC ---
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
}
document.getElementById('menu-toggle').addEventListener('click', toggleMenu);

// --- TAB SWITCHING LOGIC ---
const titles = { 
    'spot': 'Spot Calculator', 
    'futures': 'Futures Calculator', 
    'fees': 'Fee Calculator' 
};
const descs = {
    'spot': 'Estimate your profit, loss, and fees for any spot trade in real time.',
    'futures': 'Calculate exact margin, leverage risk, and approximate liquidation price.',
    'fees': 'Compute the exact cost of trading fees on any position size.'
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');

    document.getElementById('calc-title').textContent = titles[tabName];
    document.getElementById('calc-desc').textContent = descs[tabName];
}

// --- QUICK PRESETS (FEES) ---
function setFee(val) {
    document.getElementById('fee-pct').value = val;
    calcFees(); // Trigger recalculation
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CURRENCY LOGIC ---
    const currencySelect = document.getElementById('currency-selector');
    const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
    let currentSym = symbols[savedCurrency];
    
    if(currencySelect) currencySelect.value = savedCurrency;
    updateCurrency(savedCurrency);

    currencySelect.addEventListener('change', (e) => {
        localStorage.setItem('selectedCurrency', e.target.value);
        currentSym = symbols[e.target.value];
        updateCurrency(e.target.value);
        // Recalculate everything to update symbols in results
        calcSpot(); calcFut(); calcFees();
    });

    function updateCurrency(currency) {
        document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbols[currency]);
        document.querySelectorAll('.currency-label').forEach(el => el.textContent = currency);
    }

    // Helper: Format Money
    const formatMoney = (val) => `${currentSym}${Math.abs(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    // --- SPOT CALCULATOR ---
    const sInv = document.getElementById('spot-inv'), sBuy = document.getElementById('spot-buy');
    const sSell = document.getElementById('spot-sell'), sFee = document.getElementById('spot-fee');
    const sEmpty = document.getElementById('spot-empty'), sResults = document.getElementById('spot-results');

    function calcSpot() {
        const inv = parseFloat(sInv.value), buy = parseFloat(sBuy.value), sell = parseFloat(sSell.value), feePct = parseFloat(sFee.value) || 0;
        
        if (!inv || !buy || !sell) { 
            sEmpty.classList.remove('hidden'); sResults.classList.add('hidden'); return; 
        }

        sEmpty.classList.add('hidden'); sResults.classList.remove('hidden');

        const coins = inv / buy;
        const buyFee = inv * (feePct / 100);
        const grossValue = coins * sell;
        const sellFee = grossValue * (feePct / 100);
        const totalFees = buyFee + sellFee;
        
        const netProfit = grossValue - inv - totalFees;
        const roi = (netProfit / inv) * 100;

        const mainPnl = document.getElementById('spot-profit-main');
        const roiPill = document.getElementById('spot-roi-pill');

        mainPnl.textContent = (netProfit >= 0 ? '+' : '-') + formatMoney(netProfit);
        roiPill.textContent = `● ${(netProfit >= 0 ? '+' : '')}${roi.toFixed(2)}% ROI`;
        document.getElementById('spot-rev').textContent = formatMoney(grossValue);
        document.getElementById('spot-fees-paid').textContent = '-' + formatMoney(totalFees);

        if(netProfit < 0) {
            mainPnl.classList.add('negative'); roiPill.classList.add('negative');
        } else {
            mainPnl.classList.remove('negative'); roiPill.classList.remove('negative');
        }
    }
    [sInv, sBuy, sSell, sFee].forEach(inp => inp.addEventListener('input', calcSpot));

    // --- FUTURES CALCULATOR ---
    const fMar = document.getElementById('fut-margin'), fLev = document.getElementById('fut-lev');
    const fEnt = document.getElementById('fut-entry'), fExt = document.getElementById('fut-exit');
    const dirLong = document.getElementById('dir-long'), dirShort = document.getElementById('dir-short');
    const fEmpty = document.getElementById('fut-empty'), fResults = document.getElementById('fut-results');

    function calcFut() {
        const mar = parseFloat(fMar.value), lev = parseFloat(fLev.value), ent = parseFloat(fEnt.value), ext = parseFloat(fExt.value);
        const isLong = dirLong.checked;

        if(!mar || !lev || !ent || !ext) { 
            fEmpty.classList.remove('hidden'); fResults.classList.add('hidden'); return; 
        }

        fEmpty.classList.add('hidden'); fResults.classList.remove('hidden');

        const size = mar * lev;
        const qty = size / ent;
        
        let pnl = 0;
        let liqPrice = 0;

        if (isLong) {
            pnl = qty * (ext - ent);
            liqPrice = ent * (1 - (1/lev)); // Approximate
        } else {
            pnl = qty * (ent - ext);
            liqPrice = ent * (1 + (1/lev)); // Approximate
        }

        const roi = (pnl / mar) * 100;

        const mainPnl = document.getElementById('fut-profit-main');
        const roiPill = document.getElementById('fut-roi-pill');
        const dirDisp = document.getElementById('fut-dir-disp');

        mainPnl.textContent = (pnl >= 0 ? '+' : '-') + formatMoney(pnl);
        roiPill.textContent = `● ${(pnl >= 0 ? '+' : '')}${roi.toFixed(2)}% ROI on Margin`;
        document.getElementById('fut-size').textContent = formatMoney(size);
        document.getElementById('fut-lev-disp').textContent = `${lev.toFixed(2)}×`;
        document.getElementById('fut-liq').textContent = formatMoney(liqPrice);

        if(pnl < 0) {
            mainPnl.classList.add('negative'); roiPill.classList.add('negative');
        } else {
            mainPnl.classList.remove('negative'); roiPill.classList.remove('negative');
        }

        if(isLong) {
            dirDisp.textContent = "▲ Long"; dirDisp.className = "positive";
        } else {
            dirDisp.textContent = "▼ Short"; dirDisp.className = "negative";
        }
    }
    [fMar, fLev, fEnt, fExt, dirLong, dirShort].forEach(inp => inp.addEventListener('input', calcFut));

    // --- FEES CALCULATOR ---
    const feeSize = document.getElementById('fee-size'), feePctVal = document.getElementById('fee-pct');
    const feeEmpty = document.getElementById('fee-empty'), feeResults = document.getElementById('fee-results');

    window.calcFees = function() { // Made global for quick preset buttons
        const size = parseFloat(feeSize.value), pct = parseFloat(feePctVal.value);
        if(!size || !pct) { 
            feeEmpty.classList.remove('hidden'); feeResults.classList.add('hidden'); return; 
        }
        feeEmpty.classList.add('hidden'); feeResults.classList.remove('hidden');

        const total = size * (pct / 100);
        document.getElementById('fee-total-main').textContent = '-' + formatMoney(total);
    }
    [feeSize, feePctVal].forEach(inp => inp.addEventListener('input', calcFees));
});
