import { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'
import { Check, ChevronLeft, ChevronRight, Database, Network, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import SASEDiagram from './SASEDiagram'

const CF_LOCATIONS = [
  // North America
  { location: [37.3382, -121.8863] as [number, number], size: 0.06 },
  { location: [34.0522, -118.2437] as [number, number], size: 0.06 },
  { location: [47.6062, -122.3321] as [number, number], size: 0.05 },
  { location: [41.8781, -87.6298] as [number, number], size: 0.06 },
  { location: [32.7767, -96.797] as [number, number], size: 0.05 },
  { location: [40.7128, -74.006] as [number, number], size: 0.08 },
  { location: [33.749, -84.388] as [number, number], size: 0.05 },
  { location: [25.7617, -80.1918] as [number, number], size: 0.05 },
  { location: [43.6532, -79.3832] as [number, number], size: 0.05 },
  { location: [45.5051, -73.5549] as [number, number], size: 0.04 },
  { location: [49.2827, -123.1207] as [number, number], size: 0.04 },
  { location: [19.4326, -99.1332] as [number, number], size: 0.06 },
  { location: [29.7604, -95.3698] as [number, number], size: 0.05 },
  { location: [39.7392, -104.9903] as [number, number], size: 0.04 },
  { location: [42.3601, -71.0589] as [number, number], size: 0.05 },
  { location: [47.6588, -117.426] as [number, number], size: 0.04 },
  { location: [38.9072, -77.0369] as [number, number], size: 0.06 },
  { location: [36.1627, -86.7816] as [number, number], size: 0.04 },
  { location: [35.2271, -80.8431] as [number, number], size: 0.04 },
  { location: [30.3322, -81.6557] as [number, number], size: 0.04 },
  { location: [44.9778, -93.265] as [number, number], size: 0.04 },
  { location: [45.5231, -122.6765] as [number, number], size: 0.04 },
  { location: [36.1699, -115.1398] as [number, number], size: 0.04 },
  { location: [33.4484, -112.074] as [number, number], size: 0.04 },
  { location: [35.4676, -97.5164] as [number, number], size: 0.03 },
  { location: [29.9511, -90.0715] as [number, number], size: 0.04 },
  { location: [21.3069, -157.8583] as [number, number], size: 0.04 },
  { location: [61.2181, -149.9003] as [number, number], size: 0.03 },
  // Canada
  { location: [53.5461, -113.4938] as [number, number], size: 0.04 },
  { location: [51.0447, -114.0719] as [number, number], size: 0.04 },
  // Mexico / Central America
  { location: [20.9674, -89.6235] as [number, number], size: 0.03 },
  { location: [9.9281, -84.0907] as [number, number], size: 0.03 },
  { location: [14.0723, -87.2062] as [number, number], size: 0.03 },
  { location: [13.6929, -89.2182] as [number, number], size: 0.03 },
  // Caribbean
  { location: [18.4655, -66.1057] as [number, number], size: 0.03 },
  { location: [25.0480, -77.3554] as [number, number], size: 0.03 },
  // South America
  { location: [23.5505, -46.6333] as [number, number], size: 0.07 },
  { location: [-34.6037, -58.3816] as [number, number], size: 0.06 },
  { location: [22.9068, -43.1729] as [number, number], size: 0.06 },
  { location: [33.4489, -70.6693] as [number, number], size: 0.05 },
  { location: [4.711, -74.0721] as [number, number], size: 0.05 },
  { location: [12.0464, -77.0428] as [number, number], size: 0.04 },
  { location: [10.4806, -66.9036] as [number, number], size: 0.04 },
  { location: [-0.1807, -78.4678] as [number, number], size: 0.04 },
  { location: [-12.0464, -77.0428] as [number, number], size: 0.04 },
  { location: [-16.5, -68.15] as [number, number], size: 0.03 },
  { location: [-25.2867, -57.647] as [number, number], size: 0.03 },
  { location: [-30.0346, -51.2177] as [number, number], size: 0.04 },
  { location: [-15.7942, -47.8822] as [number, number], size: 0.04 },
  { location: [-8.0476, -34.877] as [number, number], size: 0.03 },
  { location: [-3.7319, -38.5267] as [number, number], size: 0.03 },
  // Europe
  { location: [51.5074, -0.1278] as [number, number], size: 0.08 },
  { location: [52.3676, 4.9041] as [number, number], size: 0.07 },
  { location: [50.1109, 8.6821] as [number, number], size: 0.07 },
  { location: [48.8566, 2.3522] as [number, number], size: 0.07 },
  { location: [40.4168, -3.7038] as [number, number], size: 0.06 },
  { location: [45.4654, 9.1859] as [number, number], size: 0.05 },
  { location: [59.3293, 18.0686] as [number, number], size: 0.05 },
  { location: [52.2297, 21.0122] as [number, number], size: 0.05 },
  { location: [50.0755, 14.4378] as [number, number], size: 0.04 },
  { location: [44.4268, 26.1025] as [number, number], size: 0.04 },
  { location: [48.2082, 16.3738] as [number, number], size: 0.05 },
  { location: [47.3769, 8.5417] as [number, number], size: 0.05 },
  { location: [50.8503, 4.3517] as [number, number], size: 0.04 },
  { location: [38.7169, -9.1395] as [number, number], size: 0.05 },
  { location: [60.1699, 24.9384] as [number, number], size: 0.04 },
  { location: [55.6761, 12.5683] as [number, number], size: 0.05 },
  { location: [53.3498, -6.2603] as [number, number], size: 0.05 },
  { location: [41.9028, 12.4964] as [number, number], size: 0.06 },
  { location: [59.9139, 10.7522] as [number, number], size: 0.04 },
  { location: [53.5488, 9.9872] as [number, number], size: 0.05 },
  { location: [48.1351, 11.582] as [number, number], size: 0.05 },
  { location: [37.9838, 23.7275] as [number, number], size: 0.05 },
  { location: [47.4979, 19.0402] as [number, number], size: 0.04 },
  { location: [53.4084, -2.9916] as [number, number], size: 0.04 },
  { location: [55.8642, -4.2518] as [number, number], size: 0.04 },
  { location: [43.2965, 5.3698] as [number, number], size: 0.04 },
  { location: [43.7102, 7.262] as [number, number], size: 0.03 },
  { location: [41.3851, 2.1734] as [number, number], size: 0.05 },
  { location: [37.1773, -3.5986] as [number, number], size: 0.03 },
  { location: [47.0105, 28.8638] as [number, number], size: 0.03 },
  { location: [56.9496, 24.1052] as [number, number], size: 0.03 },
  { location: [54.6872, 25.2797] as [number, number], size: 0.03 },
  { location: [59.4369, 24.7535] as [number, number], size: 0.03 },
  { location: [46.2044, 6.1432] as [number, number], size: 0.04 },
  { location: [45.8150, 15.9819] as [number, number], size: 0.03 },
  { location: [44.8176, 20.4569] as [number, number], size: 0.04 },
  { location: [42.6977, 23.3219] as [number, number], size: 0.03 },
  { location: [38.9637, 35.2433] as [number, number], size: 0.03 },
  // Eastern Europe / Central Asia
  { location: [55.7558, 37.6173] as [number, number], size: 0.06 },
  { location: [41.0082, 28.9784] as [number, number], size: 0.06 },
  { location: [50.4501, 30.5234] as [number, number], size: 0.05 },
  { location: [43.2551, 76.9126] as [number, number], size: 0.04 },
  { location: [41.2995, 69.2401] as [number, number], size: 0.03 },
  { location: [43.1224, 131.8977] as [number, number], size: 0.04 },
  { location: [51.1801, 71.446] as [number, number], size: 0.03 },
  // Middle East
  { location: [25.2048, 55.2708] as [number, number], size: 0.06 },
  { location: [32.0853, 34.7818] as [number, number], size: 0.05 },
  { location: [30.0444, 31.2357] as [number, number], size: 0.05 },
  { location: [26.2041, 28.0473] as [number, number], size: 0.05 },
  { location: [24.6877, 46.7219] as [number, number], size: 0.06 },
  { location: [29.3759, 47.9774] as [number, number], size: 0.04 },
  { location: [26.2285, 50.5860] as [number, number], size: 0.04 },
  { location: [23.5880, 58.3829] as [number, number], size: 0.03 },
  { location: [33.3152, 44.3661] as [number, number], size: 0.04 },
  { location: [35.6892, 51.389] as [number, number], size: 0.05 },
  { location: [33.8938, 35.5018] as [number, number], size: 0.03 },
  // Africa
  { location: [6.5244, 3.3792] as [number, number], size: 0.05 },
  { location: [1.2921, 36.8219] as [number, number], size: 0.05 },
  { location: [33.5731, -7.5898] as [number, number], size: 0.04 },
  { location: [33.8869, 9.5375] as [number, number], size: 0.03 },
  { location: [3.848, 11.5021] as [number, number], size: 0.03 },
  { location: [-25.9692, 32.5732] as [number, number], size: 0.04 },
  { location: [-26.2041, 28.0473] as [number, number], size: 0.06 },
  { location: [-33.9249, 18.4241] as [number, number], size: 0.05 },
  { location: [5.5600, -0.1969] as [number, number], size: 0.04 },
  { location: [14.6928, -17.4467] as [number, number], size: 0.03 },
  { location: [9.0579, 7.4951] as [number, number], size: 0.03 },
  { location: [-4.3219, 15.3222] as [number, number], size: 0.03 },
  { location: [-1.2921, 36.8219] as [number, number], size: 0.03 },
  { location: [15.5007, 32.5599] as [number, number], size: 0.03 },
  { location: [11.8251, 42.5903] as [number, number], size: 0.03 },
  // Asia Pacific
  { location: [35.6762, 139.6503] as [number, number], size: 0.08 },
  { location: [34.6937, 135.5023] as [number, number], size: 0.06 },
  { location: [1.3521, 103.8198] as [number, number], size: 0.08 },
  { location: [22.3193, 114.1694] as [number, number], size: 0.07 },
  { location: [33.8688, 151.2093] as [number, number], size: 0.07 },
  { location: [37.5665, 126.978] as [number, number], size: 0.07 },
  { location: [19.076, 72.8777] as [number, number], size: 0.07 },
  { location: [12.9716, 77.5946] as [number, number], size: 0.06 },
  { location: [25.033, 121.5654] as [number, number], size: 0.06 },
  { location: [3.139, 101.6869] as [number, number], size: 0.06 },
  { location: [13.7563, 100.5018] as [number, number], size: 0.06 },
  { location: [6.2088, 106.8456] as [number, number], size: 0.06 },
  { location: [37.8136, 144.9631] as [number, number], size: 0.05 },
  { location: [31.2304, 121.4737] as [number, number], size: 0.07 },
  { location: [39.9042, 116.4074] as [number, number], size: 0.07 },
  { location: [22.5431, 114.0579] as [number, number], size: 0.06 },
  { location: [36.8485, 174.7633] as [number, number], size: 0.05 },
  { location: [28.7041, 77.1025] as [number, number], size: 0.06 },
  { location: [10.8231, 106.6297] as [number, number], size: 0.06 },
  { location: [14.0583, 108.2772] as [number, number], size: 0.05 },
  { location: [23.8103, 90.4125] as [number, number], size: 0.05 },
  { location: [-36.8485, 174.7633] as [number, number], size: 0.04 },
  { location: [-41.2865, 174.7762] as [number, number], size: 0.04 },
  { location: [-27.4698, 153.0251] as [number, number], size: 0.04 },
  { location: [-31.9505, 115.8605] as [number, number], size: 0.04 },
  { location: [1.3521, 103.8198] as [number, number], size: 0.06 },
  { location: [14.5995, 120.9842] as [number, number], size: 0.05 },
  { location: [10.3157, 123.8854] as [number, number], size: 0.04 },
  { location: [4.1755, 73.5093] as [number, number], size: 0.03 },
  { location: [21.0278, 105.8342] as [number, number], size: 0.05 },
  { location: [18.5204, 73.8567] as [number, number], size: 0.04 },
  { location: [22.3964, 114.1095] as [number, number], size: 0.05 },
  { location: [30.5728, 104.0668] as [number, number], size: 0.05 },
  { location: [23.1291, 113.2644] as [number, number], size: 0.06 },
  { location: [45.7489, 126.6424] as [number, number], size: 0.04 },
  { location: [43.8171, 125.3235] as [number, number], size: 0.04 },
  { location: [26.0745, 119.2965] as [number, number], size: 0.04 },
  { location: [30.2741, 120.1551] as [number, number], size: 0.05 },
]

const CF_ARCS = [
  // US East <-> Europe
  { from: [40.7128, -74.006] as [number,number], to: [51.5074, -0.1278] as [number,number], arcAlt: 0.3 },
  { from: [40.7128, -74.006] as [number,number], to: [52.3676, 4.9041] as [number,number], arcAlt: 0.28 },
  { from: [40.7128, -74.006] as [number,number], to: [50.1109, 8.6821] as [number,number], arcAlt: 0.3 },
  { from: [40.7128, -74.006] as [number,number], to: [48.8566, 2.3522] as [number,number], arcAlt: 0.3 },
  { from: [42.3601, -71.0589] as [number,number], to: [51.5074, -0.1278] as [number,number], arcAlt: 0.28 },
  { from: [38.9072, -77.0369] as [number,number], to: [51.5074, -0.1278] as [number,number], arcAlt: 0.28 },
  // US West <-> Asia
  { from: [37.3382, -121.8863] as [number,number], to: [35.6762, 139.6503] as [number,number], arcAlt: 0.35 },
  { from: [37.3382, -121.8863] as [number,number], to: [1.3521, 103.8198] as [number,number], arcAlt: 0.3 },
  { from: [34.0522, -118.2437] as [number,number], to: [35.6762, 139.6503] as [number,number], arcAlt: 0.35 },
  { from: [47.6062, -122.3321] as [number,number], to: [35.6762, 139.6503] as [number,number], arcAlt: 0.32 },
  { from: [37.3382, -121.8863] as [number,number], to: [22.3193, 114.1694] as [number,number], arcAlt: 0.3 },
  // US East <-> South America
  { from: [40.7128, -74.006] as [number,number], to: [23.5505, -46.6333] as [number,number], arcAlt: 0.2 },
  { from: [40.7128, -74.006] as [number,number], to: [-34.6037, -58.3816] as [number,number], arcAlt: 0.22 },
  { from: [25.7617, -80.1918] as [number,number], to: [23.5505, -46.6333] as [number,number], arcAlt: 0.18 },
  // US <-> US (internal)
  { from: [40.7128, -74.006] as [number,number], to: [37.3382, -121.8863] as [number,number], arcAlt: 0.15 },
  { from: [40.7128, -74.006] as [number,number], to: [34.0522, -118.2437] as [number,number], arcAlt: 0.15 },
  { from: [40.7128, -74.006] as [number,number], to: [41.8781, -87.6298] as [number,number], arcAlt: 0.1 },
  { from: [40.7128, -74.006] as [number,number], to: [33.749, -84.388] as [number,number], arcAlt: 0.1 },
  { from: [37.3382, -121.8863] as [number,number], to: [47.6062, -122.3321] as [number,number], arcAlt: 0.08 },
  { from: [37.3382, -121.8863] as [number,number], to: [34.0522, -118.2437] as [number,number], arcAlt: 0.06 },
  // Europe internal
  { from: [51.5074, -0.1278] as [number,number], to: [52.3676, 4.9041] as [number,number], arcAlt: 0.05 },
  { from: [51.5074, -0.1278] as [number,number], to: [50.1109, 8.6821] as [number,number], arcAlt: 0.07 },
  { from: [51.5074, -0.1278] as [number,number], to: [48.8566, 2.3522] as [number,number], arcAlt: 0.05 },
  { from: [52.3676, 4.9041] as [number,number], to: [50.1109, 8.6821] as [number,number], arcAlt: 0.04 },
  { from: [52.3676, 4.9041] as [number,number], to: [48.8566, 2.3522] as [number,number], arcAlt: 0.04 },
  { from: [50.1109, 8.6821] as [number,number], to: [48.8566, 2.3522] as [number,number], arcAlt: 0.04 },
  { from: [50.1109, 8.6821] as [number,number], to: [48.2082, 16.3738] as [number,number], arcAlt: 0.05 },
  { from: [51.5074, -0.1278] as [number,number], to: [55.6761, 12.5683] as [number,number], arcAlt: 0.08 },
  { from: [51.5074, -0.1278] as [number,number], to: [59.3293, 18.0686] as [number,number], arcAlt: 0.1 },
  { from: [50.1109, 8.6821] as [number,number], to: [41.9028, 12.4964] as [number,number], arcAlt: 0.08 },
  { from: [48.8566, 2.3522] as [number,number], to: [40.4168, -3.7038] as [number,number], arcAlt: 0.07 },
  // Europe <-> Middle East / Africa
  { from: [51.5074, -0.1278] as [number,number], to: [25.2048, 55.2708] as [number,number], arcAlt: 0.25 },
  { from: [50.1109, 8.6821] as [number,number], to: [30.0444, 31.2357] as [number,number], arcAlt: 0.2 },
  { from: [51.5074, -0.1278] as [number,number], to: [-26.2041, 28.0473] as [number,number], arcAlt: 0.3 },
  { from: [50.1109, 8.6821] as [number,number], to: [6.5244, 3.3792] as [number,number], arcAlt: 0.22 },
  // Asia internal
  { from: [1.3521, 103.8198] as [number,number], to: [35.6762, 139.6503] as [number,number], arcAlt: 0.2 },
  { from: [1.3521, 103.8198] as [number,number], to: [22.3193, 114.1694] as [number,number], arcAlt: 0.1 },
  { from: [1.3521, 103.8198] as [number,number], to: [13.7563, 100.5018] as [number,number], arcAlt: 0.08 },
  { from: [35.6762, 139.6503] as [number,number], to: [37.5665, 126.978] as [number,number], arcAlt: 0.07 },
  { from: [35.6762, 139.6503] as [number,number], to: [25.033, 121.5654] as [number,number], arcAlt: 0.1 },
  { from: [22.3193, 114.1694] as [number,number], to: [31.2304, 121.4737] as [number,number], arcAlt: 0.06 },
  { from: [1.3521, 103.8198] as [number,number], to: [19.076, 72.8777] as [number,number], arcAlt: 0.15 },
  { from: [35.6762, 139.6503] as [number,number], to: [33.8688, 151.2093] as [number,number], arcAlt: 0.12 },
  // Asia <-> Australia
  { from: [1.3521, 103.8198] as [number,number], to: [33.8688, 151.2093] as [number,number], arcAlt: 0.2 },
  { from: [35.6762, 139.6503] as [number,number], to: [33.8688, 151.2093] as [number,number], arcAlt: 0.15 },
  { from: [33.8688, 151.2093] as [number,number], to: [-36.8485, 174.7633] as [number,number], arcAlt: 0.1 },
  // Europe <-> Asia
  { from: [50.1109, 8.6821] as [number,number], to: [25.2048, 55.2708] as [number,number], arcAlt: 0.2 },
  { from: [51.5074, -0.1278] as [number,number], to: [1.3521, 103.8198] as [number,number], arcAlt: 0.35 },
  // East North America <-> Brazil
  { from: [33.749, -84.388] as [number,number], to: [23.5505, -46.6333] as [number,number], arcAlt: 0.22 },
  { from: [25.7617, -80.1918] as [number,number], to: [22.9068, -43.1729] as [number,number], arcAlt: 0.2 },
  { from: [38.9072, -77.0369] as [number,number], to: [-15.7942, -47.8822] as [number,number], arcAlt: 0.25 },
  // South America internal
  { from: [23.5505, -46.6333] as [number,number], to: [-34.6037, -58.3816] as [number,number], arcAlt: 0.1 },
  { from: [23.5505, -46.6333] as [number,number], to: [33.4489, -70.6693] as [number,number], arcAlt: 0.12 },
  { from: [23.5505, -46.6333] as [number,number], to: [4.711, -74.0721] as [number,number], arcAlt: 0.12 },
]


const PHRASES = [
  'protect everything you connect to the Internet',
  'connect your users, apps, clouds, and networks',
  'build and scale applications',
]

type PrincipleRowData = {
  Icon: LucideIcon
  label: string
  color: string
  left: { title: string; desc: string }
  right: { title: string; desc: string }
}

const PRINCIPLE_ROWS: PrincipleRowData[] = [
  {
    Icon: SlidersHorizontal,
    label: 'Control Plane',
    color: '#fbad41',
    left: { title: 'Single user interface & API', desc: 'for configuration and management' },
    right: { title: 'End-to-end visibility', desc: 'for every traffic flow' },
  },
  {
    Icon: Database,
    label: 'Data Plane',
    color: '#f6821f',
    left: { title: 'Comprehensive on-ramps', desc: 'for devices, branches, data centers, and clouds' },
    right: { title: 'Consistent security controls', desc: "across everything that's connected" },
  },
  {
    Icon: Network,
    label: 'Infrastructure',
    color: '#ff6633',
    left: { title: 'Be everywhere', desc: 'because users, applications, and data are too' },
    right: { title: 'Be interconnected', desc: "so traffic gets where it's going quickly and reliably" },
  },
]

function CorePrincipleCard({ row }: { row: PrincipleRowData }) {
  const { Icon, label, color, left, right } = row
  return (
    <div className="flex rounded-2xl overflow-hidden shadow-sm border-2" style={{ borderColor: color }}>
      <div className="flex flex-col items-center justify-center p-5 min-w-[110px] w-[110px]" style={{ backgroundColor: color }}>
        <Icon className="w-8 h-8 text-white mb-3" strokeWidth={1.5} />
        <span className="text-white text-sm font-bold text-center leading-tight">{label}</span>
      </div>
      <div className="flex-1 grid items-center px-6 md:px-10 py-5 gap-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <div className="text-right min-w-0">
          <p className="font-bold text-lg md:text-xl mb-1" style={{ color }}>{left.title}</p>
          <p className="text-gray-500 text-xs md:text-sm whitespace-nowrap">{left.desc}</p>
        </div>
        <span className="font-bold text-5xl md:text-6xl" style={{ color }}>&amp;</span>
        <div className="text-left min-w-0">
          <p className="font-bold text-lg md:text-xl mb-1" style={{ color }}>{right.title}</p>
          <p className="text-gray-500 text-xs md:text-sm whitespace-nowrap">{right.desc}</p>
        </div>
      </div>
    </div>
  )
}

const TOTAL_SLIDES = 9

export default function GlobeSection() {
  const [slide, setSlide] = useState(0)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [phraseVisible, setPhraseVisible] = useState(true)
  const touchStartX = useRef(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef = useRef(0.5)
  const thetaRef = useRef(0.25)
  const isDragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let rafId = 0
    let initialized = false

    const startGlobe = () => {
      if (initialized) return
      const w = canvas.offsetWidth
      if (w === 0) return
      initialized = true

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: w * 2,
        height: w * 2,
        phi: phiRef.current,
        theta: 0.25,
        dark: 1,
        diffuse: 2.2,
        mapSamples: 20000,
        mapBrightness: 2.5,
        baseColor: [0.1, 0.18, 0.8] as [number, number, number],
        markerColor: [0.97, 0.51, 0.12] as [number, number, number],
        glowColor: [0.25, 0.13, 0.04] as [number, number, number],
        markers: CF_LOCATIONS,
        arcs: CF_ARCS,
        arcColor: [0.97, 0.51, 0.12],
        arcWidth: 0.5,
      })

      const animate = () => {
        if (!isDragging.current) {
          phiRef.current += 0.004
        }
        const width = canvas.offsetWidth
        globe!.update({ phi: phiRef.current, theta: thetaRef.current, width: width * 2, height: width * 2 })
        rafId = requestAnimationFrame(animate)
      }
      animate()
      canvas.style.opacity = '1'
    }

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) startGlobe() },
      { threshold: 0.1 }
    )
    observer.observe(canvas)

    const onResize = () => {
      const w = canvas.offsetWidth
      if (globe && w > 0) globe.update({ phi: phiRef.current, width: w * 2, height: w * 2 })
    }
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
      if (globe) globe.destroy()
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseVisible(false)
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length)
        setPhraseVisible(true)
      }, 400)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const goTo = (idx: number) => setSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, idx)))

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -50) goTo(slide + 1)
    else if (delta > 50) goTo(slide - 1)
  }

  return (
    <section
      id="home-region-earth"
      className="relative overflow-hidden h-screen"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide track */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${slide * 100}%)` }}
      >

        {/* ── Slide 0: Connectivity Cloud / SASE ─────────────────────── */}
        <div className="w-full flex-none h-full bg-white overflow-y-auto flex flex-col px-6 pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto w-full pb-10">

            {/* Top header — full width */}
            <div className="text-center mb-12 max-w-5xl mx-auto mt-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-2">
                Our connectivity cloud is the best place to
              </h2>
              <h2
                className="text-3xl md:text-4xl font-bold leading-tight mb-5 text-transparent bg-clip-text bg-gradient-to-r from-[#F6821F] to-amber-400 whitespace-nowrap"
                style={{
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  opacity: phraseVisible ? 1 : 0,
                  transform: phraseVisible ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {PHRASES[phraseIdx]}
              </h2>
              <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Over 60 cloud services on one unified platform, uniquely powered by a global cloud network. We call it the connectivity cloud.
              </p>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left — text */}
              <div>
                <div className="space-y-5">
                  {[
                    'Protect and accelerate websites and AI-enabled apps',
                    'Connect your workforce, AI agents, apps, and infrastructure',
                    'Build and secure AI agents',
                  ].map((title) => (
                    <h3 key={title} className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                      {title}
                    </h3>
                  ))}
                </div>
              </div>

              {/* Right — SASE diagram */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[460px] aspect-square">
                  <SASEDiagram />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Slides 1-3: Core Principles ──────────────────────────── */}
        {[
          PRINCIPLE_ROWS.slice(2),
          PRINCIPLE_ROWS.slice(1),
          PRINCIPLE_ROWS,
        ].map((rows, idx) => (
          <div key={idx} className="w-full flex-none h-full bg-white flex flex-col px-6 pt-16 md:pt-20 pb-[20vh]">
            <div className="max-w-4xl mx-auto w-full">
              <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mt-8">
                <span className="font-bold">Core principles</span> of the Cloudflare Connectivity Cloud
              </h2>
            </div>
            <div className="max-w-4xl mx-auto w-full mt-auto space-y-4">
              {rows.map((row) => (
                <CorePrincipleCard key={row.label} row={row} />
              ))}
            </div>
          </div>
        ))}

        {/* ── Slide 4: Region Earth globe ───────────────────────────── */}
        <div className="w-full flex-none h-full bg-gray-950 overflow-y-auto flex flex-col justify-center px-6">
          <div className="max-w-7xl mx-auto w-full py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left — text */}
              <div className="order-2 lg:order-1">
                <div className="inline-flex mb-5">
                  <span className="px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest" style={{ backgroundColor: '#FF6633', borderRadius: '4px 0 0 4px' }}>Infrastructure</span>
                  <span className="px-4 py-1.5 text-xs font-semibold border border-l-0" style={{ color: '#FF6633', borderColor: '#FF6633', borderRadius: '0 20px 20px 0' }}>Be everywhere &nbsp;&amp;&nbsp; Be interconnected</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-normal text-white leading-tight mb-5">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6821F] to-amber-400">
                    A single network
                  </span>{' '}
                  that delivers local capabilities with global scale
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {[
                    { value: '330+', unit: 'cities', desc: 'in 125+ countries, including mainland China' },
                    { value: 'w/210+', unit: 'cities', desc: 'for AI inference powered by GPUs' },
                    { value: '~50', unit: 'ms', desc: "from ~95% of the world's Internet-connected population" },
                    { value: '~13,000', unit: 'networks', desc: 'directly connect to Cloudflare, including ISPs, cloud providers, and large enterprises' },
                    { value: '477', unit: 'Tbps', desc: 'of network capacity and growing' },
                  ].map((s) => (
                    <div
                      key={s.unit + s.value}
                      className="py-2"
                    >
                      <div className="font-bold mb-2">
                        <span className="text-4xl" style={{ color: '#F6821F' }}>{s.value}</span>
                        <span className="text-xl text-white font-semibold ml-2">{s.unit}</span>
                      </div>
                      <div className="text-sm text-gray-200 leading-snug">{s.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Current as of Q4 2025. For the full list of Cloudflare PoPs visit{' '}
                  <a
                    href="https://www.cloudflare.com/en-gb/network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#F6821F' }}
                    className="hover:underline"
                  >
                    cloudflare.com/network
                  </a>
                  .
                </p>
              </div>

              {/* Right — globe */}
              <div className="order-1 lg:order-2 flex flex-col items-center justify-center gap-4">
                <div className="relative w-full max-w-[560px] aspect-square">
                  <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-3xl scale-90 pointer-events-none" />
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full opacity-0 transition-opacity duration-700 cursor-grab active:cursor-grabbing"
                    style={{ borderRadius: '50%' }}
                    onPointerDown={(e) => {
                      isDragging.current = true
                      lastPointer.current = { x: e.clientX, y: e.clientY }
                      e.currentTarget.setPointerCapture(e.pointerId)
                    }}
                    onPointerUp={() => { isDragging.current = false }}
                    onPointerCancel={() => { isDragging.current = false }}
                    onPointerMove={(e) => {
                      if (!isDragging.current) return
                      const dx = e.clientX - lastPointer.current.x
                      const dy = e.clientY - lastPointer.current.y
                      lastPointer.current = { x: e.clientX, y: e.clientY }
                      phiRef.current += dx / 200
                      thetaRef.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, thetaRef.current - dy / 200))
                    }}
                  />
                </div>
                <p className="text-xs font-semibold tracking-widest text-orange-500 uppercase">
                  Region: Earth
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ── Slide 5: Anycast Routing ───────────────────────────── */}
        <div className="w-full flex-none h-full bg-white overflow-y-auto flex flex-col px-6 pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
            <div className="inline-flex mt-8 mb-5">
              <span className="px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest" style={{ backgroundColor: '#FF6633', borderRadius: '4px 0 0 4px' }}>Infrastructure</span>
              <span className="px-4 py-1.5 text-xs font-semibold border border-l-0" style={{ color: '#FF6633', borderColor: '#FF6633', borderRadius: '0 20px 20px 0' }}>Be everywhere &nbsp;&amp;&nbsp; Be interconnected</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mb-10">
              <span className="font-bold">Anycast routing</span> to secure close to the source and accelerate to the destination
            </h2>

            <div className="flex-1 flex items-center pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

              {/* Left – Other Vendors (purple) */}
              <div className="border-2 border-purple-400 rounded-2xl overflow-hidden flex flex-col">
                <div className="py-3 px-4 text-center text-xl font-bold text-gray-800 border-b border-purple-200">
                  Other Vendors
                </div>
                <div className="h-56 p-4 flex items-center justify-center">
                  <svg viewBox="0 0 520 260" className="w-full" style={{ maxHeight: '200px' }}>
                    <defs>
                      <marker id="arr-p" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
                        <polygon points="0 0, 5 2, 0 4" fill="#1a1a1a" />
                      </marker>
                      <radialGradient id="grd-p" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#f3e8ff" />
                        <stop offset="45%" stopColor="#d8b4fe" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </radialGradient>
                      <clipPath id="gc">
                        <circle cx="260" cy="125" r="95" />
                      </clipPath>
                    </defs>
                    {/* Globe – centered at cx=260 */}
                    <circle cx="260" cy="125" r="95" fill="url(#grd-p)" stroke="#a855f7" strokeWidth="2" />
                    <ellipse cx="260" cy="125" rx="95" ry="22" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc)" />
                    <ellipse cx="260" cy="125" rx="95" ry="55" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.4" clipPath="url(#gc)" />
                    <line x1="165" y1="125" x2="355" y2="125" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" />
                    <ellipse cx="260" cy="125" rx="22" ry="95" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc)" />
                    <ellipse cx="260" cy="125" rx="55" ry="95" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.4" clipPath="url(#gc)" />
                    <line x1="260" y1="30" x2="260" y2="220" stroke="#a855f7" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc)" />
                    <ellipse cx="273" cy="138" rx="26" ry="36" fill="#9333ea" opacity="0.45" clipPath="url(#gc)" />
                    {/* Server card centered on globe */}
                    <rect x="205" y="83" width="110" height="96" rx="4" fill="white" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="260" y="97" textAnchor="middle" fontSize="12" fill="#6d28d9" fontFamily="sans-serif">app.domain.com</text>
                    <text x="260" y="117" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#6d28d9">10.0.1.54</text>
                    <rect x="229" y="123" width="58" height="17" rx="3" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    <circle cx="238" cy="131.5" r="2.5" fill="#7c3aed" />
                    <circle cx="245" cy="131.5" r="2.5" fill="#7c3aed" />
                    <circle cx="252" cy="131.5" r="2.5" fill="#7c3aed" />
                    <circle cx="259" cy="131.5" r="2.5" fill="#7c3aed" />
                    <circle cx="266" cy="131.5" r="2.5" fill="#7c3aed" />
                    <circle cx="278" cy="131.5" r="3.5" fill="#6d28d9" />
                    <ellipse cx="260" cy="154" rx="17" ry="5" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    <rect x="243" y="154" width="34" height="10" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    <ellipse cx="260" cy="164" rx="17" ry="5" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    <rect x="243" y="164" width="34" height="7" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    <ellipse cx="260" cy="171" rx="17" ry="5" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1" />
                    {/* Destination text box – below + left of globe */}
                    <rect x="300" y="230" width="102" height="36" rx="5" fill="white" stroke="none" />
                    <path d="M312,240 C309,240 306,243 306,246 C306,251 312,257 312,257 C312,257 318,251 318,246 C318,243 315,240 312,240 Z" fill="#6b7280" />
                    <circle cx="312" cy="246" r="3" fill="white" />
                    <text x="323" y="242" fontSize="12" fill="#374151" fontFamily="sans-serif">app.domain.com</text>
                    <text x="323" y="254" fontSize="12" fill="#374151" fontFamily="sans-serif">104.18.29.74</text>
                    {/* Left users – symmetric around x=260 */}
                    <circle cx="43" cy="42" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="43" cy="36" r="7" fill="#3b82f6" />
                    <path d="M31,55 C31,47 55,47 55,55" fill="#3b82f6" />
                    <circle cx="22" cy="125" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="22" cy="119" r="7" fill="#3b82f6" />
                    <path d="M10,138 C10,130 34,130 34,138" fill="#3b82f6" />
                    <circle cx="43" cy="210" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="43" cy="204" r="7" fill="#3b82f6" />
                    <path d="M31,223 C31,215 55,215 55,223" fill="#3b82f6" />
                    {/* Right users – mirror of left users */}
                    <circle cx="477" cy="42" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="477" cy="36" r="7" fill="#3b82f6" />
                    <path d="M465,55 C465,47 489,47 489,55" fill="#3b82f6" />
                    <circle cx="498" cy="125" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="498" cy="119" r="7" fill="#3b82f6" />
                    <path d="M486,138 C486,130 510,130 510,138" fill="#3b82f6" />
                    <circle cx="477" cy="210" r="22" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="477" cy="204" r="7" fill="#3b82f6" />
                    <path d="M465,223 C465,215 489,215 489,223" fill="#3b82f6" />
                    {/* Left arrows – start at circle right-edge centre, arrive horizontally at box left edge */}
                    <path d="M 65,42 C 90,255 277,236 299,236" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                    <path d="M 44,125 C 90,265 277,248 299,248" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                    <path d="M 65,210 C 160,268 277,258 299,258" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                    {/* Right arrows – start at circle left-edge centre; top two arrive at box top, bottom at right edge */}
                    <path d="M 455,42 C 420,185 370,205 370,230" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                    <path d="M 476,125 C 460,188 390,205 390,230" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                    <path d="M 455,210 C 455,252 406,258 401,258" stroke="#1a1a1a" strokeWidth="2.5" fill="none" markerEnd="url(#arr-p)" />
                  </svg>
                </div>
                <div className="bg-purple-100 px-5 py-4">
                  <p className="text-purple-900 text-base font-bold leading-relaxed">
                    Unicast routing, in which a single IP address is associated with a single server, data center, and/or application, means requests to access that application may have very different routing experiences
                  </p>
                </div>
              </div>

              {/* Right – Cloudflare (orange) */}
              <div className="border-2 border-orange-400 rounded-2xl overflow-hidden flex flex-col">
                <div className="py-3 px-4 text-center text-xl font-bold text-gray-800 border-b border-orange-200 flex items-center justify-center gap-2">
                  Cloudflare
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-orange-400">
                    <Check className="w-3 h-3 text-orange-500" />
                  </span>
                </div>
                <div className="h-56 p-4 flex items-center justify-center">
                  <svg viewBox="0 0 640 260" className="w-full" style={{ maxHeight: '200px' }}>
                    <defs>
                      <marker id="arr-cf" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
                        <polygon points="0 0, 5 2, 0 4" fill="#1a1a1a" />
                      </marker>
                      <radialGradient id="grd-cf" cx="38%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#fff7ed" />
                        <stop offset="45%" stopColor="#fed7aa" />
                        <stop offset="100%" stopColor="#f97316" />
                      </radialGradient>
                      <clipPath id="gc-cf">
                        <circle cx="320" cy="120" r="95" />
                      </clipPath>
                    </defs>
                    {/* Globe – centered at cx=320 */}
                    <circle cx="320" cy="120" r="95" fill="url(#grd-cf)" stroke="#f97316" strokeWidth="2" />
                    <ellipse cx="320" cy="120" rx="95" ry="22" fill="none" stroke="#ea580c" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc-cf)" />
                    <ellipse cx="320" cy="120" rx="95" ry="55" fill="none" stroke="#ea580c" strokeWidth="0.8" opacity="0.4" clipPath="url(#gc-cf)" />
                    <line x1="225" y1="120" x2="415" y2="120" stroke="#ea580c" strokeWidth="0.8" opacity="0.5" />
                    <ellipse cx="320" cy="120" rx="22" ry="95" fill="none" stroke="#ea580c" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc-cf)" />
                    <ellipse cx="320" cy="120" rx="55" ry="95" fill="none" stroke="#ea580c" strokeWidth="0.8" opacity="0.4" clipPath="url(#gc-cf)" />
                    <line x1="320" y1="25" x2="320" y2="215" stroke="#ea580c" strokeWidth="0.8" opacity="0.5" clipPath="url(#gc-cf)" />
                    <ellipse cx="335" cy="133" rx="28" ry="38" fill="#ea580c" opacity="0.35" clipPath="url(#gc-cf)" />
                    {/* Server card centered on globe */}
                    <rect x="265" y="80" width="110" height="98" rx="4" fill="white" stroke="#f97316" strokeWidth="1.5" />
                    <text x="320" y="94" textAnchor="middle" fontSize="12" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="320" y="114" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#c2410c">10.0.1.54</text>
                    <rect x="291" y="120" width="58" height="17" rx="3" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    <circle cx="298" cy="128.5" r="2.5" fill="#f97316" />
                    <circle cx="305" cy="128.5" r="2.5" fill="#f97316" />
                    <circle cx="312" cy="128.5" r="2.5" fill="#f97316" />
                    <circle cx="319" cy="128.5" r="2.5" fill="#f97316" />
                    <circle cx="326" cy="128.5" r="2.5" fill="#f97316" />
                    <circle cx="338" cy="128.5" r="3.5" fill="#ea580c" />
                    <ellipse cx="320" cy="151" rx="17" ry="5" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    <rect x="303" y="151" width="34" height="10" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    <ellipse cx="320" cy="161" rx="17" ry="5" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    <rect x="303" y="161" width="34" height="7" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    <ellipse cx="320" cy="168" rx="17" ry="5" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                    {/* Left users */}
                    <circle cx="43" cy="42" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="43" cy="36" r="7" fill="#3b82f6" />
                    <path d="M32,54 C32,47 54,47 54,54" fill="#3b82f6" />
                    <circle cx="22" cy="122" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="22" cy="116" r="7" fill="#3b82f6" />
                    <path d="M11,134 C11,127 33,127 33,134" fill="#3b82f6" />
                    <circle cx="43" cy="205" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="43" cy="199" r="7" fill="#3b82f6" />
                    <path d="M32,217 C32,210 54,210 54,217" fill="#3b82f6" />
                    {/* Right users – mirror around cx=320 (640 − left cx) */}
                    <circle cx="597" cy="42" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="597" cy="36" r="7" fill="#3b82f6" />
                    <path d="M586,54 C586,47 608,47 608,54" fill="#3b82f6" />
                    <circle cx="618" cy="122" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="618" cy="116" r="7" fill="#3b82f6" />
                    <path d="M607,134 C607,127 629,127 629,134" fill="#3b82f6" />
                    <circle cx="597" cy="205" r="20" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="597" cy="199" r="7" fill="#3b82f6" />
                    <path d="M586,217 C586,210 608,210 608,217" fill="#3b82f6" />
                    {/* Left arrows → pins → text */}
                    <line x1="64" y1="42" x2="84" y2="42" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M88,36 C85,36 82,39 82,42 C82,47 88,53 88,53 C88,53 94,47 94,42 C94,39 91,36 88,36 Z" fill="#F6821F" />
                    <circle cx="88" cy="42" r="2.5" fill="white" />
                    <text x="98" y="38" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="98" y="56" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    <line x1="43" y1="122" x2="63" y2="122" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M67,116 C64,116 61,119 61,122 C61,127 67,133 67,133 C67,133 73,127 73,122 C73,119 70,116 67,116 Z" fill="#F6821F" />
                    <circle cx="67" cy="122" r="2.5" fill="white" />
                    <text x="77" y="118" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="77" y="136" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    <line x1="64" y1="205" x2="84" y2="205" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M88,199 C85,199 82,202 82,205 C82,210 88,216 88,216 C88,216 94,210 94,205 C94,202 91,199 88,199 Z" fill="#F6821F" />
                    <circle cx="88" cy="205" r="2.5" fill="white" />
                    <text x="98" y="201" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="98" y="219" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    {/* Right arrows ← pins ← text (mirror: 640 − left) */}
                    <line x1="576" y1="42" x2="556" y2="42" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M552,36 C549,36 546,39 546,42 C546,47 552,53 552,53 C552,53 558,47 558,42 C558,39 555,36 552,36 Z" fill="#F6821F" />
                    <circle cx="552" cy="42" r="2.5" fill="white" />
                    <text x="542" y="38" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="542" y="56" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    <line x1="597" y1="122" x2="577" y2="122" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M573,116 C570,116 567,119 567,122 C567,127 573,133 573,133 C573,133 579,127 579,122 C579,119 576,116 573,116 Z" fill="#F6821F" />
                    <circle cx="573" cy="122" r="2.5" fill="white" />
                    <text x="563" y="118" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="563" y="136" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    <line x1="576" y1="205" x2="556" y2="205" stroke="#1a1a1a" strokeWidth="2" markerEnd="url(#arr-cf)" />
                    <path d="M552,199 C549,199 546,202 546,205 C546,210 552,216 552,216 C552,216 558,210 558,205 C558,202 555,199 552,199 Z" fill="#F6821F" />
                    <circle cx="552" cy="205" r="2.5" fill="white" />
                    <text x="542" y="201" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">app.domain.com</text>
                    <text x="542" y="219" textAnchor="end" fontSize="16" fill="#c2410c" fontFamily="sans-serif">104.18.1.23</text>
                    {/* Data centers label – bottom centre */}
                    <path d="M255,250 C251,246 249,243 249,240 C249,236 252,234 255,234 C258,234 261,236 261,240 C261,243 259,246 255,250 Z" fill="#F6821F" />
                    <circle cx="255" cy="240" r="2.5" fill="white" />
                    <text x="267" y="244" fontSize="14" fill="#ea580c" fontWeight="600" fontFamily="sans-serif">Data centers in 300+ cities</text>
                  </svg>
                </div>
                <div className="bg-orange-100 px-5 py-4">
                  <p className="text-orange-900 text-base font-bold leading-relaxed">
                    Anycast enables Cloudflare to announce the IP addresses of our services from every data center worldwide. Traffic is routed to the closest data center — with no backhauling or performance tradeoffs
                  </p>
                </div>
              </div>

            </div>
            </div>
          </div>
        </div>

        {/* ── Slide 6: Comprehensive On-Ramps ───────────────────────── */}
        <div className="w-full flex-none h-full bg-white overflow-y-auto flex flex-col px-6 pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
            <div className="inline-flex mt-8 mb-5">
              <span className="px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest" style={{ backgroundColor: '#F6821F', borderRadius: '4px 0 0 4px' }}>Data Plane</span>
              <span className="px-4 py-1.5 text-xs font-semibold border border-l-0" style={{ color: '#F6821F', borderColor: '#F6821F', borderRadius: '0 20px 20px 0' }}>Comprehensive on-ramps &nbsp;&amp;&nbsp; Consistent security controls</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mb-10">
              <span className="font-bold">Comprehensive on-ramps</span> to connect and protect people, branches, clouds, data centers, applications, and/or IoT to any resource
            </h2>
            <div className="flex-1 flex items-center pb-6">
            <div className="grid items-center w-full gap-8" style={{ gridTemplateColumns: '1fr 2fr' }}>
              {/* Left – text */}
              <div className="w-fit">
                <p className="text-gray-800 text-lg leading-relaxed mb-6 whitespace-nowrap">
                  Connecting <span className="font-bold text-orange-500">&ldquo;any-to-any&rdquo;</span> is not enough
                </p>
                <p className="text-gray-800 text-lg leading-relaxed">
                  The future of networking is one{' '}
                  <span className="font-bold text-orange-500">&ldquo;end-to-end&rdquo;</span>{' '}
                  architecture &ndash; connecting{' '}
                  <span className="italic text-orange-500">any</span> source to{' '}
                  <span className="italic text-orange-500">any</span> destination from{' '}
                  <span className="italic text-orange-500">anywhere</span> with commodity Internet as the underlay
                </p>
              </div>
              {/* Right – diagram */}
              <div className="flex items-center justify-center">
                {/* SVG replaced by R2-hosted image */}
                <img
                  src="/r2/Cloudflare_onramps.png"
                  alt="Comprehensive on-ramps diagram"
                  className="w-full h-auto"
                  style={{ maxHeight: '520px', objectFit: 'contain' }}
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* ── Slide 7: Every service on every server ───────────────── */}
        <div className="w-full flex-none h-full bg-white overflow-y-auto flex flex-col px-6 pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
            <div className="inline-flex mt-8 mb-5">
              <span className="px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest" style={{ backgroundColor: '#F6821F', borderRadius: '4px 0 0 4px' }}>Data Plane</span>
              <span className="px-4 py-1.5 text-xs font-semibold border border-l-0" style={{ color: '#F6821F', borderColor: '#F6821F', borderRadius: '0 20px 20px 0' }}>Comprehensive on-ramps &nbsp;&amp;&nbsp; Consistent security controls</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mb-10">
              <span className="font-bold">Every service built to run on every server</span> in every data center
            </h2>
            <div className="flex-1 flex items-center pb-6">
              <div className="flex justify-center w-full">
                <img
                  src="/r2/Cloudflare_services.png"
                  alt="Every service on every server diagram"
                  className="h-auto"
                  style={{ maxHeight: '494px', maxWidth: '95%', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide 8: Unified Control Plane ──────────────────────── */}
        <div className="w-full flex-none h-full bg-white overflow-y-auto flex flex-col px-6 pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
            <div className="inline-flex mt-8 mb-5">
              <span className="px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest" style={{ backgroundColor: 'rgb(251, 173, 65)', borderRadius: '4px 0 0 4px' }}>Control Plane</span>
              <span className="px-4 py-1.5 text-xs font-semibold border border-l-0" style={{ color: 'rgb(251, 173, 65)', borderColor: 'rgb(251, 173, 65)', borderRadius: '0 20px 20px 0' }}>Single user interface &amp; API &nbsp;&amp;&nbsp; End-to-end visibility</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-normal text-gray-900 mb-4">
              <span className="font-bold">A unified control plane</span> minimizes complexity, lowers IT overhead, and improves performance
            </h2>
            <div className="flex-1 flex items-center justify-center pb-4">
              {/* Diagram replaced by R2-hosted image */}
              <img
                src="/r2/Cloudflare_controlplane.png"
                alt="Unified control plane diagram"
                className="h-auto"
                style={{ maxHeight: '480px', maxWidth: '95%', objectFit: 'contain' }}
              />
              <svg viewBox="0 0 0 0" style={{ display: 'none' }}>
                <defs>
                  <marker id="cp-arr" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0,6 2,0 4" fill="#374151" /></marker>
                </defs>
                {/* LEFT: Other Vendors */}
                <text x="225" y="13" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2937" fontFamily="sans-serif">Other Vendors</text>
                <rect x="35" y="18" width="380" height="235" rx="5" fill="white" stroke="#9333ea" strokeWidth="1.5" />
                <text x="8" y="37" fontSize="8" fill="#374151" fontFamily="sans-serif">Traffic</text>
                <text x="8" y="47" fontSize="8" fill="#374151" fontFamily="sans-serif">sources</text>
                <rect x="10" y="53" width="18" height="18" rx="2" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <circle cx="19" cy="106" r="10" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <polygon points="19,130 29,145 19,160 9,145" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <polygon points="19,172 27,177 27,189 19,194 11,189 11,177" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <line x1="28" y1="62" x2="44" y2="62" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="62" x2="44" y2="118" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="106" x2="44" y2="62" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="106" x2="44" y2="118" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="145" x2="44" y2="118" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="145" x2="44" y2="175" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="28" y1="183" x2="44" y2="200" stroke="#1a1a1a" strokeWidth="0.8" />
                <rect x="44" y="47" width="58" height="30" rx="3" fill="#7c3aed" />
                <text x="73" y="60" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="sans-serif">Control</text>
                <text x="73" y="70" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="sans-serif">Plane 1</text>
                <rect x="44" y="103" width="58" height="30" rx="3" fill="#7c3aed" />
                <text x="73" y="116" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="sans-serif">Control</text>
                <text x="73" y="126" textAnchor="middle" fontSize="7.5" fill="white" fontFamily="sans-serif">Plane 2</text>
                <rect x="44" y="163" width="58" height="24" rx="3" fill="#7c3aed" opacity="0.75" />
                <text x="73" y="173" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">Control</text>
                <text x="73" y="182" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">Plane 3</text>
                <rect x="44" y="192" width="58" height="24" rx="3" fill="#7c3aed" opacity="0.75" />
                <text x="73" y="202" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">Control</text>
                <text x="73" y="211" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">Plane 4</text>
                <rect x="110" y="24" width="295" height="74" rx="3" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                <text x="257" y="39" textAnchor="middle" fontSize="8.5" fill="#374151" fontFamily="sans-serif">Network 1</text>
                <circle cx="165" cy="68" r="13" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="165" y="89" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service A</text>
                <rect x="243" y="55" width="26" height="26" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="256" y="89" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service B</text>
                <polygon points="335,54 339,64 349,64 341,71 344,81 335,75 326,81 329,71 321,64 331,64" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="335" y="89" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service C</text>
                <rect x="110" y="103" width="295" height="74" rx="3" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                <text x="257" y="118" textAnchor="middle" fontSize="8.5" fill="#374151" fontFamily="sans-serif">Network 2</text>
                <polygon points="165,124 178,150 152,150" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="165" y="161" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service D</text>
                <polygon points="256,121 266,128 262,141 250,141 246,128" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="256" y="161" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service E</text>
                <polygon points="335,120 345,125 345,137 335,142 325,137 325,125" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
                <text x="335" y="161" textAnchor="middle" fontSize="7" fill="#374151" fontFamily="sans-serif">Service F</text>
                <rect x="110" y="183" width="295" height="24" rx="3" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                <text x="257" y="199" textAnchor="middle" fontSize="8.5" fill="#374151" fontFamily="sans-serif">Network 3</text>
                <rect x="110" y="212" width="295" height="24" rx="3" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                <text x="257" y="228" textAnchor="middle" fontSize="8.5" fill="#374151" fontFamily="sans-serif">Network 4</text>
                <line x1="405" y1="61" x2="418" y2="61" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="405" y1="106" x2="418" y2="106" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="405" y1="145" x2="418" y2="145" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="405" y1="183" x2="418" y2="183" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <text x="424" y="37" fontSize="8" fill="#374151" fontFamily="sans-serif">Resource</text>
                <text x="424" y="47" fontSize="8" fill="#374151" fontFamily="sans-serif">destinations</text>
                <rect x="422" y="53" width="18" height="18" rx="2" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <circle cx="431" cy="106" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <polygon points="431,130 441,145 431,160 421,145" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <polygon points="431,170 439,175 439,187 431,192 423,187 423,175" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <rect x="35" y="262" width="380" height="70" rx="5" fill="#f3e8ff" stroke="#9333ea" strokeWidth="1" />
                <text x="45" y="281" fontSize="9" fontWeight="700" fill="#7c3aed" fontFamily="sans-serif">Locations only run a subset of services – leading to</text>
                <text x="45" y="295" fontSize="9" fontWeight="700" fill="#7c3aed" fontFamily="sans-serif">management and integration complexity while also</text>
                <text x="45" y="309" fontSize="9" fontWeight="700" fill="#7c3aed" fontFamily="sans-serif">constraining performance</text>

                {/* RIGHT: Cloudflare */}
                <text x="645" y="13" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2937" fontFamily="sans-serif">Cloudflare</text>
                <rect x="465" y="18" width="360" height="235" rx="5" fill="white" stroke="#f97316" strokeWidth="1.5" />
                <text x="438" y="37" fontSize="8" fill="#374151" fontFamily="sans-serif">Traffic</text>
                <text x="438" y="47" fontSize="8" fill="#374151" fontFamily="sans-serif">sources</text>
                <rect x="440" y="53" width="18" height="18" rx="2" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <circle cx="449" cy="106" r="10" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <polygon points="449,130 459,145 449,160 439,145" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <polygon points="449,170 457,175 457,187 449,192 441,187 441,175" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.2" />
                <line x1="458" y1="62" x2="474" y2="120" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="458" y1="106" x2="474" y2="126" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="458" y1="145" x2="474" y2="132" stroke="#1a1a1a" strokeWidth="0.8" />
                <line x1="458" y1="181" x2="474" y2="140" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <rect x="472" y="103" width="65" height="58" rx="4" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />
                <text x="504" y="126" textAnchor="middle" fontSize="9" fill="#374151" fontFamily="sans-serif">Control</text>
                <text x="504" y="139" textAnchor="middle" fontSize="9" fill="#374151" fontFamily="sans-serif">Plane</text>
                <line x1="537" y1="120" x2="553" y2="100" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="537" y1="138" x2="553" y2="162" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <rect x="550" y="28" width="265" height="215" rx="4" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                <circle cx="598" cy="88" r="14" fill="#f97316" />
                <text x="598" y="111" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service A</text>
                <rect x="657" y="74" width="28" height="28" fill="#f97316" />
                <text x="671" y="111" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service B</text>
                <polygon points="740,72 744,83 755,83 746,90 749,101 740,95 731,101 734,90 725,83 736,83" fill="#f97316" />
                <text x="740" y="111" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service C</text>
                <polygon points="598,138 612,163 584,163" fill="#f97316" />
                <text x="598" y="174" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service D</text>
                <polygon points="671,136 681,143 677,156 665,156 661,143" fill="#f97316" />
                <text x="671" y="174" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service E</text>
                <polygon points="740,136 750,141 750,153 740,158 730,153 730,141" fill="#f97316" />
                <text x="740" y="174" textAnchor="middle" fontSize="7.5" fill="#374151" fontFamily="sans-serif">Service F</text>
                <line x1="815" y1="98" x2="832" y2="62" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="815" y1="112" x2="832" y2="106" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="815" y1="148" x2="832" y2="145" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <line x1="815" y1="162" x2="832" y2="181" stroke="#1a1a1a" strokeWidth="0.8" markerEnd="url(#cp-arr)" />
                <text x="836" y="37" fontSize="8" fill="#374151" fontFamily="sans-serif">Resource</text>
                <text x="836" y="47" fontSize="8" fill="#374151" fontFamily="sans-serif">destinations</text>
                <rect x="834" y="53" width="18" height="18" rx="2" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <circle cx="843" cy="106" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <polygon points="843,130 853,145 843,160 833,145" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <polygon points="843,170 851,175 851,187 843,192 835,187 835,175" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.2" />
                <rect x="465" y="262" width="360" height="70" rx="5" fill="#fff7ed" stroke="#f97316" strokeWidth="1" />
                <text x="475" y="281" fontSize="9" fontWeight="700" fill="#ea580c" fontFamily="sans-serif">Single control plane with single-pass inspection</text>
                <text x="475" y="295" fontSize="9" fontWeight="700" fill="#ea580c" fontFamily="sans-serif">simplifies management and integration while also</text>
                <text x="475" y="309" fontSize="9" fontWeight="700" fill="#ea580c" fontFamily="sans-serif">minimizing any impact to performance</text>
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* ── Navigation arrows ───────────────────────────────────────── */}
      <button
        onClick={() => goTo(slide - 1)}
        disabled={slide === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md border border-gray-200 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={() => goTo(slide + 1)}
        disabled={slide === TOTAL_SLIDES - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md border border-gray-200 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* ── Dot indicators ──────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === slide ? 'w-6 h-2 bg-[#F6821F]' : 'w-2 h-2 bg-gray-400 hover:bg-gray-600'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

    </section>
  )
}
