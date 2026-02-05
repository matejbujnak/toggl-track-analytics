<script setup lang="ts">
import { useTogglStore } from '@/stores/togglStore'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { formatDuration } from '@/utils/formatters'

const togglStore = useTogglStore()
const { timeEntries, isLoading, error, entryCount, totalDuration, lastUpdated } =
  storeToRefs(togglStore)

onMounted(() => {
  // Načítame dáta hneď pri štarte dashboardu
  if (timeEntries.value.length === 0) {
    togglStore.fetchTimeEntries()
  }
})
</script>

<template>
  <main class="dashboard">
    <div class="header">
      <h1>Dashboard</h1>
      <button @click="togglStore.fetchTimeEntries" :disabled="isLoading">
        {{ isLoading ? 'Loading...' : 'Refresh Data' }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <br />
      <small>Make sure 'data.csv' exists in public/data folder.</small>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="card">
        <h3>Total Entries</h3>
        <div class="value">{{ entryCount }}</div>
      </div>
      <div class="card">
        <h3>Total Time</h3>
        <div class="value">{{ formatDuration(totalDuration) }}</div>
      </div>
      <div class="card">
        <h3>Last Update</h3>
        <div class="value text-sm">{{ lastUpdated || 'Never' }}</div>
      </div>
    </div>

    <!-- Recent Entries Preview -->
    <div class="recent-entries">
      <h2>Recent Data Preview</h2>
      <p v-if="timeEntries.length === 0 && !isLoading">No data found.</p>

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Duration</th>
              <th>Start</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in timeEntries.slice(0, 5)" :key="entry.id">
              <td>{{ entry.description }}</td>
              <td>{{ formatDuration(entry.duration) }}</td>
              <td>{{ new Date(entry.start).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.error-banner {
  background-color: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #111827;
}

.card .text-sm {
  font-size: 1rem;
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background-color: #f9fafb;
  font-weight: 600;
}
</style>
