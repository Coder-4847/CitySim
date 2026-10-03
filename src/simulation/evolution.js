import { effectiveTax } from './districts.js';
import { capacity, utilityNeed, buildingDefaults, clamp } from './rules.js';

export function upgradeRequirements(city, b, d, m) {
  if (b.level >= 3) return ['Maximum level reached'];
  const next = b.level + 1;
  const n = m.networks[d.component], upgraded = { ...b, level: next };
  return [
    [city.milestone >= next - 1, `Reach ${next === 2 ? 'Village' : 'Town'} stage`],
    [d.active, 'Restore roads and utilities'],
    [b.goodDays >= (next === 2 ? 120 : 240), `${next === 2 ? 120 : 240} prosperous days`],
    [city.demand[b.type] > 10, 'Positive demand above 10%'],
    [d.desirability >= (b.type === 'industrial' ? 55 : 65), 'Improve local desirability'],
    [d.landValue >= (b.type === 'industrial' ? 30 : 50), 'Improve land value'],
    [(b.type === 'residential' ? b.education : m.education) >= (next === 2 ? .28 : .55), 'Develop education'],
    [d.health >= .65 && d.coverage.garbage >= .3, 'Provide healthcare and waste collection'],
    [n && n.power >= n.powerDemand + utilityNeed(upgraded, 'power') - utilityNeed(b, 'power') && n.water >= n.waterDemand + utilityNeed(upgraded, 'water') - utilityNeed(b, 'water'), 'Reserve spare utility capacity'],
  ].filter(([ok]) => !ok).map(([, reason]) => reason);
}
export function evolve(city, m) {
  for (const b of city.buildings) {
    buildingDefaults(b);
    const d = m.details.get(b.id);
    if (b.progress < 1) {
      if (d.connected && d.power >= .95 && d.water >= .95) b.progress = Math.min(1, b.progress + 1 / b.duration);
      continue;
    }
    const collection = d.coverage.garbage / (1 + d.commuteDelay * .5);
    b.waste = clamp(b.waste + .004 - collection * .025);
    const targetEducation = .15 + d.coverage.school * .4 + d.coverage.secondary * .25 + d.coverage.university * .20;
    b.education = clamp(b.education + (targetEducation - b.education) * .006);
    const bad = !d.operable || d.desirability < 28 || effectiveTax(city,b) >= 19 ||
      (b.type !== 'residential' && m.population > 40 && d.employed < capacity(b) * .08);
    const good = !bad && d.desirability >= 55 && b.waste < .4 && b.damage < .5;
    b.badDays = bad ? b.badDays + 1 : Math.max(0, b.badDays - 2);
    b.goodDays = good ? b.goodDays + 1 : 0;
    if (b.status !== 'abandoned') {
      b.status = b.badDays >= 20 ? 'struggling' : good ? 'prosperous' : 'stable';
      if (b.badDays >= 90 || b.damage >= 1) {
        b.status = 'abandoned'; b.goodDays = 0;
        city.timeline.push({ day: city.day, text: `${b.name} is abandoned after prolonged poor conditions.` });
      }
    } else if (good && b.goodDays >= 60) {
      const n = m.networks[d.component];
      if (city.demand[b.type] > 0 && n.power >= n.powerDemand + utilityNeed(b, 'power') && n.water >= n.waterDemand + utilityNeed(b, 'water')) {
        b.status = 'stable'; b.badDays = 0; b.goodDays = 0;
        n.powerDemand += utilityNeed(b, 'power'); n.waterDemand += utilityNeed(b, 'water');
        city.timeline.push({ day: city.day, text: `${b.name} reopens as the neighborhood recovers.` });
      }
    }
    if (b.damage && d.operable && !city.incidents.some(i => i.buildingId === b.id)) b.damage = Math.max(0, b.damage - .004);
    if (b.type === 'residential') {
      const n = m.networks[d.component], jobRatio = n ? Math.min(1, n.jobs / Math.max(1, n.workers)) : 0;
      const target = d.active && d.reachableJobs!==false && b.status !== 'abandoned' ? capacity(b) * (.22 + .78 * jobRatio) * clamp((19 - effectiveTax(city,b)) / 10) * clamp(.65 + d.desirability * .005, .5, 1) * clamp(d.health / .72, .7, 1) : 0;
      b.occupants = clamp(b.occupants + clamp(target - b.occupants, -.9, .75), 0, capacity(b));
    }
    const permittedDensity=city.cells[b.cell].density||1;
    if(b.status!=='abandoned'&&b.goodDays>=60&&(b.density||1)<permittedDensity){
      const n=m.networks[d.component],next={...b,density:permittedDensity},power=utilityNeed(next,'power')-utilityNeed(b,'power'),water=utilityNeed(next,'water')-utilityNeed(b,'water');
      if(n&&n.power>=n.powerDemand+power&&n.water>=n.waterDemand+water){b.density=permittedDensity;b.goodDays=0;n.powerDemand+=power;n.waterDemand+=water;city.timeline.push({day:city.day,text:`${b.name} redevelops for density tier ${permittedDensity}.`});}
    }
    if (b.status !== 'abandoned' && !upgradeRequirements(city, b, d, m).length) {
      const n = m.networks[d.component], beforePower = utilityNeed(b, 'power'), beforeWater = utilityNeed(b, 'water');
      b.level++; b.goodDays = 0;
      n.powerDemand += utilityNeed(b, 'power') - beforePower; n.waterDemand += utilityNeed(b, 'water') - beforeWater;
      city.timeline.push({ day: city.day, text: `${b.name} expands to level ${b.level}.` });
    }
  }
  if (city.day % 4 === 0) for (let i = 0; i < city.ground.length; i++) city.ground[i] = clamp(city.ground[i] * .98 + m.fields.pollution[i] * .02, 0, 100);
}
