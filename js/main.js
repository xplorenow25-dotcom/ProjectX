// ==========================================
// --- 1. TAB & MENU SWITCHING LOGIC ---
// ==========================================
// Added "preventReset" so shared links don't get wiped!
function switchTab(tabName, preventReset = false) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(event && event.target && event.target.classList) event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.classList.add('active');

    const titles = { 'spot': 'Spot Calculator', 'futures': 'Futures Calculator', 'fees': 'Fee Calculator' };
    const titleEl = document.getElementById('calc-title');
    if (titleEl && titles[tabName]) titleEl.textContent = titles[tabName];

    if (!preventReset) {
        document.querySelectorAll('.app-layout input[type="number"]').forEach(input => {
            input.value = ''; 
            input.dispatchEvent(new Event('input')); 
        });
        const btnLong = document.getElementById('btn-long');
        if (btnLong && !btnLong.classList.contains('active')) btnLong.click();
    }
}

function closeMenu() {
    document.getElementById('side-drawer')?.classList.remove('active');
    document.getElementById('menu-overlay')?.classList.remove('active');
}

// ==========================================
// --- WAIT FOR PAGE TO LOAD ---
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 2. MOBILE MENU ---
    const menuBtn = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('menu-close');
    const sideDrawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('menu-overlay');
    
    if (menuBtn && sideDrawer && overlay) {
        menuBtn.addEventListener('click', () => { sideDrawer.classList.add('active'); overlay.classList.add('active'); });
        closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
    }

    // --- 3. PREMIUM COOKIE BANNER ---
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner && !localStorage.getItem('cookieConsent')) {
        setTimeout(() => { cookieBanner.classList.add('show'); }, 1500); 
    }
    document.getElementById('accept-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieBanner.classList.remove('show');
        setTimeout(() => cookieBanner.style.display = 'none', 600);
    });
    document.getElementById('reject-cookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'rejected');
        cookieBanner.classList.remove('show');
        setTimeout(() => cookieBanner.style.display = 'none', 600);
    });

    // --- 4. CURRENCY DROPDOWN ---
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
        document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbols[currency] || '$');
        document.querySelectorAll('.currency-label').forEach(el => el.textContent = currency);
    }

    // --- 5. CALCULATOR UTILITIES ---
    const getVal = id => parseFloat(document.getElementById(id)?.value) || 0;
    const formatCur = num => Math.abs(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // --- 6. SPOT CALCULATOR ---
    function calcSpot() {
        const inv = getVal('spot-inv'), buy = getVal('spot-buy'), sell = getVal('spot-sell'), feePct = getVal('spot-fee');
        const empty = document.getElementById('spot-empty'), filled = document.getElementById('spot-filled');

        if (!inv || !buy || !sell) { empty?.classList.remove('hidden'); filled?.classList.add('hidden'); return; }
        empty?.classList.add('hidden'); filled?.classList.remove('hidden');

        const coins = inv / buy;
        const grossVal = coins * sell;
        const totalFees = (inv * (feePct / 100)) + (grossVal * (feePct / 100));
        const netProfit = grossVal - inv - totalFees;
        const roi = (netProfit / inv) * 100;

        if(document.getElementById('spot-pnl')) document.getElementById('spot-pnl').textContent = formatCur(netProfit);
        if(document.getElementById('spot-roi')) document.getElementById('spot-roi').textContent = formatCur(roi);
        if(document.getElementById('spot-coins')) document.getElementById('spot-coins').textContent = formatCur(coins);
        if(document.getElementById('spot-gross')) document.getElementById('spot-gross').textContent = formatCur(grossVal);
        if(document.getElementById('spot-total-fees')) document.getElementById('spot-total-fees').textContent = formatCur(totalFees);

        const valColor = document.getElementById('spot-pnl-val');
        const pillColor = document.getElementById('spot-roi-pill');
        if(netProfit < 0) { 
            if(valColor) valColor.className = "pnl-value loss"; 
            if(pillColor) pillColor.className = "roi-pill loss";
            if(document.getElementById('spot-pnl-sign')) document.getElementById('spot-pnl-sign').textContent = "-"; 
            if(document.getElementById('spot-roi-sign')) document.getElementById('spot-roi-sign').textContent = "-";
        } else { 
            if(valColor) valColor.className = "pnl-value profit"; 
            if(pillColor) pillColor.className = "roi-pill profit";
            if(document.getElementById('spot-pnl-sign')) document.getElementById('spot-pnl-sign').textContent = "+"; 
            if(document.getElementById('spot-roi-sign')) document.getElementById('spot-roi-sign').textContent = "+";
        }
    }['spot-inv', 'spot-buy', 'spot-sell', 'spot-fee'].forEach(id => document.getElementById(id)?.addEventListener('input', calcSpot));

    // --- 7. FUTURES CALCULATOR ---
    let isLong = true;
    document.getElementById('btn-long')?.addEventListener('click', (e) => { isLong = true; e.target.classList.add('active'); document.getElementById('btn-short')?.classList.remove('active'); calcFut(); });
    document.getElementById('btn-short')?.addEventListener('click', (e) => { isLong = false; e.target.classList.add('active'); document.getElementById('btn-long')?.classList.remove('active'); calcFut(); });

    function calcFut() {
        const ent = getVal('fut-entry'), ext = getVal('fut-exit'), lev = getVal('fut-lev'), mar = getVal('fut-margin'), feePct = getVal('fut-fee');
        const empty = document.getElementById('fut-empty'), filled = document.getElementById('fut-filled');

        if(!ent || !ext || !lev || !mar) { empty?.classList.remove('hidden'); filled?.classList.add('hidden'); return; }
        empty?.classList.add('hidden'); filled?.classList.remove('hidden');

        const size = mar * lev; 
        const qty = size / ent; 
        const extSize = qty * ext;
        const totalFees = (size * (feePct / 100)) + (extSize * (feePct / 100)); 
        
        let pnl = 0, liq = 0;
        const dirDisp = document.getElementById('fut-disp-dir');
        if (isLong) {
            pnl = (extSize - size) - totalFees;
            liq = ent - (ent / lev); 
            if(dirDisp) { dirDisp.innerHTML = "▲ Long"; dirDisp.style.color = "var(--accent)"; }
        } else {
            pnl = (size - extSize) - totalFees;
            liq = ent + (ent / lev); 
            if(dirDisp) { dirDisp.innerHTML = "▼ Short"; dirDisp.style.color = "var(--accent-loss)"; }
        }
        const roi = (pnl / mar) * 100;

        if(document.getElementById('fut-pnl')) document.getElementById('fut-pnl').textContent = formatCur(pnl);
        if(document.getElementById('fut-roi')) document.getElementById('fut-roi').textContent = formatCur(roi);
        if(document.getElementById('fut-size')) document.getElementById('fut-size').textContent = formatCur(size);
        if(document.getElementById('fut-disp-lev')) document.getElementById('fut-disp-lev').textContent = formatCur(lev);
        if(document.getElementById('fut-fees-total')) document.getElementById('fut-fees-total').textContent = formatCur(totalFees);
        if(document.getElementById('fut-liq')) document.getElementById('fut-liq').textContent = liq > 0 ? formatCur(liq) : "0.00";

        const valColor = document.getElementById('fut-pnl-val');
        const pillColor = document.getElementById('fut-roi-pill');
        if(pnl < 0) { 
            if(valColor) valColor.className = "pnl-value loss"; 
            if(pillColor) pillColor.className = "roi-pill loss";
            if(document.getElementById('fut-pnl-sign')) document.getElementById('fut-pnl-sign').textContent = "-"; 
            if(document.getElementById('fut-roi-sign')) document.getElementById('fut-roi-sign').textContent = "-";
        } else { 
            if(valColor) valColor.className = "pnl-value profit"; 
            if(pillColor) pillColor.className = "roi-pill profit";
            if(document.getElementById('fut-pnl-sign')) document.getElementById('fut-pnl-sign').textContent = "+"; 
            if(document.getElementById('fut-roi-sign')) document.getElementById('fut-roi-sign').textContent = "+";
        }
    }['fut-entry', 'fut-exit', 'fut-lev', 'fut-margin', 'fut-fee'].forEach(id => document.getElementById(id)?.addEventListener('input', calcFut));

    // --- 8. FEES CALCULATOR ---
    function calcFees() {
        const size = getVal('fee-size'), pct = getVal('fee-pct');
        const empty = document.getElementById('fee-empty'), filled = document.getElementById('fee-filled');

        if(!size || !pct) { empty?.classList.remove('hidden'); filled?.classList.add('hidden'); return; }
        empty?.classList.add('hidden'); filled?.classList.remove('hidden');
        
        const feeCost = size * (pct / 100);
        const amountAfter = size - feeCost;

        if(document.getElementById('fee-total')) document.getElementById('fee-total').textContent = formatCur(feeCost);
        if(document.getElementById('fee-after')) document.getElementById('fee-after').textContent = formatCur(amountAfter);
    }
    ['fee-size', 'fee-pct'].forEach(id => document.getElementById(id)?.addEventListener('input', calcFees));

    // ==========================================
    // --- 9. NATIVE SHARING LOGIC ---
    // ==========================================
    window.shareResult = async function(tool) {
        let text = '';
        let params = new URLSearchParams();
        params.append('tool', tool);

        if (tool === 'spot') {['spot-inv', 'spot-buy', 'spot-sell', 'spot-fee'].forEach(id => params.append(id, getVal(id)));
            let pnl = document.getElementById('spot-pnl-val')?.textContent || '';
            text = `Check out this Spot trade! Estimated PnL: ${pnl} 🚀`;
        } else if (tool === 'futures') {['fut-entry', 'fut-exit', 'fut-lev', 'fut-margin', 'fut-fee'].forEach(id => params.append(id, getVal(id)));
            params.append('isLong', isLong);
            let pnl = document.getElementById('fut-pnl-val')?.textContent || '';
            text = `Check out this Futures trade! Estimated PnL: ${pnl} 🚀`;
        } else if (tool === 'fees') {
            ['fee-size', 'fee-pct'].forEach(id => params.append(id, getVal(id)));
            text = `Calculated my exchange fees on CryptoMetricPro!`;
        }

        // Creates a special link containing the numbers
        let shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();

        if (navigator.share) {
            try { await navigator.share({ title: 'CryptoMetricPro', text: text, url: shareUrl }); } 
            catch(err) { console.log('Share cancelled'); }
        } else {
            navigator.clipboard.writeText(text + '\n' + shareUrl);
            alert('Trade setup copied to clipboard!');
        }
    };

    // ==========================================
    // --- 10. READ SHARED LINKS ON PAGE LOAD ---
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTool = urlParams.get('tool');
    
    if (sharedTool) {
        // 1. Activate the correct tab visually
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if(btn.textContent.toLowerCase().includes(sharedTool.replace('fees', 'fee'))) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        switchTab(sharedTool, true); // true = prevents inputs from wiping

        // 2. Type the numbers into the boxes
        if (sharedTool === 'spot') {
            ['spot-inv', 'spot-buy', 'spot-sell', 'spot-fee'].forEach(id => {
                if(urlParams.has(id)) document.getElementById(id).value = urlParams.get(id);
            });
            document.getElementById('spot-inv')?.dispatchEvent(new Event('input')); // Triggers math
        } else if (sharedTool === 'futures') {['fut-entry', 'fut-exit', 'fut-lev', 'fut-margin', 'fut-fee'].forEach(id => {
                if(urlParams.has(id)) document.getElementById(id).value = urlParams.get(id);
            });
            if(urlParams.get('isLong') === 'false') document.getElementById('btn-short')?.click();
            else document.getElementById('fut-entry')?.dispatchEvent(new Event('input'));
        } else if (sharedTool === 'fees') {
            ['fee-size', 'fee-pct'].forEach(id => {
                if(urlParams.has(id)) document.getElementById(id).value = urlParams.get(id);
            });
            document.getElementById('fee-size')?.dispatchEvent(new Event('input'));
        }
        
        // 3. Clean up the URL so it looks neat in the browser
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ==========================================
    // --- 11. UNBLOCKABLE LIVE TICKER (COINLORE) ---
    // ==========================================
    const track = document.getElementById('crypto-ticker-track');
    if(track && !track.dataset.cloned) {
        const content = track.innerHTML;
        track.innerHTML = content + content; 
        track.dataset.cloned = "true"; 
    }

    async function fetchCryptoPrices() {
        try {
            const response = await fetch('https://api.coinlore.net/api/tickers/?start=0&limit=100');
            if (!response.ok) throw new Error('API blocked');
            const result = await response.json();

            const formatPrice = (priceStr) => {
                const price = parseFloat(priceStr);
                if (price < 2) return '$' + price.toFixed(4);
                return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const symbolMap = { 'BTC': 'btc', 'ETH': 'eth', 'XRP': 'xrp', 'BNB': 'bnb', 'SOL': 'sol' };

            if(result && result.data) {
                result.data.forEach(coin => {
                    const coinKey = symbolMap[coin.symbol];
                    if(coinKey) {
                        const priceElements = document.querySelectorAll(`.price-${coinKey}`);
                        priceElements.forEach(el => el.textContent = formatPrice(coin.price_usd));
                        
                        const changeElements = document.querySelectorAll(`.change-${coinKey}`);
                        const changeVal = parseFloat(coin.percent_change_24h);
                        
                        changeElements.forEach(el => {
                            if (changeVal >= 0) {
                                el.textContent = `+${changeVal.toFixed(2)}%`;
                                el.classList.remove('loss'); el.classList.add('profit');
                            } else {
                                el.textContent = `${changeVal.toFixed(2)}%`;
                                el.classList.remove('profit'); el.classList.add('loss');
                            }
                        });
                    }
                });
            }
        } catch (error) { console.log("Waiting for network..."); }
    }
    fetchCryptoPrices();
    setInterval(fetchCryptoPrices, 15000); 

    // ==========================================
    // --- 12. ARTICLE APPLE-STYLE SHARE BUTTON ---
    // ==========================================
    const articleShareBtn = document.getElementById('share-btn');
    if (articleShareBtn) {
        articleShareBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: document.title,
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('User cancelled share.');
                }
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Article link copied to clipboard!");
            }
        });
    }

    // ==========================================
    // --- 13. DCA CALCULATOR LOGIC & CHART ---
    // ==========================================
    const dcaContainer = document.getElementById('dca-calculator');
    if (dcaContainer) {
        
        const inputs =['dca-invest', 'dca-price', 'dca-buys', 'dca-target', 'dca-change', 'dca-fee', 'dca-slip'];
        const getNum = id => parseFloat(document.getElementById(id).value) || 0;
        
        // Slider visual update
        document.getElementById('dca-buys').addEventListener('input', (e) => {
            document.getElementById('dca-buys-val').textContent = e.target.value;
        });

        // Toggle buttons logic
        let freq = 'weekly';
        document.querySelectorAll('.dca-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.dca-toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                freq = e.target.dataset.val;
                calculateDCA();
            });
        });

        // Number animation function
        const animatedCache = {};
        function animateValue(id, end, isCurrency, isCrypto) {
            const el = document.getElementById(id);
            if(!el) return;
            const start = animatedCache[id] || 0;
            animatedCache[id] = end;
            const duration = 500;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                // Ease out function
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = start + (end - start) * ease;
                
                if(isCurrency) el.textContent = '$' + current.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                else if (isCrypto) el.textContent = current.toFixed(6);
                else el.textContent = current.toFixed(2) + '%';
                
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }

        function calculateDCA() {
            const invest = getNum('dca-invest');
            const startPrice = getNum('dca-price');
            const buys = getNum('dca-buys');
            const target = getNum('dca-target');
            const changePct = getNum('dca-change') / 100;
            const feePct = getNum('dca-fee') / 100;
            const slipPct = getNum('dca-slip') / 100;

            let totalInvested = 0;
            let totalCoins = 0;
            let currentPrice = startPrice;
            
            const chartData =[];
            const tbody = document.getElementById('dca-table-body');
            tbody.innerHTML = '';

            for (let i = 1; i <= buys; i++) {
                // Apply slippage to buy price
                const effectivePrice = currentPrice * (1 + slipPct);
                
                // Calculate coins bought after fee
                const coinsBought = (invest / effectivePrice) * (1 - feePct);
                
                totalInvested += invest;
                totalCoins += coinsBought;
                const avgPrice = totalInvested / totalCoins;

                // Save for chart
                chartData.push({ buy: i, marketPrice: currentPrice, avgPrice: avgPrice });

                // Add to table
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: left;">Buy ${i}</td>
                    <td>$${currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>$${invest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="color: #00FFA3;">+${coinsBought.toFixed(6)}</td>
                    <td>${totalCoins.toFixed(6)}</td>
                `;
                tbody.appendChild(tr);

                // Simulate price movement for next buy
                currentPrice = currentPrice * (1 + changePct);
            }

            const finalAvgPrice = totalInvested / totalCoins;
            animateValue('res-avg-price', finalAvgPrice, true, false);
            animateValue('res-invested', totalInvested, true, false);
            animateValue('res-coins', totalCoins, false, true);

            // Profit Calculation
            const profEl = document.getElementById('res-profit');
            const pctEl = document.getElementById('res-profit-pct');
            if (target > 0) {
                const portfolioValue = totalCoins * target;
                const profit = portfolioValue - totalInvested;
                const profitPct = (profit / totalInvested) * 100;
                
                animateValue('res-profit', Math.abs(profit), true, false);
                animateValue('res-profit-pct', Math.abs(profitPct), false, false);
                
                if (profit >= 0) {
                    profEl.style.color = '#00FFA3'; pctEl.style.color = '#00FFA3';
                    profEl.textContent = profEl.textContent.replace('$', '+$');
                    pctEl.textContent = '+' + pctEl.textContent;
                } else {
                    profEl.style.color = '#EF4444'; pctEl.style.color = '#EF4444';
                    profEl.textContent = profEl.textContent.replace('$', '-$');
                    pctEl.textContent = '-' + pctEl.textContent;
                }
            } else {
                profEl.textContent = "$0.00"; pctEl.textContent = "0.00%";
                profEl.style.color = '#8A93A6'; pctEl.style.color = '#8A93A6';
            }

            drawChart(chartData);
        }

        // Extremely lightweight vanilla JS SVG Line Chart
        function drawChart(data) {
            const svg = document.getElementById('dca-chart');
            svg.innerHTML = ''; // Clear old chart
            if(data.length < 2) return;

            const w = 500; const h = 200;
            const padX = 10; const padY = 20;

            const allPrices = data.flatMap(d => [d.marketPrice, d.avgPrice]);
            const minP = Math.min(...allPrices) * 0.95;
            const maxP = Math.max(...allPrices) * 1.05;
            
            const getX = (index) => padX + (index / (data.length - 1)) * (w - padX * 2);
            const getY = (price) => h - padY - ((price - minP) / (maxP - minP)) * (h - padY * 2);

            let marketPts = "", avgPts = "";
            data.forEach((d, i) => {
                const x = getX(i);
                marketPts += `${x},${getY(d.marketPrice)} `;
                avgPts += `${x},${getY(d.avgPrice)} `;
            });

            // Draw Market Line
            const mLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            mLine.setAttribute("points", marketPts.trim());
            mLine.setAttribute("class", "chart-line-market");
            svg.appendChild(mLine);

            // Draw Avg Price Line
            const aLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            aLine.setAttribute("points", avgPts.trim());
            aLine.setAttribute("class", "chart-line-avg");
            svg.appendChild(aLine);
        }

        inputs.forEach(id => document.getElementById(id).addEventListener('input', calculateDCA));

        // URL Sharing Logic
        window.shareDCA = async function() {
            let params = new URLSearchParams();
            inputs.forEach(id => params.append(id.replace('dca-', ''), getNum(id)));
            params.append('freq', freq);
            
            let shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
            if (navigator.share) {
                try { await navigator.share({ title: 'My DCA Strategy', url: shareUrl }); } catch(err) {}
            } else {
                navigator.clipboard.writeText(shareUrl);
                alert('Strategy Link Copied!');
            }
        };

        // Load Shared URL Data
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('invest')) {
            inputs.forEach(id => {
                const key = id.replace('dca-', '');
                if(urlParams.has(key)) document.getElementById(id).value = urlParams.get(key);
            });
            const sFreq = urlParams.get('freq');
            if(sFreq) {
                document.querySelectorAll('.dca-toggle-btn').forEach(b => {
                    b.classList.remove('active');
                    if(b.dataset.val === sFreq) b.classList.add('active');
                });
            }
            document.getElementById('dca-buys-val').textContent = document.getElementById('dca-buys').value;
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Initial Calculation
        calculateDCA();
    }
    
}); // <-- DO NOT DELETE THIS FINAL BRACKET!

              
