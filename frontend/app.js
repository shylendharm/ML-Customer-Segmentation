let allCustomers = [];
let chartInstance = null;

async function loadDashboard() {
    const loading = document.getElementById("loading");
    const dashboard = document.getElementById("dashboard");
    
    loading.style.display = "flex";
    dashboard.style.display = "none";
    
    try {
        const res = await fetch("http://localhost:3000/run-model");
        const data = await res.json();

        if (data.error) {
            loading.innerHTML = `<p class="error">Error: ${data.error}</p>`;
            return;
        }

        allCustomers = data;
        loading.style.display = "none";
        dashboard.style.display = "block";

        renderStats();
        renderChart();
        renderClusterCards();
        renderTable(allCustomers);
        setupSearch();

    } catch (err) {
        loading.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }
}

function renderStats() {
    const total = allCustomers.length;
    const clusters = new Set(allCustomers.map(c => c.Cluster));
    const avgIncome = (allCustomers.reduce((sum, c) => sum + c['Annual Income (k$)'], 0) / total).toFixed(1);
    const avgSpending = (allCustomers.reduce((sum, c) => sum + c['Spending Score (1-100)'], 0) / total).toFixed(1);

    document.getElementById("total-customers").textContent = total;
    document.getElementById("total-clusters").textContent = clusters.size;
    document.getElementById("avg-income").textContent = avgIncome;
    document.getElementById("avg-spending").textContent = avgSpending;
}

function renderChart() {
    const ctx = document.getElementById("clusterChart").getContext("2d");
    
    const clusters = {};
    allCustomers.forEach(c => {
        const cluster = c.Cluster;
        if (!clusters[cluster]) clusters[cluster] = { x: [], y: [], colors: [] };
        clusters[cluster].x.push(c['Annual Income (k$)']);
        clusters[cluster].y.push(c['Spending Score (1-100)']);
    });

    const clusterColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const datasets = Object.entries(clusters).map(([cluster, data], i) => ({
        label: `Cluster ${cluster}`,
        data: data.x.map((x, j) => ({ x, y: data.y[j] })),
        backgroundColor: clusterColors[i % clusterColors.length] + '80',
        borderColor: clusterColors[i % clusterColors.length],
        borderWidth: 1
    }));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Customer Clusters by Income vs Spending Score' }
            },
            scales: {
                x: { title: { display: true, text: 'Annual Income (k$)' } },
                y: { title: { display: true, text: 'Spending Score (1-100)' } }
            }
        }
    });
}

function renderClusterCards() {
    const clusters = {};
    allCustomers.forEach(c => {
        const cluster = c.Cluster;
        if (!clusters[cluster]) {
            clusters[cluster] = { count: 0, totalIncome: 0, totalSpending: 0, ages: [] };
        }
        clusters[cluster].count++;
        clusters[cluster].totalIncome += c['Annual Income (k$)'];
        clusters[cluster].totalSpending += c['Spending Score (1-100)'];
        clusters[cluster].ages.push(c['Age']);
    });

    const container = document.getElementById("cluster-cards");
    const clusterColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    let html = '';
    Object.entries(clusters).forEach(([cluster, data], i) => {
        const avgIncome = (data.totalIncome / data.count).toFixed(1);
        const avgSpending = (data.totalSpending / data.count).toFixed(1);
        const avgAge = (data.ages.reduce((a, b) => a + b, 0) / data.count).toFixed(0);
        
        let profile = getClusterProfile(avgIncome, avgSpending);
        
        html += `<div class="cluster-card" style="border-left: 4px solid ${clusterColors[i % clusterColors.length]}">
            <h3>Cluster ${cluster}</h3>
            <div class="cluster-stat"><span>Customers:</span> <strong>${data.count}</strong></div>
            <div class="cluster-stat"><span>Avg Income:</span> <strong>$${avgIncome}k</strong></div>
            <div class="cluster-stat"><span>Avg Spending:</span> <strong>${avgSpending}</strong></div>
            <div class="cluster-stat"><span>Avg Age:</span> <strong>${avgAge}</strong></div>
            <div class="cluster-profile">${profile}</div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function getClusterProfile(avgIncome, avgSpending) {
    if (avgIncome > 60 && avgSpending > 60) return "🎯 High Earners, High Spenders";
    if (avgIncome > 60 && avgSpending < 40) return "💰 High Earners, Low Spenders";
    if (avgIncome < 40 && avgSpending > 60) return "🛍️ Low Earners, High Spenders";
    if (avgIncome < 40 && avgSpending < 40) return "📉 Low Earners, Low Spenders";
    return "📊 Balanced Segment";
}

function renderTable(data) {
    const tbody = document.getElementById("customers-body");
    const clusterColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    tbody.innerHTML = data.map((c, i) => `
        <tr onclick="showModal(${i})" style="cursor: pointer;">
            <td>${c['CustomerID']}</td>
            <td>${c['Genre']}</td>
            <td>${c['Age']}</td>
            <td>${c['Annual Income (k$)']}</td>
            <td>${c['Spending Score (1-100)']}</td>
            <td><span class="cluster-badge" style="background: ${clusterColors[c.Cluster % clusterColors.length]}">${c.Cluster}</span></td>
        </tr>
    `).join('');
}

function setupSearch() {
    document.getElementById("search-input").addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCustomers.filter(c => 
            c['Genre'].toLowerCase().includes(term) ||
            c['Age'].toString().includes(term) ||
            c['Annual Income (k$)'].toString().includes(term) ||
            c['Spending Score (1-100)'].toString().includes(term) ||
            c['Cluster'].toString().includes(term)
        );
        renderTable(filtered);
    });
}

function showModal(index) {
    const c = allCustomers[index];
    const modal = document.getElementById("modal");
    const clusterColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    
    document.getElementById("modal-title").textContent = `Customer #${c['CustomerID']}`;
    document.getElementById("modal-body").innerHTML = `
        <div class="modal-details">
            <div class="detail-row"><span>Gender:</span> <strong>${c['Genre']}</strong></div>
            <div class="detail-row"><span>Age:</span> <strong>${c['Age']}</strong></div>
            <div class="detail-row"><span>Annual Income:</span> <strong>$${c['Annual Income (k$)']}k</strong></div>
            <div class="detail-row"><span>Spending Score:</span> <strong>${c['Spending Score (1-100)']}</strong></div>
            <div class="detail-row"><span>Cluster:</span> <span class="cluster-badge" style="background: ${clusterColors[c.Cluster % clusterColors.length]}">${c.Cluster}</span></div>
        </div>
    `;
    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function exportToCSV() {
    const headers = ['CustomerID', 'Genre', 'Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Cluster'];
    const csv = [
        headers.join(','),
        ...allCustomers.map(c => headers.map(h => c[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_segmentation.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Close modal on outside click
window.onclick = (e) => {
    const modal = document.getElementById("modal");
    if (e.target === modal) closeModal();
};

document.addEventListener("DOMContentLoaded", loadDashboard);
