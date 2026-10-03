// Original quiet synthesized ambience; no external samples or automatic playback.
export class Ambience {
  unlock(){
    if(this.context){this.context.resume().catch(()=>{});return;}
    try{this.context=new AudioContext();this.gain=this.context.createGain();this.gain.gain.value=0;this.gain.connect(this.context.destination);
      this.tones=[130.81,196,261.63].map(f=>{const o=this.context.createOscillator();o.type='sine';o.frequency.value=f;o.connect(this.gain);o.start();return o;});
    }catch{}
  }
  update(volume,night,playing){if(!this.gain)return;const key=[volume,night>.5,playing].join();if(this.last===key)return;this.last=key;const t=this.context.currentTime;this.gain.gain.setTargetAtTime(playing?volume*.012:0,t,.4);this.tones.forEach((o,n)=>o.frequency.setTargetAtTime([130.81,196,261.63][n]*(night>.5?.75:1),t,2));}
}
