// Static shop geometry — manually defined once per docs/07-3d-navigation.md.
// Not database-backed: the physical layout changes rarely, and editing this
// file when the shop rearranges a shelf is a trivial occasional dev task.
//
// Cabinet colors deliberately avoid red (docs/07): red is reserved as the
// single "you're looking for this one" highlight signal in the scene.

export const FLOOR = { size: [16, 12], color: '#F2F2F2' };

export const WALLS = [
  { id: 'wall-back', position: [0, 1.5, -6], size: [16, 3, 0.2], color: '#D1D1D1' },
  { id: 'wall-left', position: [-8, 1.5, 0], size: [0.2, 3, 12], color: '#D1D1D1' },
  { id: 'wall-right', position: [8, 1.5, 0], size: [0.2, 3, 12], color: '#D1D1D1' },
];

export const CABINETS = [
  { id: 'A1', location_aisle: 'A1', position: [-5, 0.9, -3], size: [2, 1.8, 0.8], color: '#3A6EA5', label: 'Aisle A1' },
  { id: 'A2', location_aisle: 'A2', position: [-1.5, 0.9, -3], size: [2, 1.8, 0.8], color: '#3A6EA5', label: 'Aisle A2' },
  { id: 'A3', location_aisle: 'A3', position: [2, 0.9, -3], size: [2, 1.8, 0.8], color: '#3A6EA5', label: 'Aisle A3' },
  { id: 'B1', location_aisle: 'B1', position: [-5, 0.9, 0], size: [2, 1.8, 0.8], color: '#1E7B34', label: 'Aisle B1' },
  { id: 'B2', location_aisle: 'B2', position: [-1.5, 0.9, 0], size: [2, 1.8, 0.8], color: '#1E7B34', label: 'Aisle B2' },
  { id: 'B3', location_aisle: 'B3', position: [2, 0.9, 0], size: [2, 1.8, 0.8], color: '#1E7B34', label: 'Aisle B3' },
  { id: 'C1', location_aisle: 'C1', position: [-3.25, 0.9, 3], size: [2, 1.8, 0.8], color: '#946200', label: 'Aisle C1' },
  { id: 'C2', location_aisle: 'C2', position: [0.5, 0.9, 3], size: [2, 1.8, 0.8], color: '#946200', label: 'Aisle C2' },
];

export function findCabinet(locationAisle) {
  return CABINETS.find((c) => c.location_aisle === locationAisle) || null;
}
