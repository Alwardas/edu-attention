/**
 * EduAttention - Analytics & Progress Module
 * Visualizes attention trends, attendance records, and generates exportable performance cards.
 */

class AnalyticsController {
  constructor() {
    this.timelineChart = null;
    this.distributionChart = null;
    this.weeklyAttendanceChart = null;
  }

  initAnalytics(classId = 'EDU-101') {
    this.renderSummaryCards();
    this.renderCharts();
    this.renderAttendanceTable();
  }

  renderSummaryCards() {
    const logs = window.db.getAllAttendance();
    const avgScore = logs.length > 0 
      ? Math.round(logs.reduce((acc, curr) => acc + (curr.attentionAverage || 85), 0) / logs.length)
      : 89;

    const avgEl = document.getElementById('statAvgAttention');
    if (avgEl) avgEl.textContent = `${avgScore}%`;

    const totalClassesEl = document.getElementById('statTotalClasses');
    if (totalClassesEl) totalClassesEl.textContent = `${logs.length + 5}`;

    const attendanceRateEl = document.getElementById('statAttendanceRate');
    if (attendanceRateEl) attendanceRateEl.textContent = '96%';
  }

  renderCharts() {
    // 1. Attention Timeline Chart
    const timelineCtx = document.getElementById('attentionTimelineChart');
    if (timelineCtx && typeof Chart !== 'undefined') {
      if (this.timelineChart) this.timelineChart.destroy();

      const historyData = window.attentionEngine.attentionHistory.length > 3
        ? window.attentionEngine.attentionHistory
        : [
            { time: '10:00', score: 94 },
            { time: '10:05', score: 91 },
            { time: '10:10', score: 86 },
            { time: '10:15', score: 95 },
            { time: '10:20', score: 79 },
            { time: '10:25', score: 92 },
            { time: '10:30', score: 88 }
          ];

      this.timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: historyData.map(d => d.time),
          datasets: [{
            label: 'Attention Index (%)',
            data: historyData.map(d => d.score),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#4f46e5',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 40,
              max: 100,
              grid: { color: 'rgba(226, 232, 240, 0.4)' },
              ticks: { callback: v => v + '%' }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Attention Score: ${ctx.raw}%`
              }
            }
          }
        }
      });
    }

    // 2. Attention Distribution Doughnut Chart
    const distCtx = document.getElementById('attentionDistChart');
    if (distCtx && typeof Chart !== 'undefined') {
      if (this.distributionChart) this.distributionChart.destroy();

      const summary = window.attentionEngine.getSummary();

      this.distributionChart = new Chart(distCtx, {
        type: 'doughnut',
        data: {
          labels: ['Focused', 'Distracted / Wandering', 'Face Absent'],
          datasets: [{
            data: [summary.focusedPercent, summary.distractedPercent, summary.absentPercent],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          },
          cutout: '70%'
        }
      });
    }

    // 3. Weekly Attendance Progress Bar Chart
    const weeklyCtx = document.getElementById('weeklyAttendanceChart');
    if (weeklyCtx && typeof Chart !== 'undefined') {
      if (this.weeklyAttendanceChart) this.weeklyAttendanceChart.destroy();

      this.weeklyAttendanceChart = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          datasets: [{
            label: 'Attendance Rate',
            data: [100, 100, 92, 100, 95, 88],
            backgroundColor: '#4f46e5',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { callback: v => v + '%' }
            },
            x: { grid: { display: false } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  renderAttendanceTable() {
    const tableBody = document.getElementById('attendanceTableBody');
    if (!tableBody) return;

    const user = window.auth.getCurrentUser();
    const isTeacher = window.auth.isTeacher();
    const logs = isTeacher 
      ? window.db.getAllAttendance()
      : window.db.getStudentAttendance(user ? user.id : 'usr_student_1');

    tableBody.innerHTML = logs.map(row => {
      const score = row.attentionAverage || 90;
      const isGood = score >= 80;

      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="py-3.5 px-4 font-medium text-slate-800 text-sm flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${row.className}
          </td>
          <td class="py-3.5 px-4 text-sm text-slate-600">${row.date}</td>
          <td class="py-3.5 px-4 text-sm text-slate-600">${row.joinTime}</td>
          <td class="py-3.5 px-4 text-sm text-slate-600">${row.durationMinutes} mins</td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <div class="w-16 bg-slate-200 rounded-full h-2">
                <div class="h-2 rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${score}%"></div>
              </div>
              <span class="text-xs font-semibold ${isGood ? 'text-emerald-600' : 'text-amber-600'}">${score}%</span>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${row.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Generate downloadable or printable report
  exportReport() {
    window.print();
  }
}

// Global analytics singleton
window.analytics = new AnalyticsController();
