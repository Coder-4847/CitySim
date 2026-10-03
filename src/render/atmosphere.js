import { atmosphere } from '../simulation/life.js';

export function drawAtmosphere(ctx,city,metrics,view,camera,time){
  if(view.overlay!=='none')return;
  const a=atmosphere(city,view.lighting||'auto'),{width:w,height:h,zoom:z}=camera;
  if(a.darkness>.01){
    ctx.fillStyle=`rgba(16,29,61,${a.darkness*.48})`;ctx.fillRect(0,0,w,h);
    // Lights belong to occupied, powered buildings; abandoned properties stay dark.
    ctx.fillStyle=`rgba(255,220,137,${a.darkness*.8})`;
    for(let i=0;i<city.cells.length;i++)if(city.cells[i].road&&i%5===0){const p=camera.project(i%city.size,Math.floor(i/city.size));if(p.x<0||p.x>w||p.y<0||p.y>h)continue;ctx.beginPath();ctx.ellipse(p.x,p.y,5*z,2*z,0,0,Math.PI*2);ctx.fill();}
  }
  if(view.weather!==false&&a.weather!=='Clear'){
    ctx.fillStyle=a.weather==='Rain'?'#5368751a':'#63778512';ctx.fillRect(0,0,w,h);
    if(!view.reducedMotion){
      ctx.fillStyle='#f3f3e512';for(let n=0;n<5;n++){const x=((time*9+n*311)%(w+400))-200;ctx.beginPath();ctx.ellipse(x,100+n*h/5,200,60,0,0,Math.PI*2);ctx.fill();}
      if(a.weather==='Rain'){ctx.strokeStyle='#cedee64d';ctx.lineWidth=1;ctx.beginPath();for(let n=0;n<100;n++){const x=(n*179+time*65)%w,y=(n*83+time*280)%h;ctx.moveTo(x,y);ctx.lineTo(x-4,y+11);}ctx.stroke();}
    }
  }
}
