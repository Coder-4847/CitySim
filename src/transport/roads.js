export const ROADS = {
  road: { label: 'Local street', cost: 45, maintenance: .8, capacity: 45, speed: 1 },
  avenue: { label: 'Four-lane avenue', cost: 110, maintenance: 1.8, capacity: 100, speed: 1.4 },
  highway: { label: 'Highway', cost: 220, maintenance: 3.5, capacity: 200, speed: 2.5 },
  oneWayN: { label: 'One-way north', cost: 60, maintenance: 1, capacity: 65, speed: 1.2, dx: 0, dy: -1 },
  oneWayE: { label: 'One-way east', cost: 60, maintenance: 1, capacity: 65, speed: 1.2, dx: 1, dy: 0 },
  oneWayS: { label: 'One-way south', cost: 60, maintenance: 1, capacity: 65, speed: 1.2, dx: 0, dy: 1 },
  oneWayW: { label: 'One-way west', cost: 60, maintenance: 1, capacity: 65, speed: 1.2, dx: -1, dy: 0 },
};
export const roadRule = cell => ROADS[cell.roadType || 'road'];
export function permits(city, from, to) {
  const a=roadRule(city.cells[from]),b=roadRule(city.cells[to]);
  const dx=to%city.size-from%city.size,dy=Math.floor(to/city.size)-Math.floor(from/city.size);
  return (a.dx==null || a.dx*dx+a.dy*dy>=0) && (b.dx==null || b.dx*dx+b.dy*dy>=0);
}
export function saturation(city,i,flow,degree) {
  const cell=city.cells[i],rule=roadRule(cell);
  return flow / rule.capacity * (degree>=3 ? cell.signal ? 1 : 1.25 : 1);
}
export function travelDelay(city,i,flow,degree) {
  return Math.min(4,Math.max(0,saturation(city,i,flow,degree)-.65)**2*.42) + (city.cells[i].signal&&degree>=3?.12:0);
}
