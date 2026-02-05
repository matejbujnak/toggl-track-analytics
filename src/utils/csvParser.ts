export interface CSVTimeEntry {
  User: string
  Email: string
  Client: string
  Project: string
  Task: string
  Description: string
  Billable: string
  StartDate: string
  StartTime: string
  EndDate: string
  EndTime: string
  Duration: string
  Tags: string
}

export function parseCSV(csvText: string): CSVTimeEntry[] {
  const lines = csvText.split('\n')
  if (lines.length === 0) return []

  const headerLine = lines[0]
  if (!headerLine) return []

  const headers = parseCSVLine(headerLine)

  const entries: CSVTimeEntry[] = []

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine) continue
    const line = rawLine.trim()
    if (!line) continue

    const values = parseCSVLine(line)
    if (values.length !== headers.length) continue

    const entry: any = {}
    // Map headers to simpler keys for internal use if needed,
    // or just use the header values stripping quotes

    // We expect specific headers based on Toggl export
    // "User","Email","Client","Project","Task","Description","Billable","Start date","Start time","End date","End time","Duration","Tags"

    // Mapping specific known columns
    entry.User = values[0]
    entry.Email = values[1]
    entry.Client = values[2]
    entry.Project = values[3]
    entry.Task = values[4]
    entry.Description = values[5]
    entry.Billable = values[6]
    entry.StartDate = values[7]
    entry.StartTime = values[8]
    entry.EndDate = values[9]
    entry.EndTime = values[10]
    entry.Duration = values[11]
    entry.Tags = values[12]

    entries.push(entry as CSVTimeEntry)
  }

  return entries
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  values.push(currentValue)

  return values
}
