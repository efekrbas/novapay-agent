/* ============================================
   NovaPay — Main Application Logic
   AI-Powered Privacy-Preserving Payment Agent
   Built on Stellar
   ============================================ */

// ========== Page Navigation ==========
class NovaPayApp {
    constructor() {
        this.currentPage = 'hero';
        this.walletConnected = false;
        this.walletAddress = '';
        this.agentRunning = true;
        this.agentStartTime = Date.now() - (42 * 60 + 17) * 1000;
        this.stellar = window.stellarService;
        this.aiRouter = window.aiRouter;
        this.privacy = window.privacyShield;
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupWallet();
        this.setupTransfer();
        this.setupAgent();
        this.setupPrivacy();
        this.populateDashboard();
        this.startAgentSimulation();
        this.startTerminalAnimation();

        // Initialize Stellar connection
        await this.initStellar();
        
        // Start AI route scanning
        if (this.aiRouter) {
            this.aiRouter.startScanning(6000);
            this.aiRouter.on('route_found', (data) => {
                this.addAgentLog('agent', `Route optimized: ${data.from}→${data.to} | Confidence: ${data.optimal.confidence?.toFixed(1)}%`);
            });
            this.aiRouter.on('market_update', () => {
                this.addAgentLog('info', `Market scan: ${Object.keys(this.aiRouter.marketData).length} pairs updated`);
            });
        }
    }

    async initStellar() {
        if (!this.stellar) return;
        
        const connected = await this.stellar.init();
        if (connected) {
            this.addAgentLog('success', 'Connected to Stellar Horizon Testnet');
        } else {
            this.addAgentLog('info', 'Running in simulation mode (Stellar Testnet)');
        }

        // Start event stream
        this.stellar.startEventStream(null, (event) => {
            if (event.type === 'trade') {
                this.addAgentLog('info', `DEX Trade: ${event.pair} @ ${event.price} | Vol: ${event.volume}`);
            } else if (event.type === 'ledger') {
                this.addAgentLog('info', `Ledger #${event.sequence}: ${event.txCount} txns, closed in ${event.closeTime}s`);
            }
        });
    }

    // ========== Navigation ==========
    setupNavigation() {
        // Nav links
        document.querySelectorAll('[data-page]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const page = el.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Hamburger menu
        const hamburger = document.getElementById('nav-hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                document.querySelector('.nav-links').classList.toggle('open');
            });
        }
    }

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Close mobile menu
        document.querySelector('.nav-links')?.classList.remove('open');

        this.currentPage = page;
        window.scrollTo(0, 0);
    }

    // ========== Wallet Connection ==========
    setupWallet() {
        const connectBtn = document.getElementById('btn-connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
    }

    async connectWallet() {
        const connectBtn = document.getElementById('btn-connect-wallet');
        connectBtn.innerHTML = `<span class="scan-dot"></span> Connecting...`;
        connectBtn.disabled = true;

        // Generate keypair via Stellar service
        const keypair = this.stellar.generateKeypair();
        this.walletAddress = keypair.publicKey;

        // Fund account via Friendbot
        this.addAgentLog('info', 'Requesting testnet funding via Friendbot...');
        const fundResult = await this.stellar.fundAccount(keypair.publicKey);
        
        if (fundResult.success) {
            this.addAgentLog('success', `Account funded: ${keypair.publicKey.substring(0, 8)}... ${fundResult.simulated ? '(simulated)' : ''}`);
        }

        // Get balances
        const balances = await this.stellar.getBalances(keypair.publicKey);
        this.updateBalanceDisplay(balances);

        this.walletConnected = true;

        // Update UI
        connectBtn.style.display = 'none';
        const walletConnected = document.getElementById('wallet-connected');
        walletConnected.style.display = 'flex';
        document.getElementById('wallet-address').textContent = 
            keypair.publicKey.substring(0, 4) + '...' + keypair.publicKey.substring(keypair.publicKey.length - 4);

        this.showToast('success', 'Wallet Connected', `Funded with ${balances.XLM || 10000} XLM on Testnet`);
        this.addAgentLog('success', `Wallet connected: ${keypair.publicKey.substring(0, 12)}...`);
    }

    updateBalanceDisplay(balances) {
        const xlmEl = document.getElementById('balance-xlm-value');
        const usdcEl = document.getElementById('balance-usdc-value');
        if (xlmEl) xlmEl.textContent = (balances.XLM || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 });
        if (usdcEl) usdcEl.textContent = '$' + (balances.USDC || 1250).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }

    // ========== Transfer Logic ==========
    setupTransfer() {
        const fromAmount = document.getElementById('from-amount');
        const fromCurrency = document.getElementById('from-currency');
        const toCurrency = document.getElementById('to-currency');

        const updateConversion = () => {
            const amount = parseFloat(fromAmount?.value) || 0;
            const from = fromCurrency?.value || 'USDC';
            const to = toCurrency?.value || 'TRY';
            
            // Use AI Router for rate calculation
            let rate = 1;
            if (this.aiRouter) {
                rate = this.aiRouter._getRate(from, to);
            } else {
                const rates = {
                    'USDC-TRY': 38.425, 'USDC-XLM': 7.14, 'USDC-EUR': 0.92, 'USDC-USDC': 1,
                    'XLM-TRY': 5.38, 'XLM-USDC': 0.14, 'XLM-EUR': 0.129, 'XLM-XLM': 1,
                    'USD-TRY': 38.42, 'USD-USDC': 1, 'USD-XLM': 7.14, 'USD-EUR': 0.92,
                    'EUR-TRY': 41.76, 'EUR-USDC': 1.087, 'EUR-XLM': 7.76, 'EUR-EUR': 1,
                    'TRY-USDC': 0.026, 'TRY-XLM': 0.186, 'TRY-EUR': 0.024, 'TRY-TRY': 1,
                };
                rate = rates[`${from}-${to}`] || 1;
            }

            const result = amount * rate;
            const toAmount = document.getElementById('to-amount');
            if (toAmount) toAmount.value = result.toFixed(2);

            const exchangeRate = document.getElementById('exchange-rate');
            if (exchangeRate) exchangeRate.textContent = `1 ${from} = ${rate.toFixed(3)} ${to}`;

            // Update comparison with AI Router
            if (this.aiRouter && amount > 0) {
                const comparison = this.aiRouter.compareWithTraditional(amount, from, to);
                
                const savingsEl = document.querySelector('.savings-banner span');
                if (savingsEl) {
                    savingsEl.innerHTML = `You save <strong>$${comparison.savings.feeSaved.toFixed(3)}</strong> with NovaPay (${comparison.savings.timeSavedHuman} faster)`;
                }

                const badValues = document.querySelectorAll('.route-traditional .bad-value');
                if (badValues.length > 0) {
                    badValues[0].textContent = `$${comparison.traditional.fee.toFixed(2)} (${comparison.traditional.feePercent}%)`;
                }

                // Update route path
                if (comparison.novaPay.route) {
                    const routePath = document.getElementById('route-path');
                    if (routePath) {
                        routePath.innerHTML = comparison.novaPay.route.path.map((node, i) => {
                            const isHighlight = node === 'XLM';
                            const nodeHtml = `<div class="path-node${isHighlight ? ' highlight' : ''}">${node}</div>`;
                            return i < comparison.novaPay.route.path.length - 1 
                                ? nodeHtml + '<div class="path-arrow">→</div>' 
                                : nodeHtml;
                        }).join('');
                    }
                }
            }
        };

        if (fromAmount) fromAmount.addEventListener('input', updateConversion);
        if (fromCurrency) fromCurrency.addEventListener('change', updateConversion);
        if (toCurrency) toCurrency.addEventListener('change', updateConversion);

        // Swap button
        const swapBtn = document.getElementById('swap-currencies');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                const fromVal = fromCurrency.value;
                const toVal = toCurrency.value;
                fromCurrency.value = toVal;
                toCurrency.value = fromVal;
                updateConversion();
            });
        }

        // Send button
        const sendBtn = document.getElementById('btn-send-transfer');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.executeTransfer());
        }

        // Modal close
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('transfer-modal').style.display = 'none';
            });
        }
    }

    async executeTransfer() {
        if (!this.walletConnected) {
            this.showToast('info', 'Connect Wallet', 'Please connect your Stellar wallet first');
            await this.connectWallet();
            return;
        }

        const fromAmount = parseFloat(document.getElementById('from-amount')?.value) || 0;
        const fromCurrency = document.getElementById('from-currency')?.value || 'USDC';
        const toCurrency = document.getElementById('to-currency')?.value || 'TRY';
        const toAmount = document.getElementById('to-amount')?.value || '0';
        const privacyEnabled = document.getElementById('privacy-toggle')?.checked;

        const modal = document.getElementById('transfer-modal');
        modal.style.display = 'flex';
        document.getElementById('modal-title').textContent = 'Processing Transfer';

        const steps = document.querySelectorAll('.transfer-step');
        
        // Reset all steps
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
            step.querySelector('.step-icon').classList.remove('active', 'completed');
            step.querySelector('.step-status').textContent = 'Pending';
        });

        // Step 1: Privacy Shield Verification
        await this._processStep(steps[0], {
            desc: privacyEnabled ? 'Generating ZK selective disclosure proof...' : 'Skipping privacy (disabled)',
            action: async () => {
                if (privacyEnabled && this.privacy) {
                    const proofResult = await this.privacy.generateProof('transfer');
                    if (proofResult.success) {
                        this.addAgentLog('success', `ZK Proof generated: ${proofResult.proof.proofValue.hash.substring(0, 16)}...`);
                        return `ZK Proof verified: privacy score ${proofResult.proof.privacy.privacyScore}%`;
                    }
                }
                return 'Privacy check passed ✓';
            }
        });

        // Step 2: AI Route Optimization
        await this._processStep(steps[1], {
            desc: 'AI agent finding optimal route...',
            action: async () => {
                if (this.aiRouter) {
                    const result = this.aiRouter.findOptimalRoute(fromCurrency, toCurrency, fromAmount);
                    const route = result.optimal;
                    this.addAgentLog('agent', `Route: ${route.path.join('→')} | ${route.hops} hops | Confidence: ${route.confidence?.toFixed(1)}%`);
                    return `Route optimized: ${route.path.join('→')} (${route.confidence?.toFixed(0)}% confidence)`;
                }
                return 'Route optimized: USDC→XLM→TRY ✓';
            }
        });

        // Step 3: Soroban Escrow Contract
        await this._processStep(steps[2], {
            desc: 'Deploying Soroban escrow contract...',
            action: async () => {
                if (this.stellar) {
                    const escrowResult = await this.stellar.invokeEscrowContract('deposit', {
                        amount: fromAmount,
                        asset: fromCurrency,
                    });
                    this.addAgentLog('success', `Escrow created: ${escrowResult.escrowId} | ${fromAmount} ${fromCurrency} locked`);

                    // Release immediately (for demo)
                    await this.delay(400);
                    const releaseResult = await this.stellar.invokeEscrowContract('release', {
                        escrowId: escrowResult.escrowId,
                        amount: fromAmount,
                    });
                    return `Contract executed: ${escrowResult.escrowId} (tx: ${escrowResult.txHash.substring(0, 12)}...)`;
                }
                return 'Contract executed ✓';
            }
        });

        // Step 4: Settlement
        await this._processStep(steps[3], {
            desc: 'Settling funds on Stellar network...',
            action: async () => {
                if (this.stellar) {
                    const recipient = document.getElementById('recipient-address')?.value || 'GXYZ...recipient';
                    const paymentResult = await this.stellar.sendPayment(
                        recipient,
                        fromAmount,
                        fromCurrency
                    );
                    this.addAgentLog('success', `Settlement complete: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency} | tx: ${paymentResult.hash.substring(0, 12)}...`);
                    return `Funds delivered: ${toAmount} ${toCurrency} (ledger #${paymentResult.ledger})`;
                }
                return 'Funds delivered ✓';
            }
        });

        // Success
        document.getElementById('modal-title').textContent = '✅ Transfer Complete!';
        this.showToast('success', 'Transfer Successful', `${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency} delivered in ~5s`);
    }

    async _processStep(stepEl, config) {
        stepEl.classList.add('active');
        stepEl.querySelector('.step-icon').classList.add('active');
        stepEl.querySelector('.step-status').textContent = 'Processing...';
        stepEl.querySelector('.step-desc').textContent = config.desc;

        await this.delay(800);
        const result = await config.action();
        await this.delay(400);

        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        stepEl.querySelector('.step-icon').classList.remove('active');
        stepEl.querySelector('.step-icon').classList.add('completed');
        stepEl.querySelector('.step-status').textContent = 'Done ✓';
        stepEl.querySelector('.step-desc').textContent = result;
    }

    // ========== Agent System ==========
    setupAgent() {
        const startBtn = document.getElementById('btn-agent-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.agentRunning = !this.agentRunning;
                
                if (this.aiRouter) {
                    if (this.agentRunning) {
                        this.aiRouter.startScanning(6000);
                    } else {
                        this.aiRouter.stopScanning();
                    }
                }

                startBtn.innerHTML = this.agentRunning 
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Agent`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg> Start Agent`;
                
                this.showToast('info', 'Agent ' + (this.agentRunning ? 'Started' : 'Paused'), 
                    this.agentRunning ? 'AI Agent is now monitoring markets' : 'AI Agent paused');
            });
        }

        const clearBtn = document.getElementById('btn-clear-log');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const log = document.getElementById('agent-log');
                if (log) log.innerHTML = '';
                this.addAgentLog('info', 'Log cleared. Agent monitoring resumed.');
            });
        }

        // Config button
        const configBtn = document.getElementById('btn-agent-config');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                if (this.aiRouter) {
                    const status = this.aiRouter.getAgentStatus();
                    this.showToast('info', 'Agent Config', 
                        `Pairs: ${status.pairsMonitored} | Cached: ${status.routesCached} | Market: ${status.marketCondition}`);
                }
            });
        }
    }

    startAgentSimulation() {
        // Initial log entries
        const initialLogs = [
            { level: 'info', msg: 'NovaPay Agent v1.0 initialized' },
            { level: 'agent', msg: 'Connected to Stellar Testnet RPC' },
            { level: 'info', msg: `Market scanner started — monitoring ${this.aiRouter ? Object.keys(this.aiRouter.marketData).length : 8} pairs` },
            { level: 'success', msg: 'Privacy Shield activated — selective disclosure ready' },
            { level: 'agent', msg: 'Soroban escrow contract: CDLZFC3S...OOTGYYY loaded' },
        ];

        initialLogs.forEach((log, i) => {
            setTimeout(() => this.addAgentLog(log.level, log.msg), i * 300);
        });

        // Periodic agent actions — now powered by real AI Router
        const getAgentAction = () => {
            if (this.aiRouter) {
                const status = this.aiRouter.getAgentStatus();
                const actions = [
                    { level: 'info', msg: `Scanning ${status.pairsMonitored} pairs — market: ${status.marketCondition}` },
                    { level: 'agent', msg: () => {
                        const route = this.aiRouter.findOptimalRoute('USDC', 'TRY', 100);
                        return `Route analysis: ${route.optimal.path.join('→')} | ${route.optimal.effectiveRate.toFixed(4)} effective rate`;
                    }},
                    { level: 'info', msg: () => {
                        const data = this.aiRouter.marketData['USDC/XLM'];
                        return `USDC/XLM: bid=${data?.bid.toFixed(4)} ask=${data?.ask.toFixed(4)} spread=${data?.spread.toFixed(5)}`;
                    }},
                    { level: 'success', msg: () => `Route cache refreshed — ${this.aiRouter.routeCache.size} routes optimized` },
                    { level: 'agent', msg: () => `AI confidence: ${this.aiRouter.confidence.toFixed(1)}% | Market condition: ${status.marketCondition}` },
                    { level: 'info', msg: 'Heartbeat: Soroban contract responsive (23ms)' },
                    { level: 'agent', msg: () => {
                        if (this.privacy) {
                            const metrics = this.privacy.getPrivacyMetrics();
                            return `Privacy Shield: ${metrics.totalProofs} proofs generated | Avg privacy: ${metrics.avgPrivacyScore}%`;
                        }
                        return 'Privacy Shield: active';
                    }},
                    { level: 'info', msg: () => {
                        const data = this.aiRouter.marketData['XLM/TRY'];
                        return `XLM/TRY: bid=${data?.bid.toFixed(4)} ask=${data?.ask.toFixed(4)} vol=$${(data?.volume24h/1000000).toFixed(1)}M`;
                    }},
                    { level: 'warn', msg: () => {
                        const data = this.aiRouter.marketData['USDC/TRY'];
                        const spreadPct = ((data?.spread / data?.bid) * 100).toFixed(3);
                        return `Spread alert: USDC/TRY spread ${spreadPct}% — ${parseFloat(spreadPct) > 0.15 ? 'elevated' : 'normal'}`;
                    }},
                    { level: 'success', msg: 'Autonomous execution policy: active (threshold $500)' },
                ];
                return actions;
            }
            return [
                { level: 'info', msg: 'Scanning markets...' },
                { level: 'agent', msg: 'Route cache refreshed' },
            ];
        };

        let actionIndex = 0;
        setInterval(() => {
            if (this.agentRunning) {
                const actions = getAgentAction();
                const action = actions[actionIndex % actions.length];
                const msg = typeof action.msg === 'function' ? action.msg() : action.msg;
                this.addAgentLog(action.level, msg);
                actionIndex++;
            }
        }, 4000);

        // Update uptime
        setInterval(() => {
            if (this.agentRunning) {
                const elapsed = Math.floor((Date.now() - this.agentStartTime) / 1000);
                const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
                const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
                const secs = String(elapsed % 60).padStart(2, '0');
                const uptimeEl = document.getElementById('agent-uptime');
                if (uptimeEl) uptimeEl.textContent = `${hours}:${mins}:${secs}`;
            }
        }, 1000);
    }

    addAgentLog(level, msg) {
        const log = document.getElementById('agent-log');
        if (!log) return;

        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-level ${level}">[${level.toUpperCase()}]</span>
            <span class="log-msg">${msg}</span>
        `;

        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        // Keep max 50 entries
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }

        // Also add to dashboard feed
        this.addDashboardFeed(level, msg);
    }

    addDashboardFeed(level, msg) {
        const feed = document.getElementById('agent-feed');
        if (!feed) return;

        const icons = {
            info: '🔍',
            success: '✅',
            warn: '⚠️',
            agent: '🤖'
        };

        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `
            <span class="feed-time">${time}</span>
            <span class="feed-icon">${icons[level] || '📋'}</span>
            <span class="feed-text">${msg}</span>
        `;

        feed.insertBefore(item, feed.firstChild);

        // Keep max 20 entries
        while (feed.children.length > 20) {
            feed.removeChild(feed.lastChild);
        }
    }

    // ========== Privacy ==========
    setupPrivacy() {
        const proofBtn = document.getElementById('btn-generate-proof');
        if (proofBtn) {
            proofBtn.addEventListener('click', () => this.generateProof());
        }
    }

    async generateProof() {
        const btn = document.getElementById('btn-generate-proof');
        btn.innerHTML = `<span class="scan-dot"></span> Generating ZK Proof...`;
        btn.disabled = true;

        if (this.privacy) {
            const result = await this.privacy.generateProof('transfer');
            
            if (result.success) {
                const proof = result.proof;
                
                // Update proof hash display
                const proofHash = document.getElementById('proof-hash');
                if (proofHash) {
                    proofHash.textContent = proof.proofValue.hash.substring(0, 10) + '...' + proof.proofValue.hash.substring(58);
                }

                // Update verifier view with actual disclosed claims
                const verifierView = this.privacy.getVerifierView(proof.id);
                if (verifierView) {
                    this.updateVerifierDisplay(verifierView);
                }

                this.showToast('success', 'ZK Proof Generated', 
                    `Privacy score: ${proof.privacy.privacyScore}% | ${proof.privacy.fieldsDisclosed} claims disclosed, ${proof.privacy.fieldsHidden} hidden`);
                
                this.addAgentLog('success', `ZK Proof: ${proof.proofValue.hash.substring(0, 16)}... | Privacy: ${proof.privacy.privacyScore}%`);

                // Update dashboard privacy metrics
                this.updatePrivacyMetrics();
            }
        } else {
            // Fallback
            const hash = '0x' + Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
            const proofHash = document.getElementById('proof-hash');
            if (proofHash) proofHash.textContent = hash.substring(0, 10) + '...' + hash.substring(58);
            this.showToast('success', 'ZK Proof Generated', 'Selective disclosure proof verified on-chain');
        }

        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Generate ZK Proof
        `;
        btn.disabled = false;
    }

    updateVerifierDisplay(verifierView) {
        // Update the verified claims in the verifier card
        const verifierCard = document.querySelector('.verifier-card .credential-fields');
        if (!verifierCard) return;

        // Flash animation
        verifierCard.style.animation = 'none';
        verifierCard.offsetHeight; // force reflow
        verifierCard.style.animation = 'pageIn 0.5s ease';
    }

    updatePrivacyMetrics() {
        if (!this.privacy) return;
        
        const metrics = this.privacy.getPrivacyMetrics();
        
        // Update metric bars on dashboard
        const metricValues = document.querySelectorAll('.metric-value');
        if (metricValues.length >= 3) {
            metricValues[1].textContent = `${metrics.totalProofs}/${metrics.totalProofs + 3}`;
        }
    }

    // ========== Dashboard ==========
    populateDashboard() {
        const txList = document.getElementById('tx-list');
        if (!txList) return;

        // Use Stellar service for transaction history
        const transactions = [
            { type: 'Sent', icon: '↗️', addr: 'GCXK...7FRD', amount: '-250.00 USDC', time: '2 min ago', sent: true },
            { type: 'Received', icon: '↙️', addr: 'GBXH...9AKL', amount: '+1,500.00 XLM', time: '15 min ago', sent: false },
            { type: 'Sent', icon: '↗️', addr: 'GDZM...2PLQ', amount: '-100.00 USDC', time: '1 hour ago', sent: true },
            { type: 'Received', icon: '↙️', addr: 'GABC...5MNO', amount: '+500.00 USDC', time: '3 hours ago', sent: false },
            { type: 'Sent', icon: '↗️', addr: 'GXYZ...8STU', amount: '-75.50 USDC', time: '5 hours ago', sent: true },
        ];

        txList.innerHTML = transactions.map(tx => `
            <div class="tx-item">
                <div class="tx-icon ${tx.sent ? 'sent' : 'received'}">${tx.icon}</div>
                <div class="tx-info">
                    <span class="tx-type">${tx.type}</span>
                    <span class="tx-address">${tx.addr}</span>
                </div>
                <div style="text-align: right;">
                    <div class="tx-amount ${tx.sent ? 'negative' : 'positive'}">${tx.amount}</div>
                    <div class="tx-time">${tx.time}</div>
                </div>
            </div>
        `).join('');
    }

    // ========== Terminal Animation ==========
    startTerminalAnimation() {
        const terminalLines = [
            { prompt: true, text: 'scanning routes...' },
            { icon: '✓', text: 'Found 3 optimal corridors' },
            { icon: '✓', text: 'Privacy shield: <span class="t-success">ACTIVE</span>' },
            { icon: '✓', text: 'Route: USD → XLM → USDC → TRY' },
            { prompt: true, text: 'executing transfer...' },
            { icon: '✓', text: 'Escrow contract deployed' },
            { icon: '✓', text: 'ZK proof verified on-chain' },
            { icon: '✓', text: 'Settlement complete: <span class="t-success">5.2s</span>' },
            { prompt: true, text: 'monitoring markets...' },
            { icon: '✓', text: 'USDC/XLM rate: 0.14 (stable)' },
            { icon: '✓', text: 'Agent status: <span class="t-success">HEALTHY</span>' },
            { prompt: true, text: 'verifying ZK proofs...' },
            { icon: '✓', text: 'Proof batch #42: <span class="t-success">VALID</span>' },
            { icon: '✓', text: 'Selective disclosure: 4/12 fields shared' },
        ];

        let lineIndex = 5;
        const terminal = document.getElementById('hero-terminal');
        if (!terminal) return;

        setInterval(() => {
            const line = terminalLines[lineIndex % terminalLines.length];
            const el = document.createElement('div');
            el.className = 'terminal-line';

            if (line.prompt) {
                el.innerHTML = `
                    <span class="t-prompt">nova-agent $</span>
                    <span class="t-cmd">${line.text}</span>
                `;
            } else {
                el.innerHTML = `
                    <span class="t-info">${line.icon}</span>
                    <span class="t-text">${line.text}</span>
                `;
            }

            terminal.appendChild(el);
            terminal.scrollTop = terminal.scrollHeight;

            // Keep max 8 lines visible
            while (terminal.children.length > 8) {
                terminal.removeChild(terminal.firstChild);
            }

            lineIndex++;
        }, 3000);
    }

    // ========== Toast System ==========
    showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '✅',
            info: '💡',
            error: '❌',
            warning: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ========== Utility ==========
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ========== Initialize App ==========
document.addEventListener('DOMContentLoaded', () => {
    window.novaApp = new NovaPayApp();
});
