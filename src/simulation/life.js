import { hashSeed } from './rules.js';

export const HONORS = {
  village:'A place to belong', transit:'The daily connection', trade:'Open for business', healthy:'Healthy neighborhoods',
};
export function newLife(){return {news:[],honors:[],lastReport:0,festivalUntil:0};}
export function atmosphere(city, mode='auto') {
  // A presentation cycle spans 120 simulation days; calendar accounting stays unchanged.
  const hour=mode==='day'?12:mode==='night'?0:(9+city.day/5)%24;
  const darkness=Math.max(0,Math.min(1,(Math.cos(hour/24*Math.PI*2)+.2)/1.2));
  const roll=hashSeed(`${city.seed}:weather:${Math.floor(city.day/30)}`)%100;
  const weather=roll<55?'Clear':roll<80?'Overcast':'Rain';
  const season=['Spring','Summer','Autumn','Winter'][Math.floor(city.day/90)%4];
  return {hour,darkness,weather,season};
}
function publish(city,key,text,cell=null){
  if(city.life.news.some(n=>n.key===key&&city.day-n.day<90))return;
  city.life.news.push({day:city.day,key,text,cell});
  if(city.life.news.length>60)city.life.news.shift();
}
export function updateLife(city,m){
  if(city.day%30!==0||city.life.lastReport===city.day)return;
  city.life.lastReport=city.day;
  const earns={village:m.population>=100,transit:m.transit.riders>=1,trade:m.trade.exports>0,healthy:m.population>=100&&m.health>=.8};
  for(const [key,earned] of Object.entries(earns))if(earned&&!city.life.honors.includes(key)){
    city.life.honors.push(key);publish(city,`honor:${key}`,`City distinction: ${HONORS[key]}.`);
    city.timeline.push({day:city.day,text:`City distinction earned: ${HONORS[key]}.`});
  }
  if(m.shortage)publish(city,'utilities',`${m.shortage} buildings need infrastructure. Check electricity, water, and street access.`,city.buildings.find(b=>{const d=m.details.get(b.id);return !d.connected||d.power<.95||d.water<.95;})?.cell??null);
  if(m.averageDelay>.3)publish(city,'traffic',`Commuters report ${Math.round(m.averageDelay*100)}% extra travel time. Transport analysis identifies the busiest streets.`);
  if(m.transit.riders>=1)publish(city,'transit',`Bus services carried ${Math.round(m.transit.riders)} commuters; projected monthly fares are $${Math.round(m.transit.revenue)}.`);
  if(m.trade.exports>0)publish(city,'trade',`Local firms ship ${Math.round(m.trade.exports)} units to outside markets.`);
  if(m.abandoned)publish(city,'decline',`${m.abandoned} buildings stand abandoned. Inspect their recovery conditions.`);
  if(m.net<0)publish(city,'budget',`The monthly operating deficit is $${Math.abs(m.net)}. Review service costs and tax income.`);
  if(m.population&&m.net>=0&&!m.shortage&&m.averageDelay<=.3)publish(city,'steady',`${m.population} residents call the city home. The operating budget is balanced and basic infrastructure is serving every building.`);
  const park=city.facilities.find(f=>['park','cityPark','cityHall'].includes(f.type)&&m.facilities.get(f.id).active);
  if(city.day%180===0&&m.population>=100&&m.health>=.65&&park&&city.treasury>=5000){
    city.treasury-=150;city.life.festivalUntil=city.day+14;
    publish(city,'festival','Neighborhood open days begin: $150 from the treasury supports 14 days of stronger housing interest.',park.cells[0]);
    city.timeline.push({day:city.day,text:'Neighborhood open days funded: $150; housing demand receives +10 target points for 14 days.'});
  }
}
export function districtIdentity(city,district,m){
  const buildings=city.buildings.filter(b=>city.cells[b.cell].district===district.id);
  const counts={residential:0,commercial:0,industrial:0,office:0};let population=0,education=0,value=0;
  for(const b of buildings){counts[b.type]++;population+=b.occupants;education+=b.education*b.occupants;value+=m.details.get(b.id).landValue;}
  const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  const identity=!buildings.length?'A neighborhood waiting to grow':dominant[0]==='industrial'?'Production quarter':dominant[0]==='office'?'Business quarter':dominant[0]==='commercial'?'Market quarter':population&&education/population>.55?'Learning neighborhood':'Residential neighborhood';
  return {identity,population:Math.round(population),buildings:buildings.length,landValue:buildings.length?Math.round(value/buildings.length):0};
}
