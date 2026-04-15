document.addEventListener('alpine:init', () => {
    Alpine.data('calculator', () => {
        let chart = null;
        let chartUpdateFrame = null;

        return {
        defaults: {
            propertyValue: 2600000,
            downPayment: 1000000,
            interestRate: 1.45,
            cashReturn: 5,
            propertyReturn: 5,
            taxRegion: 'Zurich (ZH)',
            timeHorizon: 15
        },

        // Input values
        propertyValue: 0,
        downPayment: 0,
        interestRate: 0,
        cashReturn: 0,
        propertyReturn: 0,
        taxRegion: '',
        timeHorizon: 0,

        init() {
            Object.assign(this, this.defaults);

            this.$nextTick(() => {
                this.initChart();
            });

            // Watch for changes and update chart
            this.$watch('timeHorizon', (value) => {
                this.updateChart();
            });
            this.$watch('propertyValue', () => this.updateChart());
            this.$watch('downPayment', () => this.updateChart());
            this.$watch('propertyReturn', () => this.updateChart());
            this.$watch('cashReturn', () => this.updateChart());
        },

        initChart() {
            const ctx = document.getElementById('wealthChart');
            if (!ctx) return;

            if (chart) {
                chart.destroy();
            }

            chart = new Chart(ctx, {
                type: 'line',
                data: this.getChartData(),
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                                font: {
                                    size: 12,
                                    family: 'Plus Jakarta Sans'
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed.y;
                                    return `${context.dataset.label}: ${this.formatNumber(value)} CHF`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0,
                            max: Math.max(1, Number(this.timeHorizon) || 1),
                            title: {
                                display: true,
                                text: 'Year'
                            },
                            ticks: {
                                callback: (value) => `Year ${value}`
                            },
                            grid: {
                                color: '#E2E8F0'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Value (CHF)'
                            },
                            ticks: {
                                callback: (value) => this.formatNumber(value)
                            },
                            grid: {
                                color: '#E2E8F0'
                            }
                        }
                    }
                }
            });
        },

        updateChart() {
            if (!chart) return;

            if (chartUpdateFrame) {
                cancelAnimationFrame(chartUpdateFrame);
            }

            chartUpdateFrame = requestAnimationFrame(() => {
                const data = this.getChartData();
                chart.data.datasets = data.datasets;
                chart.options.scales.x.max = Math.max(1, Number(this.timeHorizon) || 1);
                chart.update('none');
                chartUpdateFrame = null;
            });
        },

        getChartData() {
            const maxYears = Math.max(1, Number(this.timeHorizon) || 1);
            const interestSavedData = [];
            const etfData = [];

            for (let year = 0; year <= maxYears; year += 1) {
                const etfValue = this.investableCash * Math.pow(1 + this.cashReturn / 100, year);
                const currentInterestPaid = this.annualMortgageInterest * year;
                const minimumInterestPaid = (this.propertyValue - this.minDownPayment) * (this.interestRate / 100) * year;
                const currentInterestSaved = minimumInterestPaid - currentInterestPaid;
                const etfGain = etfValue - this.investableCash;
                interestSavedData.push({ x: year, y: Math.round(currentInterestSaved) });
                etfData.push({ x: year, y: Math.round(etfGain) });
            }

            if (etfData[etfData.length - 1]?.x !== maxYears) {
                const etfValue = this.investableCash * Math.pow(1 + this.cashReturn / 100, maxYears);
                const currentInterestPaid = this.annualMortgageInterest * maxYears;
                const minimumInterestPaid = (this.propertyValue - this.minDownPayment) * (this.interestRate / 100) * maxYears;
                const currentInterestSaved = minimumInterestPaid - currentInterestPaid;
                const etfGain = etfValue - this.investableCash;
                interestSavedData.push({ x: maxYears, y: Math.round(currentInterestSaved) });
                etfData.push({ x: maxYears, y: Math.round(etfGain) });
            }

            return {
                datasets: [
                    {
                        label: 'ETF Gains',
                        data: etfData,
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 3,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Interest Saved',
                        data: interestSavedData,
                        borderColor: '#0F172A',
                        backgroundColor: 'rgba(15, 23, 42, 0.1)',
                        borderWidth: 3,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.4
                    }
                ]
            };
        },

        // Computed: Min down payment (20%)
        get minDownPayment() {
            return this.propertyValue * 0.33;
        },

        // Computed: Is down payment valid?
        get isDownPaymentValid() {
            return this.downPayment >= this.minDownPayment;
        },

        // Computed: Cash available to invest above the minimum down payment
        get investableCash() {
            return Math.max(0, this.downPayment - this.minDownPayment);
        },

        // Computed: Mortgage amount
        get mortgageAmount() {
            return this.propertyValue - this.downPayment;
        },

        // Computed: Annual mortgage interest cost
        get annualMortgageInterest() {
            return this.mortgageAmount * (this.interestRate / 100);
        },

        // Computed: Monthly mortgage payment under the current interest-only model
        get monthlyMortgagePayment() {
            return Math.round(this.annualMortgageInterest / 12);
        },

        // Computed: Total interest paid over the time horizon
        get interestPaid() {
            return Math.round(this.annualMortgageInterest * this.timeHorizon);
        },

        // Computed: Interest paid when using only the minimum down payment
        get minimumDownPaymentInterestPaid() {
            const minimumMortgageAmount = this.propertyValue - this.minDownPayment;
            const annualMinimumMortgageInterest = minimumMortgageAmount * (this.interestRate / 100);
            return Math.round(annualMinimumMortgageInterest * this.timeHorizon);
        },

        // Computed: Monthly mortgage payment with the minimum down payment
        get minimumDownPaymentMonthlyMortgagePayment() {
            const minimumMortgageAmount = this.propertyValue - this.minDownPayment;
            const annualMinimumMortgageInterest = minimumMortgageAmount * (this.interestRate / 100);
            return Math.round(annualMinimumMortgageInterest / 12);
        },

        // Computed: Interest saved by paying more than the minimum down payment
        get interestSaved() {
            return this.minimumDownPaymentInterestPaid - this.interestPaid;
        },

        // Computed: Property value after time horizon
        get propertyNetWorth() {
            const appreciation = Math.pow(1 + this.propertyReturn / 100, this.timeHorizon);
            return Math.round(this.propertyValue * appreciation);
        },

        // Computed: Property gain after time horizon
        get propertyNetGain() {
            return this.propertyNetWorth - this.propertyValue;
        },

        // Computed: Property gain percentage
        get propertyGainPercent() {
            return ((this.propertyNetGain / this.propertyValue) * 100).toFixed(1);
        },

        // Computed: ETF portfolio value after time horizon
        get etfPortfolioValue() {
            // ETF grows from cash above the minimum required down payment
            const growth = Math.pow(1 + this.cashReturn / 100, this.timeHorizon);
            return Math.round(this.investableCash * growth);
        },

        // Computed: ETF gain after time horizon
        get etfPortfolioGain() {
            return this.etfPortfolioValue - this.investableCash;
        },

        // Computed: ETF gain percentage
        get etfGainPercent() {
            if (this.investableCash <= 0) return '0.0';
            return ((this.etfPortfolioGain / this.investableCash) * 100).toFixed(1);
        },

        // Computed: Opportunity cost
        get opportunityCost() {
            return this.etfPortfolioGain - this.interestSaved;
        },

        // Computed: Which financing choice leads
        get leadingStrategy() {
            return this.opportunityCost > 0 ? 'Minimum down + ETF' : 'Higher down payment';
        },

        // Computed: Format number with apostrophes
        formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        },

        // Reset to defaults
        resetDefaults() {
            Object.assign(this, this.defaults);
        },

        // Generate chart path for property
        get propertyChartPath() {
            const points = [];
            const maxYears = 50;
            const width = 1000;
            const height = 400;
            const padding = 40;

            // Calculate max value for scaling
            const maxPropertyValue = this.propertyValue * Math.pow(1 + this.propertyReturn / 100, maxYears);
            const maxEtfValue = this.investableCash * Math.pow(1 + this.cashReturn / 100, maxYears);
            const maxValue = Math.max(maxPropertyValue, maxEtfValue);

            for (let year = 0; year <= maxYears; year += 2) {
                const value = this.propertyValue * Math.pow(1 + this.propertyReturn / 100, year);
                const x = (year / maxYears) * (width - 2 * padding) + padding;
                const y = height - padding - ((value / maxValue) * (height - 2 * padding));
                points.push(`${x} ${y}`);
            }

            return `M ${points.join(' L ')}`;
        },

        // Generate chart path for ETF
        get etfChartPath() {
            const points = [];
            const maxYears = 50;
            const width = 1000;
            const height = 400;
            const padding = 40;

            // Calculate max value for scaling
            const maxPropertyValue = this.propertyValue * Math.pow(1 + this.propertyReturn / 100, maxYears);
            const maxEtfValue = this.investableCash * Math.pow(1 + this.cashReturn / 100, maxYears);
            const maxValue = Math.max(maxPropertyValue, maxEtfValue);

            for (let year = 0; year <= maxYears; year += 2) {
                const value = this.investableCash * Math.pow(1 + this.cashReturn / 100, year);
                const x = (year / maxYears) * (width - 2 * padding) + padding;
                const y = height - padding - ((value / maxValue) * (height - 2 * padding));
                points.push(`${x} ${y}`);
            }

            return `M ${points.join(' L ')}`;
        },

        // Find crossover year where ETF overtakes property
        get crossoverYear() {
            for (let year = 1; year <= 50; year++) {
                const propValue = this.propertyValue * Math.pow(1 + this.propertyReturn / 100, year);
                const etfValue = this.investableCash * Math.pow(1 + this.cashReturn / 100, year);
                if (etfValue > propValue) {
                    return year;
                }
            }
            return null;
        }
    }});
});
