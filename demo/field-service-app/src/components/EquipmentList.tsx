import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Wrench, MapPin, Calendar, History, ScanLine, X, Camera, Zap } from 'lucide-react'
import { getEquipment, type Equipment } from '../db'

export default function EquipmentList() {
  const { t } = useTranslation()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    setLoading(true)
    const items = await getEquipment()
    setEquipment(items)
    setLoading(false)
  }

  // Scanner functions
  const startScanner = async () => {
    setShowScanner(true)
    setScanResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera access denied:', error)
    }
  }

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowScanner(false)
    setScanning(false)
    setScanResult(null)
  }

  const simulateScan = () => {
    setScanning(true)
    // Simulate scanning animation
    setTimeout(() => {
      // Pick a random equipment serial number from the list
      const randomEquipment = equipment[Math.floor(Math.random() * equipment.length)]
      if (randomEquipment) {
        setScanResult(randomEquipment.serialNumber)
        setScanning(false)
        // Auto-select after short delay
        setTimeout(() => {
          stopScanner()
          setSelectedEquipment(randomEquipment)
        }, 1000)
      }
    }, 1500)
  }

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Barcode Scanner Modal
  if (showScanner) {
    return (
      <div className="h-full flex flex-col bg-black">
        {/* Scanner Header */}
        <div className="bg-black/80 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            {t('equipment.scanner.title')}
          </h2>
          <button
            onClick={stopScanner}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scan Frame Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

              {/* Scanning line animation */}
              {scanning && (
                <div className="absolute left-2 right-2 h-0.5 bg-green-400 animate-pulse"
                  style={{
                    animation: 'scanLine 1.5s ease-in-out infinite',
                    top: '50%'
                  }}
                />
              )}

              {/* Scan result */}
              {scanResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {scanResult}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dark overlay around scan area */}
          <div className="absolute inset-0 bg-black/50" style={{
            clipPath: 'polygon(0% 0%, 0% 100%, calc(50% - 128px) 100%, calc(50% - 128px) calc(50% - 128px), calc(50% + 128px) calc(50% - 128px), calc(50% + 128px) calc(50% + 128px), calc(50% - 128px) calc(50% + 128px), calc(50% - 128px) 100%, 100% 100%, 100% 0%)'
          }} />
        </div>

        {/* Scanner Controls */}
        <div className="bg-black/80 px-4 py-6 space-y-4">
          <p className="text-white/70 text-center text-sm">
            {scanning ? t('equipment.scanner.scanning') : t('equipment.scanner.instruction')}
          </p>
          <button
            onClick={simulateScan}
            disabled={scanning || !!scanResult}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            <Camera className="w-5 h-5" />
            {scanning ? t('equipment.scanner.scanning') : t('equipment.scanner.scan')}
          </button>
        </div>

        {/* CSS for scan line animation */}
        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 10%; }
            50% { top: 90%; }
          }
        `}</style>
      </div>
    )
  }

  if (selectedEquipment) {
    return (
      <div className="h-full flex flex-col bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSelectedEquipment(null)}
            className="text-blue-600 text-sm font-medium mb-2"
          >
            ← Back to list
          </button>
          <h1 className="font-semibold text-gray-900 text-lg">{selectedEquipment.name}</h1>
          <p className="text-sm text-gray-500 font-mono">{selectedEquipment.serialNumber}</p>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedEquipment.name}</h2>
                <p className="text-sm text-gray-500">{selectedEquipment.manufacturer}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('equipment.fields.serialNumber')}
                </label>
                <p className="text-gray-700 mt-1 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                  {selectedEquipment.serialNumber}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('equipment.fields.manufacturer')}
                </label>
                <p className="text-gray-700 mt-1">{selectedEquipment.manufacturer}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('equipment.fields.installDate')}
                  </label>
                  <p className="text-gray-700 mt-1">
                    {new Date(selectedEquipment.installDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <History className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('equipment.fields.lastService')}
                  </label>
                  <p className="text-gray-700 mt-1">
                    {selectedEquipment.lastService
                      ? new Date(selectedEquipment.lastService).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {selectedEquipment.location && (
              <div className="flex items-start gap-2 pt-4 border-t border-gray-100">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Location
                  </label>
                  <p className="text-gray-700 mt-1">{selectedEquipment.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Service History (placeholder) */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3">Service History</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Preventive Maintenance</p>
                  <p className="text-xs text-gray-500">
                    {selectedEquipment.lastService
                      ? new Date(selectedEquipment.lastService).toLocaleDateString()
                      : 'No service records'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Installation</p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedEquipment.installDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar and Scan Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('equipment.search')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors touch-target"
          >
            <ScanLine className="w-5 h-5" />
            <span className="hidden sm:inline">{t('equipment.scanner.button')}</span>
          </button>
        </div>
      </div>

      {/* Equipment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEquipment.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No equipment found
          </div>
        ) : (
          filteredEquipment.map((eq) => (
            <button
              key={eq._id}
              onClick={() => setSelectedEquipment(eq)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow touch-target"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{eq.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{eq.serialNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                <span>{eq.manufacturer}</span>
                {eq.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{eq.location}</span>
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
