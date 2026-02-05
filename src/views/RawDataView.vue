<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTogglStore } from '@/stores/togglStore'
// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { FilterMatchMode } from '@primevue/core/api'

const togglStore = useTogglStore()

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// Prepare data for the table
const tableData = computed(() => {
  return togglStore.timeEntries.map((e) => {
    const p = togglStore.projects.find((p) => p.id === e.pid)
    return {
      ...e,
      projectName: p?.name || '',
      projectColor: p?.color || '#9ca3af',
      dateObj: new Date(e.start), // Helper for sorting
    }
  })
})

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatDate(date: Date) {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="view-container">
    <div class="card">
      <DataTable
        v-model:filters="filters"
        :value="tableData"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        dataKey="id"
        :loading="togglStore.isLoading"
        :globalFilterFields="['description', 'client', 'projectName']"
        sortField="dateObj"
        :sortOrder="-1"
        class="p-datatable-sm"
        stripedRows
        removableSort
      >
        <template #header>
          <div class="flex-header">
            <span class="title">Raw Data</span>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="filters['global'].value" placeholder="Search..." />
            </IconField>
          </div>
        </template>
        <template #empty> No entries found. </template>
        <template #loading> Loading data. Please wait. </template>

        <Column field="dateObj" header="Date & Time" sortable style="width: 200px">
          <template #body="{ data }">
            {{ formatDate(data.dateObj) }}
          </template>
        </Column>

        <Column field="client" header="Client" sortable style="width: 15%"></Column>

        <Column field="projectName" header="Project" sortable style="width: 20%">
          <template #body="{ data }">
            <span :style="{ color: data.projectColor, fontWeight: 'bold' }">
              {{ data.projectName }}
            </span>
          </template>
        </Column>

        <Column field="description" header="Description" sortable></Column>

        <Column field="duration" header="Duration" sortable style="width: 120px; text-align: right">
          <template #body="{ data }">
            <span class="font-mono">{{ formatDuration(data.duration) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
}
</style>
