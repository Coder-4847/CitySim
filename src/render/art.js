export function polygon(ctx, points, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function diamond(ctx, x, y, w, h, fill, stroke) { polygon(ctx, [[x, y - h], [x + w, y], [x, y + h], [x - w, y]], fill, stroke); }
export function box(ctx, x, y, w, d, height, colors) {
  const [top, left, right] = colors;
  polygon(ctx, [[x - w, y], [x, y + d], [x, y + d - height], [x - w, y - height]], left);
  polygon(ctx, [[x, y + d], [x + w, y], [x + w, y - height], [x, y + d - height]], right);
  diamond(ctx, x, y - height, w, d, top);
}
export function tree(ctx, x, y, variant, t) {
  ctx.fillStyle = '#42594b33'; ctx.beginPath(); ctx.ellipse(x + 5, y + 3, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#78634d'; ctx.fillRect(x - 1, y - 11, 2, 12);
  const sway = Math.sin(t * .7 + variant) * .4;
  const colors = ['#39765e', '#519775', '#78ac80'];
  if(variant%3===0){
    for(const [dx,dy,r,color] of [[-4,-18,7,'#39765e'],[5,-20,8,'#519775'],[0,-27,8,'#78ac80']]){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x+dx+sway,y+dy,r,r*1.05,0,0,Math.PI*2);ctx.fill();}
    return;
  }
  for (let l = 0; l < 3; l++) polygon(ctx, [[x - 8 + l * 1.5 + sway, y - 8 - l * 6], [x + 8 - l * 1.5 + sway, y - 8 - l * 6], [x + sway, y - 25 - l * 3]], colors[(l + variant) % 3]);
}
function windows(ctx, x, y, w, height, color) {
  facade(ctx,x,y,w,height,color);
}
export function buildingShape(b){
  const tier=b.density||1,level=b.level,v=b.variant;
  const heights={residential:[10+level*3+v%3,21+level*6,42+level*8],commercial:[9+level*3,20+level*5,34+level*7],industrial:[10+level*2,14+level*3,20+level*3],office:[13+level*4,27+level*6,48+level*9]};
  return {height:heights[b.type][tier-1],width:b.type==='industrial'?18:b.type==='commercial'?17:15,roof:b.type==='residential'&&tier===1?7:3};
}
function facade(ctx,x,y,w,h,glass,lit=false){
  // Windows lie on the wall planes, not flat screen-aligned rectangles.
  for(let row=0;row<Math.floor((h-4)/7);row++)for(let n=0;n<3;n++){
    const offset=3+n*(w-4)/3,top=y-h+4+row*7;
    const color=lit&&(row+n)%3!==0?'#ffd991':glass;
    polygon(ctx,[[x-w+offset,top+offset/2],[x-w+offset+2.4,top+(offset+2.4)/2],[x-w+offset+2.4,top+(offset+2.4)/2+3.5],[x-w+offset,top+offset/2+3.5]],color);
    polygon(ctx,[[x+offset,top+(w-offset)/2],[x+offset+2.4,top+(w-offset-2.4)/2],[x+offset+2.4,top+(w-offset-2.4)/2+3.5],[x+offset,top+(w-offset)/2+3.5]],color);
  }
}
export function building(ctx,b,x,y,time,lit=false){
  const {height:h,width:w}=buildingShape(b),d=w/2,v=b.variant,tier=b.density||1;
  diamond(ctx,x,y,22,11,b.type==='residential'?'#a8bc8d':'#c2c5b4');
  polygon(ctx,[[x-w,y],[x+w,y],[x+w+9,y+6],[x+7,y+13]],'#28434b24');
  if(b.progress<1){
    diamond(ctx,x,y,20,10,'#cab692');const bh=3+b.progress*h;
    box(ctx,x,y,w,d,bh,['#c8c4b4','#e1d5b8','#9eab9e']);
    ctx.strokeStyle='#dba852';ctx.lineWidth=1.2;
    for(const dx of [-w,w]){ctx.beginPath();ctx.moveTo(x+dx,y);ctx.lineTo(x+dx,y-bh-5);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w,y-h-12);ctx.lineTo(x-w,y-h-12);ctx.stroke();
    const lift=(Math.sin(time*1.4+b.id)*.5+.5)*Math.max(5,h*.5);ctx.strokeStyle='#687b76';ctx.beginPath();ctx.moveTo(x-w,y-h-12);ctx.lineTo(x-w,y-h-9+lift);ctx.stroke();
    box(ctx,x-w,y-h-9+lift,3,1.5,3,['#dbbe79','#aa915f','#7e795f']);return;
  }
  if(b.status==='abandoned'){
    box(ctx,x,y,w,d,h,['#899087','#b3af9a','#828d82']);facade(ctx,x,y,w,h,'#485b57');
    polygon(ctx,[[x-w+3,y-6],[x-3,y],[x-3,y-3],[x-w+3,y-9]],'#b6986e');return;
  }
  if(b.type==='residential'){
    const walls=[['#dce5d1','#f2e8d0','#bdc4ab'],['#eed8b5','#f7e6c9','#c6aa8c'],['#d6e3e2','#edf2e3','#a3bec0'],['#dac5b4','#edd4be','#b59782']][v%4];
    box(ctx,x,y,w,d,h,walls);facade(ctx,x,y,w,h,'#507c84',lit);
    if(tier===1){
      const yy=y-h,roof=v%2?'#577c7c':'#ba7057';
      polygon(ctx,[[x,y-d-h],[x+w,yy],[x+w/2,yy+d/2-7],[x-w/2,yy-d/2-7]],v%2?'#769795':'#d79871');
      polygon(ctx,[[x-w,yy],[x,yy+d],[x+w/2,yy+d/2-7],[x-w/2,yy-d/2-7]],roof);
      polygon(ctx,[[x,yy+d],[x+w,yy],[x+w/2,yy+d/2-7]],walls[2]);
      box(ctx,x-6,y-h-5,2,1,6,['#d8c9b0','#a68d75','#8d7a66']);
      box(ctx,x-3,y+4,2.4,1.2,7,['#49756b','#53766b','#36584f']);
      diamond(ctx,x+12,y+6,6,2.5,'#5d926d');
    }else{
      box(ctx,x,y-h,w+1,d+.5,2,['#d2d4c4','#e5e4d1','#9aaea1']);
      for(let floor=1;floor<Math.floor(h/9);floor++)polygon(ctx,[[x-w,y-floor*9],[x,y+d-floor*9],[x+w,y-floor*9],[x+w,y-floor*9+1],[x,y+d-floor*9+1],[x-w,y-floor*9+1]],'#b6c5b3');
      if(tier===3)box(ctx,x+2,y-h-2,7,3.5,6,['#8dada2','#aebeb0','#72968d']);
    }
  }else if(b.type==='commercial'){
    box(ctx,x,y,w,d,h,['#78948d','#f0dfbd','#bbbfaa']);facade(ctx,x,y,w,h,'#558b94',lit);
    box(ctx,x,y-h,w+1,d+.5,2,['#b6c5b4','#dbe0c7','#8ea99b']);
    const awning=v%2?'#cc9360':'#459785';
    polygon(ctx,[[x-w-1,y-6],[x,y+d-6],[x,y+d-3],[x-w-1,y-3]],awning);
    for(let n=0;n<4;n++)polygon(ctx,[[x-w+n*4,y-6+n*2],[x-w+n*4+2,y-5+n*2],[x-w+n*4+2,y-2+n*2],[x-w+n*4,y-3+n*2]],'#fff1d1');
    box(ctx,x+6,y-h-2,5,2.5,4,['#8da5a0','#c7d0bc','#688b85']);
  }else if(b.type==='office'){
    box(ctx,x,y,w,d,h,['#658c99','#a5cbd0','#638f9f']);facade(ctx,x,y,w,h,'#355e78',lit);
    for(let n=1;n<Math.floor(h/8);n++)polygon(ctx,[[x-w,y-n*8],[x,y+d-n*8],[x+w,y-n*8],[x+w,y-n*8+1],[x,y+d-n*8+1],[x-w,y-n*8+1]],'#c0d9d5');
    box(ctx,x,y-h,w+1,d+.5,2,['#e4e4cf','#b9cfca','#8aaea9']);
    box(ctx,x,y-h-2,6,3,tier===3?9:4,['#799ba2','#a3bfc0','#5e858f']);
  }else{
    box(ctx,x,y,w,d,h,['#9aabb0','#d1c4ac','#92a7a4']);
    for(let n=-1;n<=1;n++)box(ctx,x+n*10,y-h,5,2.5,3,['#c6d0c5','#8ea29b','#758f89']);
    polygon(ctx,[[x-w+3,y-9],[x-4,y-2],[x-4,y+1],[x-w+3,y-6]],'#607f82');
    if(v%3===0){box(ctx,x+10,y-4,3,1.5,h+9,['#9d8c77','#b69677','#7e7765']);for(let n=0;n<2;n++){const a=(time*.23+n*.5)%1;ctx.fillStyle=`rgba(218,225,213,${.3*(1-a)})`;ctx.beginPath();ctx.ellipse(x+10+a*12,y-h-14-a*17,3+a*6,2+a*4,0,0,Math.PI*2);ctx.fill();}}
    else{box(ctx,x+9,y+5,5,2.5,5,['#cbaa70','#9b855b','#788064']);}
  }
}
export function facility(ctx, f, x, y, time) {
  diamond(ctx, x, y, 39, 20, '#c1c6ab', '#9da991');
  if(['coal','gas','solar'].includes(f.type)){
    if(f.type==='solar'){
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const px=x+(col-row)*10,py=y+(col+row)*5-12;
        box(ctx,px,py,8,4,3,['#477d9f','#2b567b','#29495e']);
        ctx.strokeStyle='#a4d8de';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(px-6,py-3);ctx.lineTo(px+6,py-3);ctx.stroke();
      }
      box(ctx,x+23,y+10,9,4,13,['#dbe3ca','#b7c9b7','#7d9d94']);
    }else{
      box(ctx,x-5,y,27,13,23,[f.type==='coal'?'#626f6c':'#708c9b','#b7b59c','#7e918b']);
      for(let n=0;n<2;n++){
        box(ctx,x-13+n*22,y-10,5,2.5,f.type==='coal'?48:34,['#7d7e76','#b9a08a','#776e65']);
        const age=(time*.25+n*.5)%1;ctx.fillStyle=`rgba(198,207,196,${.4*(1-age)})`;ctx.beginPath();ctx.ellipse(x-13+n*22+age*9,y-(f.type==='coal'?62:48)-age*20,4+age*7,3+age*5,0,0,Math.PI*2);ctx.fill();
      }
      box(ctx,x+10,y+9,13,6,10,['#d5bc75','#c09d5d','#8a804f']);
    }
  }else if(['pump','treatment','reservoir'].includes(f.type)){
    diamond(ctx,x,y,34,17,'#a8beb1');
    for(let n=0;n<(f.type==='pump'?1:2);n++){
      box(ctx,x-12+n*24,y-3+n*6,14,7,f.type==='reservoir'?10:5,['#72bcca','#bdd1c5','#8baea8']);
      diamond(ctx,x-12+n*24,y-3+n*6-(f.type==='reservoir'?10:5),11,5.5,'#72bcca','#dcf1de');
    }
    box(ctx,x,y+10,14,7,18,['#547f8b','#e0dbc3','#a5bfb4']);
    ctx.fillStyle='#ddebd8';ctx.fillRect(x-7,y-3,4,5);ctx.fillRect(x+3,y-1,4,5);
  }else if(f.type==='cityHall'){
    box(ctx,x,y,30,15,28,['#c7c3af','#f0e4c6','#b8bba4']);
    for(let n=0;n<4;n++)box(ctx,x-23+n*8,y+2+n*3,2,1,19,['#faf0d9','#ece2c8','#c5ccb7']);
    box(ctx,x,y-28,13,6.5,15,['#608b7e','#ded9bf','#a7b5a1']);
    ctx.strokeStyle='#506b60';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-43);ctx.lineTo(x,y-60);ctx.stroke();
    polygon(ctx,[[x,y-60],[x+12,y-58+Math.sin(time*2)*2],[x+12,y-51+Math.sin(time*2)*2],[x,y-53]],'#d7a552');
  }else if (f.type === 'water') {
    for (const dx of [-14, 14]) { ctx.fillStyle = '#638087'; ctx.fillRect(x + dx - 2, y - 40, 3, 45); }
    box(ctx, x, y - 28, 22, 11, 25, ['#afd5d3', '#84b8bf', '#5b8d9b']);
    box(ctx, x, y - 53, 23, 12, 4, ['#d8e6d7', '#b5cfd0', '#8eaeb4']);
    ctx.fillStyle = '#e6eddf'; ctx.fillRect(x - 13, y - 43, 12, 4);
    box(ctx, x + 19, y + 2, 9, 5, 10, ['#a5a992', '#d5d3b9', '#a3b4aa']);
  } else if (f.type === 'wind') {
    box(ctx, x - 12, y + 4, 11, 5.5, 9, ['#7b8e83', '#e4e5cf', '#b3c7b8']);
    ctx.strokeStyle = '#f1eddb'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 6, y + 5); ctx.lineTo(x + 6, y - 64); ctx.stroke();
    ctx.strokeStyle = '#fcf9e9'; ctx.lineWidth = 2.8;
    for (let n = 0; n < 3; n++) {
      const a = time * .75 + n * Math.PI * 2 / 3;
      ctx.beginPath(); ctx.moveTo(x + 6, y - 64); ctx.lineTo(x + 6 + Math.cos(a) * 25, y - 64 + Math.sin(a) * 25); ctx.stroke();
    }
    ctx.fillStyle = '#809c9b'; ctx.beginPath(); ctx.arc(x + 6, y - 64, 4, 0, 6.29); ctx.fill();
  } else if(f.type==='busDepot'){
    box(ctx,x-3,y-3,29,14,20,['#657f8c','#e1dcc5','#a4b6b0']);
    for(let n=0;n<3;n++){box(ctx,x-18+n*12,y+n*3,5,3,9,['#f0ce75','#ba944a','#7d8064']);}
  } else if (['park','cityPark'].includes(f.type)) {
    diamond(ctx,x,y,37,18,'#8eb083');
    polygon(ctx,[[x-30,y-3],[x-25,y-6],[x+29,y+5],[x+24,y+8]],'#dbcfab');
    tree(ctx,x-20,y+3,2,time); tree(ctx,x+22,y-2,1,time);
    box(ctx,x,y-2,9,4,3,['#bdd4d0','#85b5be','#6e9fa9']);
    ctx.fillStyle='#e6faff';ctx.fillRect(x-1,y-14,2,9);
    for(let n=0;n<5;n++){const phase=(time*.7+n*.2)%1;ctx.globalAlpha=1-phase;ctx.beginPath();ctx.arc(x+Math.sin(n*2.4)*phase*8,y-14+phase*phase*13,1,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    box(ctx,x+11,y+9,7,2,3,['#bea37b','#917c5e','#74694f']);
  } else {
    const medical = ['clinic','hospital'].includes(f.type), education = ['school','secondary','university'].includes(f.type);
    const h = ['hospital','university','secondary','precinct','centralFire'].includes(f.type) ? 29 : 19;
    const roof = medical ? '#8cadad' : education ? '#b27a61' : ['police','precinct'].includes(f.type) ? '#648193' : ['fire','centralFire'].includes(f.type) ? '#a4604e' : '#828f72';
    box(ctx,x-5,y-2,25,12,h,[roof,'#e0d7bf','#afb7a6']);
    windows(ctx,x-5,y-2,25,h,'#61818c');
    box(ctx,x+24,y+5,10,5,8,[roof,'#cdc9af','#a0b09e']);
    if (medical) { ctx.fillStyle='#f4e9d2';ctx.fillRect(x-16,y-h+3,4,12);ctx.fillRect(x-20,y-h+7,12,4); }
    else if (['fire','centralFire'].includes(f.type)) {
      for(let n=0;n<3;n++) { ctx.fillStyle='#a75444';ctx.fillRect(x-25+n*10,y-5+n*2,7,10); }
    } else if (f.type === 'garbage') {
      for(let n=0;n<3;n++) box(ctx,x+12+n*8,y+8-n*2,5,3,7,['#b0ac78','#87916b','#657e60']);
    } else if (education) {
      ctx.strokeStyle='#9f9e87';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+27,y+4);ctx.lineTo(x+27,y-25);ctx.stroke();
      polygon(ctx,[[x+27,y-25],[x+39,y-22],[x+27,y-18]],'#d2b872');
      diamond(ctx,x+17,y+13,10,4,'#cbb995');
    } else if (['police','precinct'].includes(f.type)) {
      polygon(ctx,[[x-17,y-h+5],[x-9,y-h+8],[x-13,y-h+16]],'#cfb36f');
      ctx.strokeStyle='#617a87';ctx.beginPath();ctx.moveTo(x+7,y-h);ctx.lineTo(x+7,y-h-14);ctx.stroke();
    }
  }
}
