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
  'setúbal':           { lat: 38.5244, lng: -8.8882 },
}

const HQ = { lat: 38.6637, lng: -9.0722 } // Barreiro

function getCityCoords(city) {
  const key = city.toLowerCase().trim()
  return CITY_COORDS[key] ?? HQ
}

function distance(a, b) {
  const dlat = a.lat - b.lat
  const dlng = a.lng - b.lng
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

// Nearest-neighbour TSP starting from HQ, returning to HQ
export function optimizeRoute(visits) {
  if (visits.length === 0) return []
  if (visits.length === 1) return [...visits]

  const unvisited = visits.map((v, i) => ({ ...v, _idx: i }))
  const route = []
  let current = HQ

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity

    unvisited.forEach((v, i) => {
      const coords = getCityCoords(v.address.city)
      const d = distance(current, coords)
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    })

    const next = unvisited.splice(nearestIdx, 1)[0]
    route.push(next)
    current = getCityCoords(next.address.city)
  }

  return route
}

// Rough travel time estimate (minutes) between two addresses
export function estimateTravelMinutes(fromCity, toCity) {
  const a = getCityCoords(fromCity)
  const b = getCityCoords(toCity)
  const dist = distance(a, b)
  // Roughly 0.01 degree ≈ 1 km; avg speed 40 km/h urban → 1.5 min/km
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

  const waypoints = visits
    .map((v) => encodeURIComponent(formatAddress(v.address)))
    .join('/')

  return `https://www.google.com/maps/dir/${origin}/${waypoints}/${origin}`
}

export function buildRouteWithTimes(orderedVisits) {
  const HQ_CITY = 'Barreiro'
  const result = []
  let lastCity = HQ_CITY

  orderedVisits.forEach((visit) => {
    const travel = estimateTravelMinutes(lastCity, visit.address.city)
    result.push({ ...visit, travelFromPrev: travel })
    lastCity = visit.address.city
  })

  return result
}
