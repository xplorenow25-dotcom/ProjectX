// --- TAB SWITCHING ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.remove('fade-in'); 
    });
    
    const activeTab = document.getElementById('tab-' + tabName);
    activeTab.classList.add('active');
    
    // Retrigger animation
    setTimeout(() => activeTab.classList.add('fade-in'), 10);

    const titles = { 'spot': 'Spot Calculator', 'futures': 'Futures Calculator', 'fees': 'Fee Calculator' };
    document.getElementById('calc-title').textContent = titles[tabName];
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- MOBILE MENU TOGGLE ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    menuBtn.addEventListener('click', () => {
        drawer.classList.toggle('open');
        menuBtn.textContent = drawer.classList.contains('open') ? '✕' : '☰';
    });

    // --- CURRENCY LOGIC ---
    const currencySelect = document.getElementById('currency-selector');
    const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const savedCurrency = localStorage.getItem('selectedCurrency') || 'USD';
    
    if(currencySelect) currencySelect.value = savedCurrency;
    updateCurrency(savedCurrency);

    currencySelect.addEventListener('change', (e) => {
        localStorage.setItem('selectedCurrency', e.target.value);
        updateCurrency(e.target.value);
    });

    function updateCurrency(currency) {
        document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbols[currency]);
        document.querySelectorAll('.currency-label').forEach(el => el.textContent = currency);
    }

    // Helper: format numbers
    const fmt = (num) => isNaN(num) || !isFinite(num) ? "0.00" : Math.abs(num).toFixed(2);

    // --- SPOT CALCULATOR ---
    const sInv = document.getElementById('spot-inv'), sBuy = document.getElementById('spot-buy');
    const sSell = document.getElementById('spot-sell'), sFee = document.getElementById('spot-fee');
    const sProf = document.getElementById('spot-profit'), sRoi = document.getElementById('spot-roi');
    const sFeesPaid = document.getElementById('spot-fees-paid'), sMain = sProf.parentElement;

    function calcSpot() {
        const inv = parseFloat(sInv.value), buy = parseFloat(sBuy.value), sell = parseFloat(sSell.value), feePct = parseFloat(sFee.value) || 0;
        if (!inv || !buy || !sell) { 
            sProf.textContent = "0.00"; sRoi.textContent = "0.00"; sFeesPaid.textContent = "0.00"; sMain.classList.remove('loss'); return; 
        }

        const coins = inv / buy;
        const buyFee = inv * (feePct / 100);
        const grossValue = coins * sell;
        const sellFee = grossValue * (feePct / 100);
        
        const totalFees = buyFee + sellFee;
        const netProfit = grossValue - inv - totalFees;
        const roi = (netProfit / inv) * 100;

        sProf.textContent = fmt(netProfit);
        sRoi.textContent = fmt(roi);
        sFeesPaid.textContent = fmt(totalFees);

        if(netProfit < 0) { sMain.classList.add('loss'); sProf.textContent = "-" + sProf.textContent; } 
        else { sMain.classList.remove('loss'); sProf.textContent = "+" + sProf.textContent; }
    }
    [sInv, sBuy, sSell, sFee].forEach(inp => inp.addEventListener('input', calcSpot));

    // --- FUTURES CALCULATOR ---
    const fMar = document.getElementById('fut-margin'), fLev = document.getElementById('fut-lev');
    const fEnt = document.getElementById('fut-entry'), fExt = document.getElementById('fut-exit');
    const fFee = document.getElementById('fut-fee');
    const fProf = document.getElementById('fut-profit'), fRoi = document.getElementById('fut-roi');
    const fLiq = document.getElementById('fut-liq'), fSize = document.getElementById('fut-size'), fMain = fProf.parentElement;
    const fRadios = document.getElementsByName('position');

    function calcFut() {
        const isLong = document.getElementById('pos-long').checked;
        const mar = parseFloat(fMar.value), lev = parseFloat(fLev.value);
        const ent = parseFloat(fEnt.value), ext = parseFloat(fExt.value), feePct = parseFloat(fFee.value) || 0;
        
        if(!mar || !lev || !ent || !ext) { 
            fProf.textContent = "0.00"; fRoi.textContent = "0.00"; fLiq.textContent = "0.00"; fSize.textContent = "0.00"; fMain.classList.remove('loss'); return; 
        }

        const size = mar * lev; // Position Size in USD
        const qty = size / ent; // Number of contracts
        
        // Futures fees are calculated on the full position size
        const openFee = size * (feePct / 100);
        const closeValue = qty * ext;
        const closeFee = closeValue * (feePct / 100);
        const totalFees = openFee + closeFee;

        let pnl = 0;
        let liq = 0;

        if (isLong) {
            pnl = (ext - ent) * qty - totalFees;
            liq = ent * (1 - (1 / lev)); // Approximate standard liquidation
        } else {
            pnl = (ent - ext) * qty - totalFees;
            liq = ent * (1 + (1 / lev));
        }

        const roi = (pnl / mar) * 100;

        fProf.textContent = fmt(pnl);
        fRoi.textContent = fmt(roi);
        fLiq.textContent = fmt(liq);
        fSize.textContent = fmt(size);

        if(pnl < 0) { fMain.classList.add('loss'); fProf.textContent = "-" + fProf.textContent; }
        else { fMain.classList.remove('loss'); fProf.textContent = "+" + fProf.textContent; }
    }
    [fMar, fLev, fEnt, fExt, fFee].forEach(inp => inp.addEventListener('input', calcFut));
    fRadios.forEach(r => r.addEventListener('change', calcFut));

    // --- FEES CALCULATOR ---
    const feeSize = document.getElementById('fee-size'), feePctVal = document.getElementById('fee-pct');
    const feeTot = document.getElementById('fee-total'), feeAfter = document.getElementById('fee-after');

    function calcFees() {
        const size = parseFloat(feeSize.value), pct = parseFloat(feePctVal.value);
        if(!size || !pct) { feeTot.textContent = "0.00"; feeAfter.textContent = "0.00"; return; }
        
        const cost = size * (pct / 100);
        const net = size - cost;

        feeTot.textContent = fmt(cost);
        feeAfter.textContent = fmt(net);
    }
    [feeSize, feePctVal].forEach(inp => inp.addEventListener('input', calcFees));
}
