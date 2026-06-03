/* ============================================
   NovaPay — AI Route Optimizer
   Autonomous agent for finding optimal 
   cross-border payment corridors on Stellar
   ============================================ */

class AIRouteOptimizer {
    constructor() {
        this.corridors = new Map();
        this.marketData = {};
        this.isScanning = false;
        this.scanInterval = null;
        this.listeners = [];
        this.routeCache = new Map();
        this.confidence = 0;
        
        this._initMarketData();
    }

    /**
     * Initialize market data for all supported pairs
     */
    _initMarketData() {
        this.marketData = {
            'USDC/XLM': { bid: 7.12, ask: 7.16, spread: 0.04, volume24h: 2400000, liquidity: 'high' },
            'XLM/TRY':  { bid: 5.36, ask: 5.40, spread: 0.04, volume24h: 1850000, liquidity: 'medium' },
            'USDC/TRY': { bid: 38.40, ask: 38.45, spread: 0.05, volume24h: 980000, liquidity: 'medium' },
            'EUR/USDC': { bid: 1.085, ask: 1.089, spread: 0.004, volume24h: 3200000, liquidity: 'high' },
            'USD/USDC': { bid: 0.999, ask: 1.001, spread: 0.002, volume24h: 15000000, liquidity: 'very_high' },
            'EUR/XLM':  { bid: 7.74, ask: 7.78, spread: 0.04, volume24h: 890000, liquidity: 'medium' },
            'XLM/EUR':  { bid: 0.128, ask: 0.130, spread: 0.002, volume24h: 890000, liquidity: 'medium' },
            'USDC/EUR': { bid: 0.918, ask: 0.922, spread: 0.004, volume24h: 3200000, liquidity: 'high' },
        };

        // Pre-compute corridors
        this.corridors.set('USDC→TRY', [
            { path: ['USDC', 'TRY'], direct: true },
            { path: ['USDC', 'XLM', 'TRY'], via: 'XLM' },
            { path: ['USDC', 'XLM', 'USDC', 'TRY'], via: 'XLM+USDC' },
        ]);
        this.corridors.set('USD→TRY', [
            { path: ['USD', 'USDC', 'TRY'], via: 'USDC' },
            { path: ['USD', 'USDC', 'XLM', 'TRY'], via: 'USDC+XLM' },
        ]);
        this.corridors.set('EUR→TRY', [
            { path: ['EUR', 'USDC', 'TRY'], via: 'USDC' },
            { path: ['EUR', 'XLM', 'TRY'], via: 'XLM' },
            { path: ['EUR', 'USDC', 'XLM', 'TRY'], via: 'USDC+XLM' },
        ]);
    }

    /**
     * Start autonomous market scanning
     */
    startScanning(intervalMs = 5000) {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this._emit('scan_started', { timestamp: Date.now() });

        this.scanInterval = setInterval(() => {
            this._simulateMarketUpdate();
            this._evaluateRoutes();
        }, intervalMs);

        // Initial scan
        this._simulateMarketUpdate();
        this._evaluateRoutes();
    }

    /**
     * Stop scanning
     */
    stopScanning() {
        this.isScanning = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        this._emit('scan_stopped', { timestamp: Date.now() });
    }

    /**
     * Find the optimal route for a transfer
     */
    findOptimalRoute(fromCurrency, toCurrency, amount) {
        const cacheKey = `${fromCurrency}→${toCurrency}`;
        const corridorKey = `${fromCurrency}→${toCurrency}`;
        const routes = this.corridors.get(corridorKey) || this._generateRoutes(fromCurrency, toCurrency);

        const evaluated = routes.map(route => this._evaluateRoute(route, amount, fromCurrency, toCurrency));
        
        // Sort by total cost (fees + slippage)
        evaluated.sort((a, b) => a.totalCost - b.totalCost);
        
        const best = evaluated[0];
        best.isOptimal = true;
        best.confidence = this._calculateConfidence(best, evaluated);
        
        // Cache the result
        this.routeCache.set(cacheKey, {
            route: best,
            timestamp: Date.now(),
            alternatives: evaluated.slice(1)
        });

        this._emit('route_found', {
            from: fromCurrency,
            to: toCurrency,
            amount: amount,
            optimal: best,
            alternatives: evaluated.length - 1
        });

        return {
            optimal: best,
            alternatives: evaluated.slice(1),
            timestamp: Date.now()
        };
    }

    /**
     * Compare NovaPay route with traditional methods
     */
    compareWithTraditional(amount, fromCurrency, toCurrency) {
        const novaRoute = this.findOptimalRoute(fromCurrency, toCurrency, amount);
        
        const traditional = {
            method: 'SWIFT / Wire Transfer',
            fee: amount * 0.075, // 7.5% average
            feePercent: 7.5,
            time: '2-5 business days',
            timeSeconds: 259200, // 3 days average
            privacy: 'none',
            intermediaries: 3,
            exchangeRate: this._getDirectRate(fromCurrency, toCurrency) * 0.97, // 3% markup
        };

        const novaPay = {
            method: 'NovaPay AI Route',
            fee: 0.00001, // Stellar network fee
            feePercent: (0.00001 / amount) * 100,
            time: '~5 seconds',
            timeSeconds: 5,
            privacy: 'shielded',
            intermediaries: 0,
            exchangeRate: this._getDirectRate(fromCurrency, toCurrency),
            route: novaRoute.optimal,
        };

        const savings = {
            feeSaved: traditional.fee - novaPay.fee,
            feeSavedPercent: traditional.feePercent - novaPay.feePercent,
            timeSaved: traditional.timeSeconds - novaPay.timeSeconds,
            timeSavedHuman: this._formatTimeDiff(traditional.timeSeconds - novaPay.timeSeconds),
            rateDifference: novaPay.exchangeRate - traditional.exchangeRate,
            totalSavings: traditional.fee - novaPay.fee,
        };

        return { traditional, novaPay, savings };
    }

    /**
     * Get agent status report
     */
    getAgentStatus() {
        return {
            isScanning: this.isScanning,
            pairsMonitored: Object.keys(this.marketData).length,
            routesCached: this.routeCache.size,
            lastUpdate: Date.now(),
            confidence: this.confidence,
            marketCondition: this._assessMarketCondition(),
            uptime: this.isScanning ? Date.now() - (this._scanStartTime || Date.now()) : 0
        };
    }

    // ========== Internal Methods ==========

    _generateRoutes(from, to) {
        const intermediates = ['XLM', 'USDC', 'EUR'];
        const routes = [
            { path: [from, to], direct: true }
        ];
        
        intermediates.forEach(mid => {
            if (mid !== from && mid !== to) {
                routes.push({ path: [from, mid, to], via: mid });
            }
        });
        
        return routes;
    }

    _evaluateRoute(route, amount, from, to) {
        const steps = [];
        let currentAmount = amount;
        let totalFees = 0;
        let totalSlippage = 0;

        for (let i = 0; i < route.path.length - 1; i++) {
            const fromAsset = route.path[i];
            const toAsset = route.path[i + 1];
            const rate = this._getRate(fromAsset, toAsset);
            const slippage = this._estimateSlippage(fromAsset, toAsset, currentAmount);
            const fee = 0.00001; // Stellar base fee per operation

            const outputAmount = currentAmount * rate * (1 - slippage);
            
            steps.push({
                from: fromAsset,
                to: toAsset,
                inputAmount: currentAmount,
                outputAmount: outputAmount,
                rate: rate,
                slippage: slippage,
                fee: fee
            });

            totalFees += fee;
            totalSlippage += slippage;
            currentAmount = outputAmount;
        }

        return {
            path: route.path,
            steps: steps,
            inputAmount: amount,
            outputAmount: currentAmount,
            effectiveRate: currentAmount / amount,
            totalFees: totalFees,
            totalSlippage: totalSlippage,
            totalCost: totalFees + (amount * totalSlippage),
            hops: route.path.length - 1,
            estimatedTime: (route.path.length - 1) * 5, // ~5s per hop
        };
    }

    _getRate(from, to) {
        const key = `${from}/${to}`;
        const reverseKey = `${to}/${from}`;
        
        if (this.marketData[key]) {
            return (this.marketData[key].bid + this.marketData[key].ask) / 2;
        }
        if (this.marketData[reverseKey]) {
            return 1 / ((this.marketData[reverseKey].bid + this.marketData[reverseKey].ask) / 2);
        }
        
        // Fallback rates
        const fallbackRates = {
            'USDC/TRY': 38.425, 'TRY/USDC': 0.026,
            'USDC/XLM': 7.14, 'XLM/USDC': 0.14,
            'XLM/TRY': 5.38, 'TRY/XLM': 0.186,
            'USD/USDC': 1.0, 'USDC/USD': 1.0,
            'USD/TRY': 38.42, 'TRY/USD': 0.026,
            'EUR/TRY': 41.76, 'TRY/EUR': 0.024,
            'EUR/USDC': 1.087, 'USDC/EUR': 0.92,
            'EUR/XLM': 7.76, 'XLM/EUR': 0.129,
            'USD/XLM': 7.14, 'XLM/USD': 0.14,
            'USD/EUR': 0.92, 'EUR/USD': 1.087,
        };
        
        return fallbackRates[key] || 1;
    }

    _getDirectRate(from, to) {
        return this._getRate(from, to);
    }

    _estimateSlippage(from, to, amount) {
        const key = `${from}/${to}`;
        const data = this.marketData[key] || this.marketData[`${to}/${from}`];
        
        if (!data) return 0.001; // 0.1% default
        
        const liquidityFactor = {
            'very_high': 0.0001,
            'high': 0.0005,
            'medium': 0.001,
            'low': 0.003
        };
        
        const baseLiquidity = liquidityFactor[data.liquidity] || 0.001;
        const amountImpact = amount > 10000 ? 0.0005 : 0;
        
        return baseLiquidity + amountImpact;
    }

    _calculateConfidence(best, all) {
        if (all.length <= 1) return 95;
        
        const secondBest = all[1];
        const improvement = ((secondBest.totalCost - best.totalCost) / secondBest.totalCost) * 100;
        
        this.confidence = Math.min(99, 85 + improvement * 2);
        return this.confidence;
    }

    _simulateMarketUpdate() {
        // Add small random variations to market data
        Object.keys(this.marketData).forEach(pair => {
            const data = this.marketData[pair];
            const variation = (Math.random() - 0.5) * 0.002; // ±0.1%
            
            data.bid *= (1 + variation);
            data.ask *= (1 + variation);
            data.spread = data.ask - data.bid;
            data.volume24h += Math.floor((Math.random() - 0.5) * 50000);
        });

        this._emit('market_update', {
            pairs: Object.keys(this.marketData).length,
            timestamp: Date.now()
        });
    }

    _evaluateRoutes() {
        // Re-evaluate all cached routes
        this.routeCache.forEach((cached, key) => {
            const [from, to] = key.split('→');
            if (from && to) {
                const updated = this.findOptimalRoute(from, to, 100);
                this.routeCache.set(key, {
                    route: updated.optimal,
                    timestamp: Date.now(),
                    alternatives: updated.alternatives
                });
            }
        });
    }

    _assessMarketCondition() {
        const avgSpread = Object.values(this.marketData)
            .reduce((sum, d) => sum + (d.spread / d.bid), 0) / Object.keys(this.marketData).length;
        
        if (avgSpread < 0.001) return 'excellent';
        if (avgSpread < 0.005) return 'good';
        if (avgSpread < 0.01) return 'fair';
        return 'volatile';
    }

    _formatTimeDiff(seconds) {
        if (seconds >= 86400) return `${Math.floor(seconds / 86400)} days`;
        if (seconds >= 3600) return `${Math.floor(seconds / 3600)} hours`;
        if (seconds >= 60) return `${Math.floor(seconds / 60)} minutes`;
        return `${seconds} seconds`;
    }

    // ========== Event System ==========
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    _emit(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
}

// Export singleton
window.aiRouter = new AIRouteOptimizer();
