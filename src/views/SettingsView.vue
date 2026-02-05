<script setup lang="ts">
import { useTogglStore } from '@/stores/togglStore'

const togglStore = useTogglStore()

const exportData = () => {
  if (togglStore.timeEntries.length === 0) {
    alert('No data to export')
    return
  }

  // Convert back to CSV format compatible with our parser
  const headers = [
    'User',
    'Email',
    'Client',
    'Project',
    'Task',
    'Description',
    'Billable',
    'Start date',
    'Start time',
    'End date',
    'End time',
    'Duration',
    'Tags',
  ]

  const rows = togglStore.timeEntries.map((entry) => {
    const startDate = new Date(entry.start)
    const endDate = new Date(entry.stop)
    const project = togglStore.projects.find((p) => p.id === entry.pid)

    // Format helper
    const dateStr = (d: Date) => d.toISOString().split('T')[0]
    const timeStr = (d: Date) => d.toTimeString().split(' ')[0]
    const durStr = (sec: number) => {
      const h = Math.floor(sec / 3600)
        .toString()
        .padStart(2, '0')
      const m = Math.floor((sec % 3600) / 60)
        .toString()
        .padStart(2, '0')
      const s = (sec % 60).toString().padStart(2, '0')
      return `${h}:${m}:${s}`
    }

    return [
      'User', // Placeholder
      'user@example.com', // Placeholder
      '', // Client
      project ? project.name : '',
      '', // Task
      entry.description,
      'No', // Billable
      dateStr(startDate),
      timeStr(startDate),
      dateStr(endDate),
      timeStr(endDate),
      durStr(entry.duration),
      (entry.tags || []).join(', '),
    ]
      .map((v) => `"${v}"`)
      .join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `toggl_export_${new Date().getFullYear()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="settings">
    <h1>Settings</h1>

    <div class="section">
      <h2>Data Management</h2>
      <p>Your dashboard is showing consolidated data from <code>data.csv</code>.</p>

      <div class="info-box">
        <h3>Download Data</h3>
        <p>Export the currently loaded data to a CSV file (compatible with this dashboard).</p>
        <button @click="exportData" class="btn-primary">Export CSV</button>
      </div>
    </div>

    <div class="section">
      <h2>Automatic Updates</h2>
      <p>You can run the update script locally on your computer to refresh the data on GitHub.</p>
      <ol>
        <li>Create a <code>.env</code> file in the project root with your API keys.</li>
        <li>Run <code>npm run sync</code> in your terminal.</li>
        <li>The script will fetch data and push changes to GitHub automatically.</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.section {
  margin-bottom: 3rem;
}

.info-box {
  background-color: #f3f4f6;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
}

.btn-primary {
  background-color: #e57cd8;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #d946ef;
}

code {
  background-color: #e5e7eb;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

ol {
  line-height: 1.6;
  margin-top: 1rem;
}

li {
  margin-bottom: 0.5rem;
}
</style>
