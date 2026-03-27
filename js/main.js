// --- TAB & MENU LOGIC ---
function switchTab(tabName) {
    // Capsule buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Tab content
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');

    // Update Global Title
    const titles = { 'spot': 'Spot Calculator', 'futures': 'Futures Calculator', 'fees': 'Fee Calculator' };
    document.getElementById('calc-title').textContent = titles[tabName];
}

// Global helper to close menu from HTML onclick
function closeMenu() {
    document.getElementById('side-drawer').classList.remove('active');
    document.getElementById('menu-overlay').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- SIDE DRAWER LOGIC ---
    const menuBtn = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('menu-close');
    const sideDrawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('menu-overlay');
    
    if (menuBtn && sideDrawer && overlay) {
        menuBtn.addEventListener('click', () => {
            sideDrawer.classList.add('active');
            overlay.classList.add('active');
        });
        
        closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
    }

    // --- PREMIUM COOKIE CONSENT LOGIC ---
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner && !localStorage.getItem('cookieConsent')) {
        // Waits 1.5 seconds after page loads, then smoothly slides up!
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1500); 
    }

    document.getElementById('accept-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieBanner.classList.remove('show'); // Slides down
        setTimeout(() => cookieBanner.style.display = 'none', 600); // Removes from code after slide
    });

    document.getElementById('reject-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'rejected');
        cookieBanner.classList.remove('show'); // Slides down
        setTimeout(() => cookieBanner.style.display = 'none', 600);
    });

    // --- CURRENCY LOGIC ---
    const currencySelect = document.getElementById('currency-selector');
    const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const savedCur = localStorage.getItem('selectedCurrency') || 'USD';
    
    if(currencySelect) currencySelect.value = savedCur;
    updateCurrency(savedCur);

    currencySelect?.addEventListener('change', (e) => {
        localStorage.setItem('selectedCurrency', e.target.value);
        updateCurrency(e.target.value);
    });

    function updateCurrency(currency) {
        document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbols[currency]);
        document.querySelectorAll('.currency-label').forEach(el => el.textContent = currency);
    }

    // Utility Function to get Input Values safely
    const getVal = id => parseFloat(document.getElementById(id).value) || 0;
    const format = num => Math.abs(num).toFixed(2);

    // Number Formatter Helper
    const formatCur = (num) => '$' + Math.abs(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const formatNum = (num) => Math.abs(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // --- 1. SPOT CALCULATOR LOGIC ---
    function calcSpot() {
        const inv = getVal('spot-inv'), buy = getVal('spot-buy'), sell = getVal('spot-sell'), feePct = getVal('spot-fee');
        const empty = document.getElementById('spot-empty'), filled = document.getElementById('spot-filled');

        if (!inv || !buy || !sell) { empty.style.display = 'block'; filled.style.display = 'none'; return; }
        
        empty.style.display = 'none'; filled.style.display = 'block';

        const coins = inv / buy;
        const grossVal = coins * sell;
        const totalFees = (inv * (feePct / 100)) + (grossVal * (feePct / 100));
        const netProfit = grossVal - inv - totalFees;
        const roi = (netProfit / inv) * 100;

        const pnlEl = document.getElementById('spot-profit');
        const roiEl = document.getElementById('spot-roi-pill');
        
        pnlEl.textContent = (netProfit >= 0 ? '+' : '-') + formatCur(netProfit);
        pnlEl.className = 'pnl-value ' + (netProfit >= 0 ? 'color-profit' : 'color-loss');
        
        roiEl.textContent = `● ${(netProfit >= 0 ? '+' : '')}${roi.toFixed(2)}% ROI`;
        roiEl.className = 'roi-pill ' + (netProfit >= 0 ? 'roi-green' : 'roi-red');

        document.getElementById('spot-inv-disp').textContent = formatCur(inv);
        document.getElementById('spot-buy-disp').textContent = formatCur(buy);
        document.getElementById('spot-sell-disp').textContent = formatCur(sell);
        document.getElementById('spot-fees-disp').textContent = '-' + formatCur(totalFees);
    }['spot-inv', 'spot-buy', 'spot-sell', 'spot-fee'].forEach(id => document.getElementById(id)?.addEventListener('input', calcSpot));

    // --- 2. FUTURES CALCULATOR LOGIC ---
    function calcFut() {
        const isLong = document.getElementById('pos-long').checked;
        const mar = getVal('fut-margin'), lev = getVal('fut-lev'), ent = getVal('fut-entry'), ext = getVal('fut-exit'), feePct = getVal('fut-fee');
        const empty = document.getElementById('fut-empty'), filled = document.getElementById('fut-filled');

        if(!mar || !lev || !ent || !ext) { empty.style.display = 'block'; filled.style.display = 'none'; return; }
        
        empty.style.display = 'none'; filled.style.display = 'block';

        const size = mar * lev; 
        const qty = size / ent; 
        const feeCost = size * (feePct / 100) * 2; 
        
        let pnl = 0, liq = 0;
        if (isLong) {
            pnl = (qty * (ext - ent)) - feeCost;
            liq = ent - (ent / lev); 
        } else {
            pnl = (qty * (ent - ext)) - feeCost;
            liq = ent + (ent / lev); 
        }
        const roi = (pnl / mar) * 100;

        const pnlEl = document.getElementById('fut-profit');
        const roiEl = document.getElementById('fut-roi-pill');
        const dirEl = document.getElementById('fut-dir-disp');

        pnlEl.textContent = (pnl >= 0 ? '+' : '-') + formatCur(pnl);
        pnlEl.className = 'pnl-value ' + (pnl >= 0 ? 'color-profit' : 'color-loss');
        
        roiEl.textContent = `● ${(pnl >= 0 ? '+' : '')}${roi.toFixed(2)}% ROI on Margin`;
        roiEl.className = 'roi-pill ' + (pnl >= 0 ? 'roi-green' : 'roi-red');

        document.getElementById('fut-size-disp').textContent = formatCur(size);
        document.getElementById('fut-lev-disp').textContent = formatNum(lev) + '×';
        
        dirEl.textContent = isLong ? '▲ Long' : '▼ Short';
        dirEl.className = isLong ? 'color-profit' : 'color-loss';

        document.getElementById('fut-fees-disp').textContent = '-' + formatCur(feeCost);
        document.getElementById('fut-liq-disp').textContent = liq > 0 ? formatCur(liq) : "0.00";
    }['fut-margin', 'fut-lev', 'fut-entry', 'fut-exit', 'fut-fee', 'pos-long', 'pos-short'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calcFut);
        if(id === 'pos-long' || id === 'pos-short') document.getElementById(id)?.addEventListener('change', calcFut);
    });

    // --- 3. FEES CALCULATOR LOGIC ---
    function calcFees() {
        const size = getVal('fee-size'), pct = getVal('fee-pct');
        const empty = document.getElementById('fee-empty'), filled = document.getElementById('fee-filled');

        if(!size || !pct) { empty.style.display = 'block'; filled.style.display = 'none'; return; }
        
        empty.style.display = 'none'; filled.style.display = 'block';
        
        const feeCost = size * (pct / 100);
        const amountAfter = size - feeCost;

        document.getElementById('fee-total').textContent = '-' + formatCur(feeCost);
        document.getElementById('fee-orig-disp').textContent = formatCur(size);
        document.getElementById('fee-after-disp').textContent = formatCur(amountAfter);
    }['fee-size', 'fee-pct'].forEach(id => document.getElementById(id)?.addEventListener('input', calcFees));
// 🔥 Crypto Ticker with Color Change

const coins = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "ripple", symbol: "XRP" },
  { id: "binancecoin", symbol: "BNB" },
  { id: "solana", symbol: "SOL" }
];

async function loadTicker() {
  const container = document.getElementById("cryptoPrices");
  if (!container) return;

  try {
    const ids = coins.map(c => c.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    let items = "";

    coins.forEach(c => {
  const price = data[c.id]?.usd;

  if (price !== undefined) {
    items += `
      <div class="ticker-item">
        <span class="coin">${c.symbol}</span>
        <span class="price">$${price.toLocaleString()}</span>
      </div>
    `;
  }
});
    container.innerHTML = items + items;

  } catch (err) {
    console.error("Ticker error:", err);
  }
}

// Run
loadTicker();
setInterval(loadTicker, 60000);
// ==========================================
    // --- PRO LIVE TICKER & AUTO-UPDATE LOGIC --
    // ==========================================
    async function fetchCryptoPrices() {
        try {
            // Fetch live prices
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,binancecoin,solana&vs_currencies=usd');
            if (!response.ok) throw new Error('API busy');
            const data = await response.json();

            // Format numbers beautifully
            const formatPrice = (price) => {
                if (price < 2) return '$' + price.toFixed(4);
                return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            // Create a dictionary of the new prices
            const updates = {
                'price-btc': data.bitcoin.usd,
                'price-eth': data.ethereum.usd,
                'price-xrp': data.ripple.usd,
                'price-bnb': data.binancecoin.usd,
                'price-sol': data.solana.usd
            };

            // This clever loop updates ALL cloned boxes in the infinite scroll instantly!
            for (const [id, price] of Object.entries(updates)) {
                const elements = document.querySelectorAll(`[id="${id}"]`);
                elements.forEach(el => el.textContent = formatPrice(price));
            }

        } catch (error) {
            console.log("CoinGecko API resting. Keeping last known prices on screen.");
            // We DO NOT change the text to "Unavailable" anymore. It just stays as the last price.
        }
    }

    // 1. Run the fetch immediately when the page loads
    fetchCryptoPrices().then(() => {
        // 2. Clone the track for the infinite loop ONLY ONCE after the first load
        const track = document.getElementById('crypto-ticker-track');
        if(track && !track.dataset.cloned) {
            const content = track.innerHTML;
            track.innerHTML = content + content; 
            track.dataset.cloned = "true"; // Marks it so it never clones twice
        }
    });

    // 3. AUTO-UPDATE: Fetch fresh prices entirely in the background every 60 seconds!
    setInterval(fetchCryptoPrices, 60000);
