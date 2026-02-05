import fs from 'fs'
import path from 'path'
import https from 'https'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Configure __dirname for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Configuration
const API_TOKEN = process.env.TOGGL_API_TOKEN
const WORKSPACE_ID = process.env.TOGGL_WORKSPACE_ID
const USER_AGENT = 'toggl-track-analytics-script'

if (!API_TOKEN || !WORKSPACE_ID) {
  console.error('Error: TOGGL_API_TOKEN and TOGGL_WORKSPACE_ID environment variables are required.')
  console.error('Please create a .env file in the root directory with these variables.')
  process.exit(1)
}

const DATA_DIR = path.join(__dirname, '..', 'public', 'data')
const DATA_FILE = path.join(DATA_DIR, 'data.csv')

// Default start date if no data exists
const FALLBACK_START_DATE = '2024-01-01'

async function main() {
  console.log('Starting synchronization...')

  let allLines = loadCurrentData()
  const header =
    allLines.length > 0
      ? allLines[0]
      : '"User","Email","Client","Project","Task","Description","Billable","Start date","Start time","End date","End time","Duration","Tags"'
  let dataLines = allLines.length > 0 ? allLines.slice(1) : []

  const CLIENT_PREFIX = 'CVUT_'
  dataLines = dataLines.filter((l) => {
    const parts = l.split('","')
    return parts.length > 2 && parts[2].startsWith(CLIENT_PREFIX)
  })

  const lastDateStr = findLastDate(dataLines)
  let startDate = FALLBACK_START_DATE

  if (lastDateStr) {
    const dateObj = new Date(lastDateStr)
    dateObj.setDate(dateObj.getDate() - 14)
    startDate = dateObj.toISOString().split('T')[0]
    console.log(`Syncing from ${startDate} (last record: ${lastDateStr})`)
  } else {
    console.log(`Syncing from start: ${startDate}`)
  }

  const today = new Date().toISOString().split('T')[0]
  console.log(`Time Range: ${startDate} -> ${today}`)

  const originalCount = dataLines.length
  dataLines = dataLines.filter((line) => {
    const lineDate = extractDateFromLine(line)
    return !lineDate || lineDate < startDate
  })

  let newEntries = await fetchAllTimeEntries(startDate, today)

  if (newEntries.length > 0) {
    newEntries = newEntries.filter((e) => (e.client_name || '').startsWith(CLIENT_PREFIX))
  }

  if (newEntries.length > 0 || dataLines.length !== originalCount) {
    if (newEntries.length > 0) {
      console.log(`Fetched ${newEntries.length} new entries.`)
      const csvContent = convertToCSV(newEntries)
      const newLines = csvContent
        .split(/\r?\n/)
        .slice(1)
        .filter((l) => l.trim().length > 0)
      dataLines.push(...newLines)
    }

    const uniqueLines = Array.from(new Set(dataLines))
    if (dataLines.length !== uniqueLines.length) {
      console.log(`Removed ${dataLines.length - uniqueLines.length} duplicates.`)
    }
    dataLines = uniqueLines

    dataLines.sort((a, b) => {
      const da = extractDateFromLine(a) || ''
      const db = extractDateFromLine(b) || ''
      return da.localeCompare(db)
    })

    const finalContent = [header, ...dataLines].join('\n')
    fs.writeFileSync(DATA_FILE, finalContent)
    console.log(`Saved ${dataLines.length} total entries to data.csv`)

    await gitPush()
  } else {
    console.log('No changes.')
  }
}

async function fetchAllTimeEntries(startDate, endDate) {
  let allEntries = []
  let keepFetching = true

  while (keepFetching) {
    const entries = await fetchTimeEntriesPage(startDate, endDate)
    if (Array.isArray(entries)) {
      allEntries = entries
      keepFetching = false
    } else {
      console.error('Unexpected API response format', entries)
      break
    }
  }
  return allEntries
}

function loadCurrentData() {
  if (fs.existsSync(DATA_FILE)) {
    return fs
      .readFileSync(DATA_FILE, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
  }
  return []
}

function findLastDate(lines) {
  let maxDate = ''
  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const date = extractDateFromLine(lines[i])
    if (date && date > maxDate) {
      maxDate = date
    }
  }
  return maxDate || null
}

function extractDateFromLine(line) {
  // Expected Format: "User",...,"2024-01-01",...
  // Date is at index 7
  const parts = line.split('","')
  if (parts.length >= 8) {
    let dateStr = parts[7].replace(/"/g, '')
    // Simple validation YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
  }
  return null
}

function fetchTimeEntriesPage(startDate, endDate) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      start_date: startDate,
      end_date: endDate,
    })

    const options = {
      hostname: 'api.track.toggl.com',
      path: `/reports/api/v3/workspace/${WORKSPACE_ID}/search/time_entries`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(API_TOKEN + ':api_token').toString('base64'),
        'Content-Length': postData.length,
      },
    }

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        res.on('data', (d) => console.error('API Error Body:', d.toString()))
        reject(new Error(`API request failed with status ${res.statusCode}`))
        return
      }

      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve(json)
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', (e) => reject(e))
    req.write(postData)
    req.end()
  })
}

function convertToCSV(data) {
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

  const rows = (data || []).map((entry) => {
    // Safe date parsing
    let start = new Date(entry.start)
    if (isNaN(start.getTime())) {
      console.warn(`Invalid start date for entry: ${JSON.stringify(entry)}`)
      start = new Date() // Fallback
    }

    let end = new Date(entry.stop || entry.end || entry.start)
    if (isNaN(end.getTime())) {
      end = start
    }

    const dateStr = (d) => {
      try {
        return d.toISOString().split('T')[0]
      } catch (e) {
        return ''
      }
    }
    const timeStr = (d) => {
      try {
        return d.toTimeString().split(' ')[0]
      } catch (e) {
        return ''
      }
    }

    // Handle duration
    const durationSec = entry.duration !== undefined ? entry.duration : entry.seconds || 0
    const seconds = durationSec < 0 ? 0 : durationSec

    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    const durStr = `${h}:${m}:${s}`

    return [
      entry.username || 'User',
      'email@example.com',
      entry.client_name || '',
      entry.project_name || '',
      entry.task_name || '',
      entry.description || '',
      entry.billable ? 'Yes' : 'No',
      dateStr(start),
      timeStr(start),
      dateStr(end),
      timeStr(end),
      durStr,
      (entry.tags || []).join(', '),
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

function gitPush() {
  return new Promise((resolve, reject) => {
    // use 'git add public/data' to verify deleted files are processed
    const commands = ['git add public/data', 'git commit -m "chore: update toggl data"', 'git push']

    const chain = commands.join(' && ')

    exec(chain, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Git push failed (you might need to push manually): ${error.message}`)
        resolve()
        return
      }
      console.log(stdout)
      console.log('Successfully pushed updates to GitHub.')
      resolve()
    })
  })
}

main()
