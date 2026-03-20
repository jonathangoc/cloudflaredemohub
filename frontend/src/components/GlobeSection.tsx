import { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'
import { ChevronLeft, ChevronRight, Database, Network, SlidersHorizontal, type LucideIcon } from 'lucide-react'
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
  { location: [34.6037, -58.3816] as [number, number], size: 0.06 },
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
  { from: [40.7128, -74.006] as [number,number], to: [34.6037, -58.3816] as [number,number], arcAlt: 0.22 },
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
  // South America internal
  { from: [23.5505, -46.6333] as [number,number], to: [34.6037, -58.3816] as [number,number], arcAlt: 0.1 },
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

const TOTAL_SLIDES = 5

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
        mapBrightness: 1,
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
