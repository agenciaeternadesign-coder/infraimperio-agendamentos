import { useState, useEffect, useRef, useCallback } from 'react'
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'

const LIBRARIES = []
const HQ_DEFAULT = { lat: 38.7167, lng: -9.1333 } // Lisboa, Portugal
const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  gestureHandling: 'cooperative',
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
}

// Inner component — only rendered when apiKey is present
function MapContent({ visits, onLegsUpdate, hqAddress }) {
  const [directions, setDirections]     = useState(null)
  const [dirError, setDirError]         = useState(null)
  const reqSeq = useRef(0)

  const calculate = useCallback(() => {
    if (!window.google) return
    if (visits.length === 0) {
      setDirections(null)
      setDirError(null)
      onLegsUpdate?.([])
      return
    }

    setDirError(null)
    reqSeq.current += 1
    const seq = reqSeq.current

    const origin = hqAddress || 'Portugal'
    const ds = new window.google.maps.DirectionsService()
    ds.route(
      {
        origin:      origin,
        destination: origin,
        waypoints: visits.map((v) => ({
          location: `${v.address.street} ${v.address.number}, ${v.address.city}, Portugal`,
          stopover: true,
        })),
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'PT',
      },
      (result, status) => {
        if (seq !== reqSeq.current) return // stale
        if (status === 'OK') {
          setDirections(result)
          onLegsUpdate?.(
            result.routes[0].legs.map((leg) => ({
              duration:        leg.duration.text,
              distance:        leg.distance.text,
              durationSeconds: leg.duration.value,
            }))
          )
        } else {
          setDirError(DIRECTION_ERRORS[status] ?? `Erro: ${status}`)
        }
      }
    )
  }, [visits, onLegsUpdate])

  useEffect(() => { calculate() }, [calculate])

  return (
    <div className="space-y-2">
      {dirError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800">{dirError}</p>
          {dirError.includes('Directions API') && (
            <p className="text-xs text-amber-700">
              Active a <strong>Directions API</strong> em{' '}
              <a
                href="https://console.cloud.google.com/apis/library/directions-backend.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Google Cloud Console → APIs → Directions API → Ativar
              </a>
              . Certifique-se de que a API Key usada tem esta API autorizada.
            </p>
          )}
        </div>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '420px', borderRadius: '12px' }}
        center={HQ_DEFAULT}
        zoom={visits.length === 0 ? 12 : 11}
        options={MAP_OPTIONS}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#b91c1c', strokeWeight: 5, strokeOpacity: 0.85 },
              markerOptions: { zIndex: 10 },
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}

// Loader wrapper — must call hooks unconditionally
function MapLoader({ apiKey, visits, onLegsUpdate, hqAddress }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  })

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        Erro ao carregar o Google Maps. Verifique se a API key é válida e se as APIs
        <strong> Maps JavaScript API</strong> e <strong>Directions API</strong> estão activas.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-64 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <SpinIcon /> A carregar mapa…
        </div>
      </div>
    )
  }

  return <MapContent visits={visits} onLegsUpdate={onLegsUpdate} hqAddress={hqAddress} />
}

// Public component — shows NoKey banner if no apiKey
export default function MapaRota({ apiKey, visits, onLegsUpdate, hqAddress }) {
  if (!apiKey) {
    return <NoApiKeyBanner />
  }
  return <MapLoader key={apiKey} apiKey={apiKey} visits={visits} onLegsUpdate={onLegsUpdate} hqAddress={hqAddress} />
}

function NoApiKeyBanner() {
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
      <div className="flex gap-3">
        <span className="text-brand-600 flex-shrink-0 mt-0.5"><MapIcon /></span>
        <div>
          <p className="font-semibold text-brand-800 text-sm mb-1">Mapa interactivo não configurado</p>
          <p className="text-brand-700 text-xs mb-3">
            Para ver a rota no mapa e obter tempos de deslocação reais, configure a Google Maps API Key
            nas <strong>Configurações → Google Maps</strong>.
          </p>
          <p className="text-xs text-brand-600">
            A API Key é gratuita até 200 USD/mês de uso (cobre centenas de rotas diárias).
            Aceda ao <a className="underline font-medium" href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> para obter a sua.
          </p>
        </div>
      </div>
    </div>
  )
}

const DIRECTION_ERRORS = {
  ZERO_RESULTS:       'Não foi possível calcular a rota entre os pontos indicados.',
  NOT_FOUND:          'Uma ou mais moradas não foram encontradas pelo Google Maps.',
  MAX_WAYPOINTS_EXCEEDED: 'Demasiadas paragens (máx. 25 por rota).',
  REQUEST_DENIED:     'Pedido recusado — verifique se a Directions API está activada na sua conta Google Cloud.',
  OVER_DAILY_LIMIT:   'Limite diário de pedidos atingido na sua API Key.',
  OVER_QUERY_LIMIT:   'Demasiados pedidos em simultâneo.',
}

function SpinIcon() { return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> }
function MapIcon()  { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> }
