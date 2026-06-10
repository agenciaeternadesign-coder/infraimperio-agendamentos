const CITY_COORDS = {
  'barreiro':          { lat: 38.6637, lng: -9.0722 },
  'lisboa':            { lat: 38.7223, lng: -9.1393 },
  'almada':            { lat: 38.6774, lng: -9.1591 },
  'seixal':            { lat: 38.6426, lng: -9.1007 },
  'moita':             { lat: 38.6425, lng: -8.9925 },
  'montijo':           { lat: 38.7065, lng: -8.9733 },
  'alcochete':         { lat: 38.7554, lng: -8.9582 },
  'palmela':           { lat: 38.5671, lng: -8.9003 },
  'setúbal':           { lat: 38.5244, lng: -8.8882 },
  'setubal':           { lat: 38.5244, lng: -8.8882 },
  'sesimbra':          { lat: 38.4445, lng: -9.1011 },
  'cascais':           { lat: 38.6972, lng: -9.4215 },
  'sintra':            { lat: 38.8029, lng: -9.3817 },
  'oeiras':            { lat: 38.6968, lng: -9.3145 },
  'amadora':           { lat: 38.7538, lng: -9.2286 },
  'odivelas':          { lat: 38.7951, lng: -9.1837 },
  'loures':            { lat: 38.8308, lng: -9.1641 },
  'vila franca de xira': { lat: 38.9556, lng: -8.9817 },
  'mafra':             { lat: 38.9347, lng: -9.3275 },
}

const HQ = { lat: 38.6637, lng: -9.0722 } // Barreiro

// Cities that are grouped first in the route (before returning south)
const PRIORITY_CITIES = ['lisboa', 'odivelas', 'loures', 'amadora', 'sintra', 'oeiras', 'mafra', 'cascais', 'vila franca de xira', 'montijo', 'alcochete']

function getCityCoords(city) {
  const key = city.toLowerCase().trim()
  return CITY_COORDS[key] ?? HQ
}

function distance(a, b) {
  const dlat = a.lat - b.lat
  const dlng = a.lng - b.lng
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

function nearestNeighbor(visits, startCoord) {
  if (visits.length === 0) return []
  const unvisited = [...visits]
  const route = []
  let current = startCoord

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    unvisited.forEach((v, i) => {
      const d = distance(current, getCityCoords(v.address.city))
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    })
    const next = unvisited.splice(nearestIdx, 1)[0]
    route.push(next)
    current = getCityCoords(next.address.city)
  }
  return route
}

// Lisboa (and other north-of-Barreiro cities) always come first, then nearest-neighbor within each group
export function optimizeRoute(visits) {
  if (visits.length === 0) return []
  if (visits.length === 1) return [...visits]

  const priority = visits.filter((v) => PRIORITY_CITIES.includes(v.address.city.toLowerCase().trim()))
  const others   = visits.filter((v) => !PRIORITY_CITIES.includes(v.address.city.toLowerCase().trim()))

  const optimizedPriority = nearestNeighbor(priority, HQ)
  const lastPriorityCoord = optimizedPriority.length > 0
    ? getCityCoords(optimizedPriority[optimizedPriority.length - 1].address.city)
    : HQ
  const optimizedOthers = nearestNeighbor(others, lastPriorityCoord)

  return [...optimizedPriority, ...optimizedOthers]
}

// Rough travel time estimate (minutes) between two cities
export function estimateTravelMinutes(fromCity, toCity) {
  const a = getCityCoords(fromCity)
  const b = getCityCoords(toCity)
  const dist = distance(a, b)
  const km = dist * 111
  return Math.max(5, Math.round(km * 2.2))
}

export function formatAddress(addr) {
  return `${addr.street} ${addr.number}, ${addr.city}, Portugal`
}

export function generateGoogleMapsUrl(visits, companySettings) {
  const origin = encodeURIComponent(
    `${companySettings.street} ${companySettings.number}, ${companySettings.city}, Portugal`
  )
  if (visits.length === 0) return `https://www.google.com/maps/search/${origin}`
  const waypoints = visits.map((v) => encodeURIComponent(formatAddress(v.address))).join('/')
  return `https://www.google.com/maps/dir/${origin}/${waypoints}/${origin}`
}

function timeToMinutes(time) {
  if (!time) return null // visita sem horário definido
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Build route list with travel estimates and gap-aware scheduled times.
// gapMinutes = minimum minutes between consecutive visit start times.
// Visitas sem horário (time vazio) recebem hora calculada pela rota.
const DEFAULT_START_MINS = 9 * 60 // 09:00

export function buildRouteWithTimes(orderedVisits, gapMinutes = 30) {
  const HQ_CITY = 'Barreiro'
  const result = []
  let lastCity = HQ_CITY
  let prevScheduledMins = null

  orderedVisits.forEach((visit) => {
    const travel = estimateTravelMinutes(lastCity, visit.address.city)
    const originalMins = timeToMinutes(visit.time)

    let scheduledMins
    if (prevScheduledMins === null) {
      scheduledMins = originalMins ?? DEFAULT_START_MINS
    } else {
      // Next visit must start at least gapMinutes after previous, and at least travel time after previous
      const minByGap    = prevScheduledMins + gapMinutes
      const minByTravel = prevScheduledMins + travel
      scheduledMins = Math.max(originalMins ?? 0, minByGap, minByTravel)
    }

    result.push({
      ...visit,
      travelFromPrev: travel,
      scheduledTime: minutesToTime(scheduledMins),
    })

    prevScheduledMins = scheduledMins
    lastCity = visit.address.city
  })

  return result
}
