import { useStore, GroqZoneDensity } from './store'
import { crowdCameraApi } from './crowdCameras'

export async function fetchDensityData(): Promise<GroqZoneDensity[]> {
  const state = useStore.getState()
  const zones = state.zones // Fallback to current zones

  // Default mapped data from current store zones
  const mappedData: GroqZoneDensity[] = zones.map((z: any) => {
    const maxCapacity = z.capacity || (z.area || 50) * 4
    const currentCount = z.people || 0
    const fillPercent = Math.min(100, (currentCount / maxCapacity) * 100)
    let status: "safe" | "warning" | "critical" = "safe"
    if (fillPercent > (z.threshold || 90)) status = "critical"
    else if (fillPercent > (z.threshold ? z.threshold * 0.8 : 75)) status = "warning"

    return {
      zoneId: z.id.toString(),
      zoneName: z.name,
      floorName: z.floorName,
      type: z.type,
      threshold: z.threshold,
      currentCount,
      maxCapacity,
      fillPercent,
      entryRate: Math.floor(Math.random() * 5), // Simulated if missing
      exitRate: Math.floor(Math.random() * 5),
      density: z.density || 0,
      status
    }
  })

  try {
    const cameras = await crowdCameraApi.list()

    for (const cam of cameras) {
      if (!cam.id) continue
      try {
        const stats = await crowdCameraApi.stats(cam.id)

        // Map camera ID to zone. Fallback: match by index if zone ID doesn't exactly match
        let targetZoneIdx = mappedData.findIndex(z => z.zoneId === cam.id.toString() || z.zoneId === (cam as any).zoneId?.toString())
        if (targetZoneIdx === -1) {
          // Just apply to the first zone for demo purposes if unconnected
          targetZoneIdx = Math.min(cam.id - 1, mappedData.length - 1)
        }

        if (targetZoneIdx >= 0 && targetZoneIdx < mappedData.length) {
          const z = mappedData[targetZoneIdx]
          z.currentCount = stats.count || 0
          z.fillPercent = Math.min(100, (z.currentCount / z.maxCapacity) * 100)

          if (z.fillPercent > 90) z.status = "critical"
          else if (z.fillPercent > 75) z.status = "warning"
          else z.status = "safe"

          // Use zone split as a lightweight flow proxy when explicit flow data is absent.
          z.entryRate = stats.zone_a || z.entryRate
          z.exitRate = stats.zone_b || z.exitRate
        }
      } catch (err) {
        console.warn(`Failed to fetch stats for camera ${cam.id}`, err)
      }
    }
  } catch (err) {
    console.warn("Failed to fetch camera density data. Using Prisma/Mock fallback.", err)
  }

  // Update store
  useStore.getState().setDensityData(mappedData)
  return mappedData
}
