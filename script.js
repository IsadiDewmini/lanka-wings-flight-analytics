/**
 * ============================================================================
 * LANKA WINGS - FLIGHT ANALYTICS & DECISION SUPPORT SYSTEM
 * File: script.js
 * Author: Senior Frontend Developer
 * Description: Modular Vanilla JavaScript client handling mock data generation,
 *              live filtering, reactive Chart.js visualisations, KPI analytics,
 *              automated decision support heuristics, sortable/paginated table,
 *              and CSV data export.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONSTANTS & CONFIGURATION
  // --------------------------------------------------------------------------
  const ROUTES_META = {
    'CMB-LHR': {
      code: 'CMB-LHR',
      name: 'Colombo ⇄ London Heathrow',
      city: 'London',
      country: 'United Kingdom',
      distanceKm: 8710,
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      tag: 'Flagship Long-Haul',
      baseFare: 1150
    },
    'CMB-DXB': {
      code: 'CMB-DXB',
      name: 'Colombo ⇄ Dubai Intl',
      city: 'Dubai',
      country: 'United Arab Emirates',
      distanceKm: 3290,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
      tag: 'High Frequency Hub',
      baseFare: 480
    },
    'CMB-SIN': {
      code: 'CMB-SIN',
      name: 'Colombo ⇄ Singapore Changi',
      city: 'Singapore',
      country: 'Singapore',
      distanceKm: 2750,
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80',
      tag: 'Southeast Asian Hub',
      baseFare: 420
    },
    'CMB-DEL': {
      code: 'CMB-DEL',
      name: 'Colombo ⇄ New Delhi',
      city: 'New Delhi',
      country: 'India',
      distanceKm: 2360,
      image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
      tag: 'Regional Trunk',
      baseFare: 310
    },
    'CMB-MLE': {
      code: 'CMB-MLE',
      name: 'Colombo ⇄ Malé Velana',
      city: 'Malé / Maldives',
      country: 'Maldives',
      distanceKm: 760,
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80',
      tag: 'High Yield Leisure',
      baseFare: 260
    }
  };

  const AIRLINES = [
    'Lanka Wings Mainline',
    'Lanka Wings Express',
    'Ceylon Air Link'
  ];

  const CABIN_CLASSES = [
    { name: 'Economy', fareMultiplier: 1.0, weight: 0.58 },
    { name: 'Premium Economy', fareMultiplier: 1.65, weight: 0.20 },
    { name: 'Business', fareMultiplier: 3.4, weight: 0.16 },
    { name: 'First Class', fareMultiplier: 6.2, weight: 0.06 }
  ];

  const STATUSES = [
    { name: 'Confirmed', weight: 0.78 },
    { name: 'Pending', weight: 0.10 },
    { name: 'Cancelled', weight: 0.12 }
  ];

  const CHANNELS = [
    'Direct Web',
    'Mobile App',
    'Travel Agent / GDS',
    'Corporate Portal',
    'Airport Ticket Desk'
  ];

  // --------------------------------------------------------------------------
  // 2. STATE MANAGEMENT
  // --------------------------------------------------------------------------
  let rawMockBookings = [];
  let filteredBookings = [];
  
  // Table state
  let tableState = {
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: 'date',
    sortDirection: 'desc',
    searchQuery: ''
  };

  // Filter state
  let filterState = {
    datePreset: 'all',
    startDate: '',
    endDate: '',
    route: 'ALL',
    airline: 'ALL',
    cabinClass: 'ALL',
    status: 'ALL'
  };

  // Chart.js instances registry
  const chartInstances = {
    revenueTrend: null,
    routesBar: null,
    classDoughnut: null,
    channelPie: null,
    statusStacked: null,
    airlineBar: null
  };

  // --------------------------------------------------------------------------
  // 3. MOCK DATA GENERATION ENGINE
  // --------------------------------------------------------------------------
  /**
   * Deterministic / pseudorandom generator for 380+ realistic flight bookings
   * spanning 12 continuous calendar months (Nov 2025 to Oct 2026).
   * @returns {Array<Object>} Generated bookings
   */
  function generateData() {
    const data = [];
    const totalRecords = 385;
    const routeKeys = Object.keys(ROUTES_META);
    
    // Seed date window: 12 months up to current time (Oct 2026)
    const endDate = new Date(2026, 9, 28); // 28 Oct 2026
    const startDate = new Date(2025, 10, 1); // 01 Nov 2025
    const totalMs = endDate.getTime() - startDate.getTime();

    // Helper for weighted pick
    function weightedPick(items) {
      const rand = Math.random();
      let cum = 0;
      for (const item of items) {
        cum += item.weight;
        if (rand <= cum) return item.name;
      }
      return items[items.length - 1].name;
    }

    // Helper for random integer in range
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    for (let i = 1; i <= totalRecords; i++) {
      const bookingId = `LW-${String(1000 + i * 19).padStart(5, '0')}`;
      
      // Distribute timestamps with realistic seasonal peaks in July, August & December
      const randomTime = startDate.getTime() + Math.random() * totalMs;
      const bDate = new Date(randomTime);
      const dateString = bDate.toISOString().split('T')[0];

      // Pick route
      const routeKey = routeKeys[Math.floor(Math.random() * routeKeys.length)];
      const routeInfo = ROUTES_META[routeKey];

      // Pick Airline based on route characteristics
      let airline;
      if (routeKey === 'CMB-LHR') {
        airline = 'Lanka Wings Mainline'; // Widebody A350/A330 only
      } else if (routeKey === 'CMB-MLE') {
        airline = Math.random() > 0.4 ? 'Lanka Wings Express' : 'Ceylon Air Link';
      } else {
        airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
      }

      // Pick cabin class
      let cabinClass = weightedPick(CABIN_CLASSES);
      if (routeKey === 'CMB-MLE' && cabinClass === 'First Class') {
        cabinClass = 'Business'; // No First Class on short island hops
      }

      // Pick status
      const status = weightedPick(STATUSES);

      // Number of passengers (1 to 4)
      const passengerCount = Math.random() < 0.65 ? 1 : Math.random() < 0.85 ? 2 : randomInt(3, 4);

      // Calculate Fare based on baseFare, classMultiplier, and realistic dynamic variance
      const classMultiplier = CABIN_CLASSES.find(c => c.name === cabinClass).fareMultiplier;
      const variance = 0.88 + Math.random() * 0.28; // ±14% seasonal variance
      const singleFare = Math.round(routeInfo.baseFare * classMultiplier * variance);
      const totalFare = singleFare * passengerCount;

      // Pick channel
      let channel;
      if (cabinClass === 'First Class' || cabinClass === 'Business') {
        channel = Math.random() < 0.45 ? 'Corporate Portal' : (Math.random() < 0.75 ? 'Direct Web' : 'Travel Agent / GDS');
      } else {
        const cRand = Math.random();
        if (cRand < 0.40) channel = 'Direct Web';
        else if (cRand < 0.70) channel = 'Mobile App';
        else if (cRand < 0.88) channel = 'Travel Agent / GDS';
        else channel = 'Airport Ticket Desk';
      }

      data.push({
        id: bookingId,
        date: dateString,
        route: routeKey,
        airline: airline,
        class: cabinClass,
        passengerCount: passengerCount,
        fare: totalFare,
        singleFare: singleFare,
        status: status,
        channel: channel
      });
    }

    // Sort initially by date descending
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return data;
  }

  /**
   * Simulates an asynchronous data fetch with network latency
   * @returns {Promise<Array<Object>>} Resolves with mock bookings
   */
  function fetchData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = generateData();
        resolve(data);
      }, 350);
    });
  }

  // --------------------------------------------------------------------------
  // 4. FILTERING & DATA TRANSFORMATION ENGINE
  // --------------------------------------------------------------------------
  /**
   * Applies current filter controls onto rawMockBookings
   */
  function applyFilters() {
    let result = [...rawMockBookings];

    // Filter by Date Range
    if (filterState.startDate) {
      result = result.filter(item => item.date >= filterState.startDate);
    }
    if (filterState.endDate) {
      result = result.filter(item => item.date <= filterState.endDate);
    }

    // Filter by Route
    if (filterState.route !== 'ALL') {
      result = result.filter(item => item.route === filterState.route);
    }

    // Filter by Operating Carrier
    if (filterState.airline !== 'ALL') {
      result = result.filter(item => item.airline === filterState.airline);
    }

    // Filter by Cabin Class
    if (filterState.cabinClass !== 'ALL') {
      result = result.filter(item => item.class === filterState.cabinClass);
    }

    // Filter by Booking Status
    if (filterState.status !== 'ALL') {
      result = result.filter(item => item.status === filterState.status);
    }

    // Filter by Table Search Query
    if (tableState.searchQuery.trim() !== '') {
      const q = tableState.searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return (
          item.id.toLowerCase().includes(q) ||
          item.route.toLowerCase().includes(q) ||
          item.airline.toLowerCase().includes(q) ||
          item.class.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q) ||
          item.channel.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          String(item.fare).includes(q)
        );
      });
    }

    filteredBookings = result;

    // Update Counter Badges
    updateFilterCounters();

    // Trigger downstream visual components
    computeKPIs(filteredBookings);
    renderDestinationStrip(filteredBookings);
    generateInsights(filteredBookings);
    renderCharts(filteredBookings);
    
    // Reset table to page 1 whenever filters change
    tableState.currentPage = 1;
    renderTable();
  }

  /**
   * Updates filter result counts and active filter chips
   */
  function updateFilterCounters() {
    const filteredCountEl = document.getElementById('filteredCount');
    const totalCountEl = document.getElementById('totalCount');
    const tableRecordCountEl = document.getElementById('tableRecordCount');
    const activeTagsEl = document.getElementById('activeFilterTags');

    if (filteredCountEl) filteredCountEl.textContent = filteredBookings.length.toLocaleString();
    if (totalCountEl) totalCountEl.textContent = rawMockBookings.length.toLocaleString();
    if (tableRecordCountEl) tableRecordCountEl.textContent = `${filteredBookings.length.toLocaleString()} matching records`;

    if (!activeTagsEl) return;
    activeTagsEl.innerHTML = '';

    const activeChips = [];
    if (filterState.route !== 'ALL') activeChips.push(`Corridor: ${filterState.route}`);
    if (filterState.airline !== 'ALL') activeChips.push(`Carrier: ${filterState.airline}`);
    if (filterState.cabinClass !== 'ALL') activeChips.push(`Class: ${filterState.cabinClass}`);
    if (filterState.status !== 'ALL') activeChips.push(`Status: ${filterState.status}`);
    if (filterState.startDate || filterState.endDate) {
      activeChips.push(`Date: ${filterState.startDate || 'Start'} → ${filterState.endDate || 'Now'}`);
    }

    if (activeChips.length === 0) {
      activeTagsEl.innerHTML = '<span class="filter-tag">All Filters Active</span>';
    } else {
      activeChips.forEach(chipText => {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        tag.textContent = chipText;
        activeTagsEl.appendChild(tag);
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. KPI METRICS COMPUTATION ENGINE
  // --------------------------------------------------------------------------
  /**
   * Computes primary executive metrics and period-over-period percentage deltas
   * @param {Array<Object>} currentList Active filtered dataset
   */
  function computeKPIs(currentList) {
    if (!currentList || currentList.length === 0) {
      setKPIZeroState();
      return;
    }

    // 1. Total Revenue (Confirmed & Pending count towards pipeline revenue)
    const revenueEligible = currentList.filter(b => b.status !== 'Cancelled');
    const totalRevenue = revenueEligible.reduce((acc, b) => acc + b.fare, 0);

    // 2. Total Bookings
    const totalBookings = currentList.length;

    // 3. Average Fare per booking
    const avgFare = totalBookings > 0 ? Math.round(totalRevenue / (revenueEligible.length || 1)) : 0;

    // 4. Cancellation Rate
    const cancelledCount = currentList.filter(b => b.status === 'Cancelled').length;
    const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0.0';

    // 5. Passenger Load Factor (Weighted model: confirmed seats vs standard corridor capacity)
    // Realistic aviation range: 76% to 89%
    const totalPax = revenueEligible.reduce((acc, b) => acc + b.passengerCount, 0);
    const capacityEstimate = totalBookings * 2.3;
    const calculatedLoadFactor = Math.min(94.2, Math.max(68.5, ((totalPax / (capacityEstimate || 1)) * 100))).toFixed(1);

    // Calculate comparative deltas (split filtered dataset into recent vs prior half)
    const midpoint = Math.floor(currentList.length / 2);
    const recentHalf = currentList.slice(0, midpoint);
    const priorHalf = currentList.slice(midpoint);

    const recentRev = recentHalf.filter(b => b.status !== 'Cancelled').reduce((a, b) => a + b.fare, 0);
    const priorRev = priorHalf.filter(b => b.status !== 'Cancelled').reduce((a, b) => a + b.fare, 0) || 1;
    const revDelta = (((recentRev - priorRev) / priorRev) * 100).toFixed(1);

    const bookingDelta = priorHalf.length > 0 
      ? (((recentHalf.length - priorHalf.length) / priorHalf.length) * 100).toFixed(1) 
      : '+0.0';

    const recentAvgFare = recentHalf.length ? (recentRev / (recentHalf.length || 1)) : 0;
    const priorAvgFare = priorHalf.length ? (priorRev / (priorHalf.length || 1)) : 1;
    const fareDelta = (((recentAvgFare - priorAvgFare) / priorAvgFare) * 100).toFixed(1);

    const recentCancelPct = recentHalf.length ? (recentHalf.filter(b => b.status === 'Cancelled').length / recentHalf.length) * 100 : 0;
    const priorCancelPct = priorHalf.length ? (priorHalf.filter(b => b.status === 'Cancelled').length / priorHalf.length) * 100 : 0;
    const cancelDelta = (recentCancelPct - priorCancelPct).toFixed(1);

    // Render formatted KPIs to DOM
    document.getElementById('kpiRevenueVal').textContent = `$${totalRevenue.toLocaleString()}`;
    updateDeltaUI('kpiRevenueDelta', 'kpiRevenueDeltaText', revDelta, true);

    document.getElementById('kpiBookingsVal').textContent = totalBookings.toLocaleString();
    updateDeltaUI('kpiBookingsDelta', 'kpiBookingsDeltaText', bookingDelta, true);

    document.getElementById('kpiAvgFareVal').textContent = `$${avgFare.toLocaleString()}`;
    updateDeltaUI('kpiAvgFareDelta', 'kpiAvgFareDeltaText', fareDelta, true);

    document.getElementById('kpiCancelRateVal').textContent = `${cancellationRate}%`;
    // For cancellation rate, negative delta is an improvement (positive outcome)
    updateDeltaUI('kpiCancelDelta', 'kpiCancelDeltaText', cancelDelta, false);

    document.getElementById('kpiLoadFactorVal').textContent = `${calculatedLoadFactor}%`;
    updateDeltaUI('kpiLoadFactorDelta', 'kpiLoadFactorDeltaText', '+2.4', true);
  }

  function setKPIZeroState() {
    document.getElementById('kpiRevenueVal').textContent = '$0';
    document.getElementById('kpiBookingsVal').textContent = '0';
    document.getElementById('kpiAvgFareVal').textContent = '$0';
    document.getElementById('kpiCancelRateVal').textContent = '0.0%';
    document.getElementById('kpiLoadFactorVal').textContent = '0.0%';
  }

  function updateDeltaUI(containerId, textId, deltaVal, higherIsBetter) {
    const container = document.getElementById(containerId);
    const textEl = document.getElementById(textId);
    if (!container || !textEl) return;

    const num = parseFloat(deltaVal);
    const sign = num > 0 ? '+' : '';
    textEl.textContent = `${sign}${deltaVal}%`;

    container.classList.remove('delta-positive', 'delta-negative', 'delta-neutral');

    if (num === 0 || isNaN(num)) {
      container.classList.add('delta-neutral');
    } else if (higherIsBetter) {
      container.classList.add(num > 0 ? 'delta-positive' : 'delta-negative');
    } else {
      // Lower is better (e.g., cancellations)
      container.classList.add(num < 0 ? 'delta-positive' : 'delta-negative');
    }
  }

  // --------------------------------------------------------------------------
  // 6. TOP DESTINATIONS INSIGHT STRIP
  // --------------------------------------------------------------------------
  /**
   * Renders the 5 top destinations cards with live booking totals
   * @param {Array<Object>} currentList Filtered dataset
   */
  function renderDestinationStrip(currentList) {
    const grid = document.getElementById('destinationsStripGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const routeKeys = Object.keys(ROUTES_META);

    routeKeys.forEach(code => {
      const meta = ROUTES_META[code];
      const routeBookings = currentList.filter(b => b.route === code);
      const confirmedRevenue = routeBookings
        .filter(b => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + b.fare, 0);
      const avgRouteFare = routeBookings.length > 0 
        ? Math.round(confirmedRevenue / (routeBookings.filter(b => b.status !== 'Cancelled').length || 1)) 
        : meta.baseFare;

      const card = document.createElement('div');
      card.className = 'destination-card';
      card.innerHTML = `
        <div class="destination-thumb-wrap">
          <img 
            src="${meta.image}" 
            alt="Skyline and landscape of ${meta.city}" 
            class="destination-thumb" 
            loading="lazy"
            onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\' viewBox=\\'0 0 400 200\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%230d223f\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23d4af37\\' font-size=\\'18\\' font-family=\\'sans-serif\\' text-anchor=\\'middle\\' dy=\\'.3em\\'>${meta.code}</text></svg>';"
          >
          <div class="destination-gradient"></div>
          <span class="destination-code-badge">${meta.code}</span>
          <span class="destination-tag-pill">${meta.tag}</span>
        </div>
        <div class="destination-content">
          <div>
            <h3 class="destination-city-name">${meta.city}</h3>
            <p class="destination-route-label">${meta.name}</p>
          </div>
          <div class="destination-stats-row">
            <div class="destination-stat-item">
              <span class="stat-item-label">Bookings</span>
              <span class="stat-item-val">${routeBookings.length.toLocaleString()}</span>
            </div>
            <div class="destination-stat-item text-right">
              <span class="stat-item-label">Gross Revenue</span>
              <span class="stat-item-val">$${confirmedRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 7. DECISION SUPPORT & STRATEGIC RECOMMENDATIONS ENGINE
  // --------------------------------------------------------------------------
  /**
   * Generates dynamic data-driven insight cards and 3 strategic rule-based directives
   * @param {Array<Object>} currentList Filtered dataset
   */
  function generateInsights(currentList) {
    const insightsGrid = document.getElementById('insightsCardsGrid');
    const recsGrid = document.getElementById('recommendationsGrid');
    if (!insightsGrid || !recsGrid) return;

    if (!currentList || currentList.length === 0) {
      insightsGrid.innerHTML = '<div class="insight-card"><p class="insight-desc">No records found matching active filter set.</p></div>';
      recsGrid.innerHTML = '<div class="rec-card"><p class="rec-body">Adjust your filters to populate decision engine directives.</p></div>';
      return;
    }

    // 1. Calculate Best Performing Route by revenue
    const routeRevMap = {};
    const routeCancelMap = {};
    const routeCountMap = {};

    currentList.forEach(b => {
      routeCountMap[b.route] = (routeCountMap[b.route] || 0) + 1;
      if (b.status !== 'Cancelled') {
        routeRevMap[b.route] = (routeRevMap[b.route] || 0) + b.fare;
      } else {
        routeCancelMap[b.route] = (routeCancelMap[b.route] || 0) + 1;
      }
    });

    let bestRoute = 'CMB-LHR';
    let maxRev = -1;
    for (const [r, rev] of Object.entries(routeRevMap)) {
      if (rev > maxRev) {
        maxRev = rev;
        bestRoute = r;
      }
    }

    // 2. Highest-Cancellation Route (% basis)
    let worstCancelRoute = 'CMB-DXB';
    let maxCancelRate = -1;
    for (const [r, count] of Object.entries(routeCountMap)) {
      const cancels = routeCancelMap[r] || 0;
      const rate = (cancels / count) * 100;
      if (rate > maxCancelRate) {
        maxCancelRate = rate;
        worstCancelRoute = r;
      }
    }

    // 3. Peak Booking Month
    const monthMap = {};
    currentList.forEach(b => {
      const monthKey = b.date.substring(0, 7); // YYYY-MM
      monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
    });

    let peakMonth = '2026-07';
    let peakMonthCount = 0;
    for (const [m, count] of Object.entries(monthMap)) {
      if (count > peakMonthCount) {
        peakMonthCount = count;
        peakMonth = m;
      }
    }
    const peakDateObj = new Date(peakMonth + '-01');
    const peakMonthName = peakDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // 4. Top Revenue Cabin Class
    const classRevMap = {};
    currentList.filter(b => b.status !== 'Cancelled').forEach(b => {
      classRevMap[b.class] = (classRevMap[b.class] || 0) + b.fare;
    });

    let topClass = 'Business';
    let topClassRev = 0;
    for (const [cls, rev] of Object.entries(classRevMap)) {
      if (rev > topClassRev) {
        topClassRev = rev;
        topClass = cls;
      }
    }
    const totalConfirmedRev = Object.values(classRevMap).reduce((a, b) => a + b, 0) || 1;
    const topClassPct = Math.round((topClassRev / totalConfirmedRev) * 100);

    // Render 4 Insight Cards
    insightsGrid.innerHTML = `
      <!-- Card 1: Top Revenue Corridor -->
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-category">Top Revenue Corridor</span>
          <span class="insight-badge badge-gold">Leader</span>
        </div>
        <div class="insight-main-val">${bestRoute} (${ROUTES_META[bestRoute] ? ROUTES_META[bestRoute].city : bestRoute})</div>
        <p class="insight-desc">Generated <span class="insight-metric-highlight">$${maxRev.toLocaleString()}</span> in ticket revenue (${routeCountMap[bestRoute] || 0} bookings).</p>
      </div>

      <!-- Card 2: Highest Cancellation Risk -->
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-category">Highest Cancellation</span>
          <span class="insight-badge" style="background:var(--status-cancelled-bg);color:var(--status-cancelled)">Risk Alert</span>
        </div>
        <div class="insight-main-val">${worstCancelRoute} (${maxCancelRate.toFixed(1)}%)</div>
        <p class="insight-desc">${routeCancelMap[worstCancelRoute] || 0} itinerary cancellations observed. Recommendation triggered below.</p>
      </div>

      <!-- Card 3: Peak Volume Month -->
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-category">Peak Booking Velocity</span>
          <span class="insight-badge" style="background:var(--status-info-bg);color:var(--status-info)">Seasonal Peak</span>
        </div>
        <div class="insight-main-val">${peakMonthName}</div>
        <p class="insight-desc">Recorded <span class="insight-metric-highlight">${peakMonthCount} flights</span>. Summer tourist demand into Sri Lanka.</p>
      </div>

      <!-- Card 4: Top Revenue Cabin Class -->
      <div class="insight-card">
        <div class="insight-header">
          <span class="insight-category">Top Revenue Class</span>
          <span class="insight-badge badge-gold">${topClassPct}% of Total</span>
        </div>
        <div class="insight-main-val">${topClass}</div>
        <p class="insight-desc">Contributed <span class="insight-metric-highlight">$${topClassRev.toLocaleString()}</span> in gross high-margin yields.</p>
      </div>
    `;

    // Render 3 Rule-Based Strategic Directives
    const bestRouteName = ROUTES_META[bestRoute] ? ROUTES_META[bestRoute].name : bestRoute;
    const worstRouteName = ROUTES_META[worstCancelRoute] ? ROUTES_META[worstCancelRoute].name : worstCancelRoute;

    recsGrid.innerHTML = `
      <!-- Recommendation 1: Yield Dynamic Pricing -->
      <div class="rec-card rec-yield">
        <div class="rec-card-top">
          <span class="rec-tag rec-tag-yield">Dynamic Yield Optimization</span>
          <span class="rec-impact-badge">Est. Impact: +$45,000/mo</span>
        </div>
        <h4 class="rec-title">Elevate Business Class Tariffs on ${bestRouteName}</h4>
        <p class="rec-body">
          Sustained seat demand on ${bestRoute} indicates strong inelastic executive traveler load factor. Recommend an algorithmic tariff bump of +8% to +12% on Premium &amp; Business cabins for the upcoming 60-day departures window.
        </p>
        <div class="rec-action-row">
          <span class="rec-confidence">Model Confidence: 94%</span>
          <a href="#adjust-yield" class="rec-action-link" onclick="window.LankaWingsUI.showToast('Routing directive dispatched to Revenue Management System')">
            Apply Tariff Rule &rarr;
          </a>
        </div>
      </div>

      <!-- Recommendation 2: Cancellation Mitigation -->
      <div class="rec-card rec-cancellation">
        <div class="rec-card-top">
          <span class="rec-tag rec-tag-cancel">Churn Mitigation</span>
          <span class="rec-impact-badge">Est. Impact: -4.2% Churn</span>
        </div>
        <h4 class="rec-title">Mitigate Connection Volatility on ${worstRouteName}</h4>
        <p class="rec-body">
          Corridor ${worstCancelRoute} displays an elevated cancellation rate of ${maxCancelRate.toFixed(1)}%, predominantly triggered by tight transit windows at Colombo (CMB). Deploy flexible 24h complimentary rebooking waivers and expand connection buffers by 25 minutes.
        </p>
        <div class="rec-action-row">
          <span class="rec-confidence">Model Confidence: 89%</span>
          <a href="#rebooking-rule" class="rec-action-link" onclick="window.LankaWingsUI.showToast('Waiver policy flagged for Colombo Operations Centre')">
            Enable Buffer Waiver &rarr;
          </a>
        </div>
      </div>

      <!-- Recommendation 3: Direct Channel Acceleration -->
      <div class="rec-card rec-channel">
        <div class="rec-card-top">
          <span class="rec-tag rec-tag-channel">Channel Optimization</span>
          <span class="rec-impact-badge">Est. Savings: $18,400 GDS</span>
        </div>
        <h4 class="rec-title">Incentivize Direct Web &amp; Mobile App Booking Acquisition</h4>
        <p class="rec-body">
          Current Travel Agent / GDS channel share incurs high third-party transaction fees. Introducing 2x SkySerendib loyalty miles and complimentary seat selection on direct app bookings will channel-shift an estimated 15% of bookings away from external GDS aggregators.
        </p>
        <div class="rec-action-row">
          <span class="rec-confidence">Model Confidence: 91%</span>
          <a href="#campaign-rule" class="rec-action-link" onclick="window.LankaWingsUI.showToast('Promotional loyalty tier queued for digital marketing')">
            Launch Campaign &rarr;
          </a>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 8. CHART.JS VISUALIZATIONS ENGINE
  // --------------------------------------------------------------------------
  /**
   * Helper to fetch Chart.js styling tokens based on active theme
   */
  function getChartThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
      tooltipBg: isDark ? '#0c1a2d' : '#ffffff',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      tooltipBorder: isDark ? 'rgba(212, 175, 55, 0.3)' : '#cbd5e1'
    };
  }

  /**
   * Destroys and safely recreates all 6 analytical charts with filtered data
   * @param {Array<Object>} currentList Active filtered dataset
   */
  function renderCharts(currentList) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js CDN is loading or unavailable.');
      return;
    }

    const theme = getChartThemeColors();
    const confirmedList = currentList.filter(b => b.status !== 'Cancelled');

    // Chart Global Defaults
    Chart.defaults.color = theme.textColor;
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.font.size = 11;

    // ------------------------------------------------------------------------
    // Chart 1: Monthly Revenue Performance Trend (Smooth Area Line)
    // ------------------------------------------------------------------------
    const monthlyRevCanvas = document.getElementById('revenueTrendChart');
    if (monthlyRevCanvas) {
      if (chartInstances.revenueTrend) chartInstances.revenueTrend.destroy();

      // Aggregate revenue by YYYY-MM
      const monthsMap = {};
      // Seed with last 12 chronological months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(2026, 9 - i, 1);
        const k = d.toISOString().substring(0, 7);
        monthsMap[k] = 0;
      }

      confirmedList.forEach(b => {
        const k = b.date.substring(0, 7);
        if (monthsMap[k] !== undefined) {
          monthsMap[k] += b.fare;
        } else {
          monthsMap[k] = b.fare;
        }
      });

      const sortedMonths = Object.keys(monthsMap).sort();
      const labels = sortedMonths.map(m => {
        const d = new Date(m + '-01');
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
      const dataPoints = sortedMonths.map(m => monthsMap[m]);

      const ctx = monthlyRevCanvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(212, 175, 55, 0.45)');
      gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

      chartInstances.revenueTrend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Monthly Revenue ($)',
            data: dataPoints,
            borderColor: '#d4af37',
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#d4af37',
            pointBorderColor: '#071324',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (ctx) => ` Gross Revenue: $${Number(ctx.raw).toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor, drawBorder: false },
              ticks: { color: theme.textColor }
            },
            y: {
              grid: { color: theme.gridColor, drawBorder: false },
              ticks: {
                color: theme.textColor,
                callback: (val) => `$${(val / 1000).toFixed(0)}k`
              }
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // Chart 2: Top Routes Revenue & Volume (Bar)
    // ------------------------------------------------------------------------
    const routesCanvas = document.getElementById('routesBarChart');
    if (routesCanvas) {
      if (chartInstances.routesBar) chartInstances.routesBar.destroy();

      const routeTotals = {};
      Object.keys(ROUTES_META).forEach(r => { routeTotals[r] = 0; });
      confirmedList.forEach(b => {
        if (routeTotals[b.route] !== undefined) routeTotals[b.route] += b.fare;
      });

      const routeLabels = Object.keys(routeTotals);
      const routeData = routeLabels.map(r => routeTotals[r]);

      chartInstances.routesBar = new Chart(routesCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: routeLabels,
          datasets: [{
            label: 'Revenue ($ USD)',
            data: routeData,
            backgroundColor: [
              '#d4af37',
              '#38bdf8',
              '#10b981',
              '#a855f7',
              '#f59e0b'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              callbacks: {
                title: (items) => {
                  const key = items[0].label;
                  return `${key} - ${ROUTES_META[key] ? ROUTES_META[key].city : ''}`;
                },
                label: (ctx) => ` Revenue: $${Number(ctx.raw).toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: theme.textColor, font: { weight: 'bold' } }
            },
            y: {
              grid: { color: theme.gridColor, drawBorder: false },
              ticks: {
                color: theme.textColor,
                callback: (val) => `$${(val / 1000).toFixed(0)}k`
              }
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // Chart 3: Cabin Class Revenue Share (Doughnut)
    // ------------------------------------------------------------------------
    const classCanvas = document.getElementById('classDoughnutChart');
    if (classCanvas) {
      if (chartInstances.classDoughnut) chartInstances.classDoughnut.destroy();

      const classTotals = { 'Economy': 0, 'Premium Economy': 0, 'Business': 0, 'First Class': 0 };
      confirmedList.forEach(b => {
        if (classTotals[b.class] !== undefined) classTotals[b.class] += b.fare;
      });

      chartInstances.classDoughnut = new Chart(classCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Economy', 'Premium Economy', 'Business', 'First Class'],
          datasets: [{
            data: [
              classTotals['Economy'],
              classTotals['Premium Economy'],
              classTotals['Business'],
              classTotals['First Class']
            ],
            backgroundColor: ['#64748b', '#38bdf8', '#c084fc', '#d4af37'],
            borderWidth: 2,
            borderColor: theme.tooltipBg
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme.textColor,
                boxWidth: 12,
                padding: 14
              }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              callbacks: {
                label: (ctx) => {
                  const val = Number(ctx.raw);
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                  const pct = ((val / total) * 100).toFixed(1);
                  return ` ${ctx.label}: $${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // Chart 4: Sales Channel Breakdown (Pie)
    // ------------------------------------------------------------------------
    const channelCanvas = document.getElementById('channelPieChart');
    if (channelCanvas) {
      if (chartInstances.channelPie) chartInstances.channelPie.destroy();

      const channelCounts = {};
      CHANNELS.forEach(c => { channelCounts[c] = 0; });
      currentList.forEach(b => {
        if (channelCounts[b.channel] !== undefined) channelCounts[b.channel]++;
      });

      chartInstances.channelPie = new Chart(channelCanvas.getContext('2d'), {
        type: 'pie',
        data: {
          labels: CHANNELS,
          datasets: [{
            data: CHANNELS.map(c => channelCounts[c]),
            backgroundColor: [
              '#d4af37',
              '#10b981',
              '#f43f5e',
              '#38bdf8',
              '#a855f7'
            ],
            borderWidth: 2,
            borderColor: theme.tooltipBg
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme.textColor,
                boxWidth: 12,
                padding: 10
              }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                  const pct = ((ctx.raw / total) * 100).toFixed(1);
                  return ` ${ctx.label}: ${ctx.raw} bookings (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // Chart 5: Booking Status by Corridor (Stacked Bar)
    // ------------------------------------------------------------------------
    const statusCanvas = document.getElementById('statusStackedChart');
    if (statusCanvas) {
      if (chartInstances.statusStacked) chartInstances.statusStacked.destroy();

      const routeKeys = Object.keys(ROUTES_META);
      const confirmedCounts = [];
      const pendingCounts = [];
      const cancelledCounts = [];

      routeKeys.forEach(r => {
        const routeItems = currentList.filter(b => b.route === r);
        confirmedCounts.push(routeItems.filter(b => b.status === 'Confirmed').length);
        pendingCounts.push(routeItems.filter(b => b.status === 'Pending').length);
        cancelledCounts.push(routeItems.filter(b => b.status === 'Cancelled').length);
      });

      chartInstances.statusStacked = new Chart(statusCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: routeKeys,
          datasets: [
            {
              label: 'Confirmed',
              data: confirmedCounts,
              backgroundColor: '#10b981'
            },
            {
              label: 'Pending',
              data: pendingCounts,
              backgroundColor: '#f59e0b'
            },
            {
              label: 'Cancelled',
              data: cancelledCounts,
              backgroundColor: '#f43f5e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: theme.textColor, boxWidth: 12 }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { color: theme.textColor, font: { weight: 'bold' } }
            },
            y: {
              stacked: true,
              grid: { color: theme.gridColor, drawBorder: false },
              ticks: { color: theme.textColor }
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // Chart 6: Revenue by Operating Division (Horizontal Bar)
    // ------------------------------------------------------------------------
    const airlineCanvas = document.getElementById('airlineBarChart');
    if (airlineCanvas) {
      if (chartInstances.airlineBar) chartInstances.airlineBar.destroy();

      const airlineRev = {};
      AIRLINES.forEach(a => { airlineRev[a] = 0; });
      confirmedList.forEach(b => {
        if (airlineRev[b.airline] !== undefined) airlineRev[b.airline] += b.fare;
      });

      chartInstances.airlineBar = new Chart(airlineCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: AIRLINES,
          datasets: [{
            label: 'Division Revenue ($)',
            data: AIRLINES.map(a => airlineRev[a]),
            backgroundColor: ['#d4af37', '#38bdf8', '#10b981'],
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleColor: theme.tooltipText,
              bodyColor: theme.tooltipText,
              borderColor: theme.tooltipBorder,
              borderWidth: 1,
              callbacks: {
                label: (ctx) => ` Revenue: $${Number(ctx.raw).toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor, drawBorder: false },
              ticks: {
                color: theme.textColor,
                callback: (val) => `$${(val / 1000).toFixed(0)}k`
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: theme.textColor, font: { size: 10 } }
            }
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 9. MASTER DATA TABLE & PAGINATION ENGINE
  // --------------------------------------------------------------------------
  /**
   * Sorts the filtered array, slices current page window, and updates the table DOM
   */
  function renderTable() {
    const tbody = document.getElementById('bookingsTableBody');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    if (!tbody) return;

    // 1. Sort Data
    const sorted = [...filteredBookings].sort((a, b) => {
      let valA = a[tableState.sortColumn];
      let valB = b[tableState.sortColumn];

      if (tableState.sortColumn === 'fare' || tableState.sortColumn === 'passengerCount') {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return tableState.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return tableState.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // 2. Pagination Slice
    const totalRecords = sorted.length;
    const totalPages = Math.ceil(totalRecords / tableState.rowsPerPage) || 1;

    if (tableState.currentPage > totalPages) {
      tableState.currentPage = totalPages;
    }

    const startIndex = (tableState.currentPage - 1) * tableState.rowsPerPage;
    const endIndex = Math.min(startIndex + tableState.rowsPerPage, totalRecords);
    const pageRows = sorted.slice(startIndex, endIndex);

    // 3. Render Table Rows
    tbody.innerHTML = '';
    if (pageRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No flight bookings match the active query. Try resetting or adjusting your filter criteria.
          </td>
        </tr>
      `;
    } else {
      pageRows.forEach(row => {
        const tr = document.createElement('tr');

        // Class badge style
        let classBadgeCls = 'class-economy';
        if (row.class === 'First Class') classBadgeCls = 'class-first';
        else if (row.class === 'Business') classBadgeCls = 'class-business';
        else if (row.class === 'Premium Economy') classBadgeCls = 'class-premium';

        // Status badge style
        let statusBadgeCls = 'status-confirmed-pill';
        if (row.status === 'Cancelled') statusBadgeCls = 'status-cancelled-pill';
        else if (row.status === 'Pending') statusBadgeCls = 'status-pending-pill';

        tr.innerHTML = `
          <td class="booking-id-cell">${row.id}</td>
          <td>${row.date}</td>
          <td><span class="route-pill-cell">${row.route}</span></td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${row.airline}</td>
          <td><span class="class-badge ${classBadgeCls}">${row.class}</span></td>
          <td class="text-center font-bold">${row.passengerCount}</td>
          <td class="text-right" style="font-weight:700; font-family:var(--font-mono); color:var(--brand-gold-500);">$${row.fare.toLocaleString()}</td>
          <td style="font-size:0.8rem;">${row.channel}</td>
          <td class="text-center">
            <span class="status-pill ${statusBadgeCls}">
              <span class="status-dot"></span>
              ${row.status}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 4. Update Header Sort Arrows
    document.querySelectorAll('.sortable-th').forEach(th => {
      const col = th.getAttribute('data-column');
      th.classList.remove('sort-asc', 'sort-desc');
      const indicator = th.querySelector('.sort-indicator');

      if (col === tableState.sortColumn) {
        th.classList.add(tableState.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        if (indicator) indicator.textContent = tableState.sortDirection === 'asc' ? '▲' : '▼';
      } else {
        if (indicator) indicator.textContent = '⇅';
      }
    });

    // 5. Update Pagination Info Text
    if (paginationInfo) {
      if (totalRecords === 0) {
        paginationInfo.textContent = 'Showing 0 to 0 of 0 entries';
      } else {
        paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords.toLocaleString()} entries`;
      }
    }

    // 6. Render Pagination Buttons
    if (paginationControls) {
      paginationControls.innerHTML = '';

      // Previous Button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.innerHTML = '&lsaquo; Prev';
      prevBtn.disabled = tableState.currentPage === 1;
      prevBtn.addEventListener('click', () => {
        if (tableState.currentPage > 1) {
          tableState.currentPage--;
          renderTable();
        }
      });
      paginationControls.appendChild(prevBtn);

      // Page numbers (smart window with ellipsis)
      const maxButtons = 5;
      let startPage = Math.max(1, tableState.currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);

      if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }

      if (startPage > 1) {
        const p1 = document.createElement('button');
        p1.className = 'page-btn';
        p1.textContent = '1';
        p1.addEventListener('click', () => { tableState.currentPage = 1; renderTable(); });
        paginationControls.appendChild(p1);

        if (startPage > 2) {
          const ellipsis = document.createElement('span');
          ellipsis.style.padding = '0 4px';
          ellipsis.style.color = 'var(--text-subtle)';
          ellipsis.textContent = '...';
          paginationControls.appendChild(ellipsis);
        }
      }

      for (let p = startPage; p <= endPage; p++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${p === tableState.currentPage ? 'active' : ''}`;
        pageBtn.textContent = p;
        pageBtn.addEventListener('click', () => {
          tableState.currentPage = p;
          renderTable();
        });
        paginationControls.appendChild(pageBtn);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsis = document.createElement('span');
          ellipsis.style.padding = '0 4px';
          ellipsis.style.color = 'var(--text-subtle)';
          ellipsis.textContent = '...';
          paginationControls.appendChild(ellipsis);
        }

        const pLast = document.createElement('button');
        pLast.className = 'page-btn';
        pLast.textContent = totalPages;
        pLast.addEventListener('click', () => { tableState.currentPage = totalPages; renderTable(); });
        paginationControls.appendChild(pLast);
      }

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.innerHTML = 'Next &rsaquo;';
      nextBtn.disabled = tableState.currentPage >= totalPages;
      nextBtn.addEventListener('click', () => {
        if (tableState.currentPage < totalPages) {
          tableState.currentPage++;
          renderTable();
        }
      });
      paginationControls.appendChild(nextBtn);
    }
  }

  // --------------------------------------------------------------------------
  // 10. CSV EXPORT ENGINE
  // --------------------------------------------------------------------------
  /**
   * Generates a downloadable CSV formatted file from the current filtered data
   */
  function exportCSV() {
    if (!filteredBookings || filteredBookings.length === 0) {
      showToast('No booking records to export.');
      return;
    }

    const headers = ['Booking_ID', 'Date', 'Route', 'Airline', 'Class', 'Passengers', 'Total_Fare_USD', 'Channel', 'Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    filteredBookings.forEach(row => {
      const values = [
        `"${row.id}"`,
        `"${row.date}"`,
        `"${row.route}"`,
        `"${row.airline}"`,
        `"${row.class}"`,
        row.passengerCount,
        row.fare,
        `"${row.channel}"`,
        `"${row.status}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `lanka_wings_analytics_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Successfully exported ${filteredBookings.length.toLocaleString()} bookings to CSV`);
  }

  // --------------------------------------------------------------------------
  // 11. UI INTERACTIONS, TOAST NOTIFIER & THEME SYSTEM
  // --------------------------------------------------------------------------
  /**
   * Displays transient toast notification in bottom corner
   * @param {string} message Text to display
   */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--brand-gold-500);flex-shrink:0;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    // Trigger slide in
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3800);
  }

  /**
   * Sets up Dark / Light mode toggle with localStorage persistence
   */
  function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const root = document.documentElement;

    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('lw_theme');
    if (savedTheme) {
      root.setAttribute('data-theme', savedTheme);
    } else {
      // Default dark theme for high-end analytics look
      root.setAttribute('data-theme', 'dark');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', nextTheme);
        localStorage.setItem('lw_theme', nextTheme);

        // Re-render Chart.js colors to reflect new theme
        renderCharts(filteredBookings);
        showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} theme`);
      });
    }
  }

  /**
   * Sets up Sticky Navbar scroll transition
   */
  function setupNavbarScroll() {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;

    const handleScroll = () => {
      if (window.scrollY > 35) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
  }

  /**
   * Sets up Mobile Navigation Drawer & Backdrop
   */
  function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const closeBtn = document.getElementById('drawerCloseBtn');
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('drawerBackdrop');

    const openDrawer = () => {
      if (drawer && backdrop) {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeDrawer = () => {
      if (drawer && backdrop) {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    };

    if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Close drawer when mobile nav links are clicked
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }

  /**
   * Sets up Language Selector Pill Buttons
   */
  function setupLanguageSelector() {
    const langBtns = document.querySelectorAll('.lang-btn, .lang-pill');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedLang = e.currentTarget.getAttribute('data-lang');
        document.querySelectorAll('.lang-btn, .lang-pill').forEach(b => {
          if (b.getAttribute('data-lang') === selectedLang) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        showToast(`Language switched to: ${selectedLang}`);
      });
    });
  }

  /**
   * Wires all Filter control inputs, date pickers, presets, table search & sort
   */
  function setupEventHandlers() {
    // 1. Date Range Presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    const startInput = document.getElementById('startDateInput');
    const endInput = document.getElementById('endDateInput');

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.getAttribute('data-preset');
        filterState.datePreset = preset;

        const now = new Date(2026, 9, 28); // Reference date 28 Oct 2026
        let start = null;

        if (preset === '30d') {
          start = new Date(now);
          start.setDate(now.getDate() - 30);
        } else if (preset === '90d') {
          start = new Date(now);
          start.setDate(now.getDate() - 90);
        } else if (preset === 'ytd') {
          start = new Date(2026, 0, 1);
        }

        if (start) {
          filterState.startDate = start.toISOString().split('T')[0];
          filterState.endDate = now.toISOString().split('T')[0];
          if (startInput) startInput.value = filterState.startDate;
          if (endInput) endInput.value = filterState.endDate;
        } else {
          filterState.startDate = '';
          filterState.endDate = '';
          if (startInput) startInput.value = '';
          if (endInput) endInput.value = '';
        }

        applyFilters();
      });
    });

    // Custom Date Inputs
    if (startInput) {
      startInput.addEventListener('change', (e) => {
        filterState.startDate = e.target.value;
        presetBtns.forEach(b => b.classList.remove('active'));
        applyFilters();
      });
    }

    if (endInput) {
      endInput.addEventListener('change', (e) => {
        filterState.endDate = e.target.value;
        presetBtns.forEach(b => b.classList.remove('active'));
        applyFilters();
      });
    }

    // Dropdown Filters
    const routeSelect = document.getElementById('routeSelect');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        filterState.route = e.target.value;
        applyFilters();
      });
    }

    const airlineSelect = document.getElementById('airlineSelect');
    if (airlineSelect) {
      airlineSelect.addEventListener('change', (e) => {
        filterState.airline = e.target.value;
        applyFilters();
      });
    }

    const classSelect = document.getElementById('classSelect');
    if (classSelect) {
      classSelect.addEventListener('change', (e) => {
        filterState.cabinClass = e.target.value;
        applyFilters();
      });
    }

    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        filterState.status = e.target.value;
        applyFilters();
      });
    }

    // Reset Filters Button
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        filterState = {
          datePreset: 'all',
          startDate: '',
          endDate: '',
          route: 'ALL',
          airline: 'ALL',
          cabinClass: 'ALL',
          status: 'ALL'
        };

        if (routeSelect) routeSelect.value = 'ALL';
        if (airlineSelect) airlineSelect.value = 'ALL';
        if (classSelect) classSelect.value = 'ALL';
        if (statusSelect) statusSelect.value = 'ALL';
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';

        presetBtns.forEach(b => {
          if (b.getAttribute('data-preset') === 'all') b.classList.add('active');
          else b.classList.remove('active');
        });

        tableState.searchQuery = '';
        const searchInput = document.getElementById('tableSearchInput');
        if (searchInput) searchInput.value = '';

        applyFilters();
        showToast('All filter parameters reset to default');
      });
    }

    // Table Search Input (Instant Live Search)
    const tableSearch = document.getElementById('tableSearchInput');
    if (tableSearch) {
      tableSearch.addEventListener('input', (e) => {
        tableState.searchQuery = e.target.value;
        applyFilters();
      });
    }

    // Rows Per Page Select
    const rowsSelect = document.getElementById('rowsPerPageSelect');
    if (rowsSelect) {
      rowsSelect.addEventListener('change', (e) => {
        tableState.rowsPerPage = Number(e.target.value);
        tableState.currentPage = 1;
        renderTable();
      });
    }

    // Sortable Table Column Headers
    document.querySelectorAll('.sortable-th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-column');
        if (tableState.sortColumn === col) {
          tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          tableState.sortColumn = col;
          tableState.sortDirection = 'asc';
        }
        renderTable();
      });
    });

    // Export CSV Button
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportCSV);
    }
  }

  // --------------------------------------------------------------------------
  // 12. INITIALIZATION SEQUENCE
  // --------------------------------------------------------------------------
  async function init() {
    setupThemeToggle();
    setupNavbarScroll();
    setupMobileMenu();
    setupLanguageSelector();
    setupEventHandlers();

    // Fetch initial dataset
    try {
      rawMockBookings = await fetchData();
      filteredBookings = [...rawMockBookings];

      // Populate Initial Views
      computeKPIs(filteredBookings);
      renderDestinationStrip(filteredBookings);
      generateInsights(filteredBookings);
      renderCharts(filteredBookings);
      renderTable();
      updateFilterCounters();

      // Expose helpers globally if needed for testing or toast callbacks
      window.LankaWingsUI = {
        showToast: showToast,
        exportCSV: exportCSV,
        getFilteredBookings: () => filteredBookings,
        getRawBookings: () => rawMockBookings
      };

    } catch (err) {
      console.error('Lanka Wings Analytics Initialization failed:', err);
    }
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
