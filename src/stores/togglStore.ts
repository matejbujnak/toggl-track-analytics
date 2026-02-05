import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimeEntry, Project } from '@/types/toggl'
import { parseCSV } from '@/utils/csvParser'

export const useTogglStore = defineStore('toggl', () => {
  // State
  const timeEntries = ref<TimeEntry[]>([])
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const lastUpdated = ref<string | null>(null)
  const error = ref<string | null>(null)

  // Getters
  const totalDuration = computed(() => {
    return timeEntries.value.reduce((acc, entry) => acc + entry.duration, 0)
  })

  const entryCount = computed(() => timeEntries.value.length)

  // Helper to parse duration "HH:MM:SS" to seconds
  function parseDurationString(durationStr: string): number {
    if (!durationStr) return 0
    const parts = durationStr.split(':')
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    }
    return 0
  }

  // Actions
  async function fetchTimeEntries() {
    isLoading.value = true
    error.value = null

    try {
      const baseUrl = import.meta.env.BASE_URL
      const projectMap = new Map<string, number>()
      let nextProjectId = 1

      // Load the single combined data file
      const response = await fetch(`${baseUrl}data/data.csv?t=${Date.now()}`)

      if (!response.ok) {
        throw new Error(`Failed to load data.csv: ${response.statusText}`)
      }

      const csvText = await response.text()
      const rows = parseCSV(csvText)

      const entries: TimeEntry[] = rows.map((row, index) => {
        // Handle Project Mapping
        let pid = undefined
        if (row.Project) {
          if (!projectMap.has(row.Project)) {
            projectMap.set(row.Project, nextProjectId++)
          }
          pid = projectMap.get(row.Project)
        }

        return {
          id: index + 1,
          description: row.Description || '(No description)',
          start: `${row.StartDate}T${row.StartTime}`,
          stop: `${row.EndDate}T${row.EndTime}`,
          duration: parseDurationString(row.Duration),
          pid: pid,
          tags: row.Tags ? row.Tags.split(',').map((t) => t.trim()) : [],
        }
      })

      // Update Projects State
      projects.value = Array.from(projectMap.entries()).map(([name, id]) => ({
        id,
        name,
        color: stringToColor(name),
      }))

      // Sort by date desc
      timeEntries.value = entries.sort(
        (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
      )
      lastUpdated.value = new Date().toLocaleString()
    } catch (e: any) {
      console.error('Error fetching data:', e)
      error.value = e.message || 'Unknown error occurred (check if data/data.csv exists)'
    } finally {
      isLoading.value = false
    }
  }

  // Consistent color generation
  function stringToColor(str: string) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += ('00' + value.toString(16)).substr(-2)
    }
    return color
  }

  return {
    timeEntries,
    projects,
    isLoading,
    lastUpdated,
    error,
    totalDuration,
    entryCount,
    fetchTimeEntries,
  }
})
