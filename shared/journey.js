(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GardenJourney=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const WORLDS=[
    {id:'dawn',name:'晨曦群岛',en:'THE DAWNLIGHT ISLES',title:'让失落的花园，再次苏醒。',description:'阳光穿过古老的环门，第一颗种子正在等待。',color:'#d5ad6b',asset:'assets/dawn.jpg',icon:'☀'},
    {id:'tide',name:'潮汐之境',en:'THE TIDAL SANCTUARY',title:'跟随潮汐，找回生长的节奏。',description:'水流会抬升沉睡的遗迹，也会带来新的可能。',color:'#73c5ce',asset:'assets/tide.jpg',icon:'≈'},
    {id:'night',name:'星夜回廊',en:'THE CELESTIAL GARDEN',title:'每一次消除，都点亮一颗星。',description:'在最后一片星光里，修复通往花园的回廊。',color:'#b6a3dd',asset:'assets/night.jpg',icon:'✧'}
  ];
  const LEVELS=[
    {id:0,world:0,name:'第一缕晨光',kind:'lines',target:3,moves:18,par:6,speed:1150,holes:[[4,5],[4,5],[3,4,5,6]],queue:['O','I','T'],story:'把落下的方块嵌进空隙，让晨光流入沉睡的环门。',hint:'先把正方形放进两格空隙，再用长条填平最后一行。',reward:'晨光环门',mechanic:'初始拼图'},
    {id:1,world:0,name:'沉睡的种子',kind:'seeds',target:6,moves:20,par:9,speed:1050,holes:[[4,5],[4,5],[1,2],[1,2],[6,7],[6,7]],queue:['O','O','O','I'],story:'青绿色方块里藏着生命。消除它所在的一行，唤醒种子。',hint:'先从高处开放的缺口入手，逐层向下唤醒种子。',reward:'玻璃温室',mechanic:'种子救援'},
    {id:2,world:0,name:'风车的约定',kind:'multi',target:3,moves:24,par:12,speed:1000,holes:[[3,4],[3,4],[6,7],[6,7],[1,2],[1,2]],queue:['O','O','O','T'],story:'风车需要更强的气流。完成三次同时消除两行或更多。',hint:'不要急着消掉单行，保留两行相同的缺口。',reward:'风之磨坊',mechanic:'多行消除'},
    {id:3,world:1,name:'潮水初至',kind:'seeds',target:8,moves:28,par:15,speed:1000,tide:2,holes:[[4,5],[4,5],[2,3],[2,3],[6,7],[6,7],[3,4],[3,4]],queue:['O','O','O','O'],story:'每落下两块，潮水就抬高一行。在水位升高前救出种子。',hint:'潮汐带来一行带缺口的岩石。尽量在下一次潮汐前消除底部。',reward:'潮汐水庭',mechanic:'潮汐上涨'},
    {id:4,world:1,name:'水镜回声',kind:'lines',target:10,moves:36,par:24,speed:900,tide:7,holes:[[4],[4],[4],[4],[2,3],[2,3]],queue:['I','O','T','L'],story:'在不断变化的水位里，修复十段断裂的水渠。',hint:'第一根长条需要旋转后放进竖直通道，四行消除会大幅推进目标。',reward:'水镜回廊',mechanic:'四行与潮汐'},
    {id:5,world:1,name:'奔流的花园',kind:'lines',target:12,moves:null,seconds:120,parSeconds:80,speed:820,holes:[[4,5],[4,5],[6,7],[6,7]],queue:['O','O','I','T'],story:'两分钟内接通十二段水渠，让瀑布重新流向花园。',hint:'时间只在游玩时流逝，暂停可以放心思考。善用暂存。',reward:'云间瀑布',mechanic:'限时修复'},
    {id:6,world:2,name:'星光种植者',kind:'seeds',target:10,moves:34,par:20,speed:900,holes:[[4,5],[4,5],[1,2],[1,2],[6,7],[6,7],[3,4],[3,4],[7,8],[7,8]],queue:['O','O','O','O','O'],story:'把十颗遗落的星种送回夜空，天文仪便会重新转动。',hint:'种子救援的最后一课：留意高处的空隙，避免封死下层。',reward:'星种温室',mechanic:'深层救援'},
    {id:7,world:2,name:'群星的和弦',kind:'multi',target:4,moves:32,par:20,speed:800,holes:[[4],[4],[4],[4],[1,2],[1,2],[6,7],[6,7],[3,4],[3,4]],queue:['O','O','O','I','T'],story:'完成四次多行消除，让天文仪的四枚星环一同共鸣。',hint:'一次四行也记作一次多行消除。先处理高处的双行缺口，最后用长条接通底部。',reward:'群星仪',mechanic:'多行构筑'},
    {id:8,world:2,name:'花园重生',kind:'lines',target:16,moves:48,par:34,speed:760,tide:8,holes:[[4],[4],[4],[4],[2,3],[2,3],[6,7],[6,7]],queue:['I','O','O','T'],story:'在最后一轮潮汐中点亮十六段星光，重建完整的浮岛花园。',hint:'综合运用旋转、暂存和多行消除。别让不断上涨的潮汐打乱节奏。',reward:'永恒花园',mechanic:'终章挑战'}
  ];
  const goalLabel=level=>level.kind==='seeds'?`唤醒 ${level.target} 颗种子`:level.kind==='multi'?`完成 ${level.target} 次多行消除`:`消除 ${level.target} 行`;
  class Journey {
    constructor(game,onResult=()=>{}){this.game=game;this.onResult=onResult;this.level=null;this.active=false;this.metrics={pieces:0,seeds:0,multi:0};}
    load(id){
      const level=LEVELS[id];if(!level)throw new Error('Unknown level');this.active=false;this.level=level;
      this.metrics={pieces:0,seeds:0,multi:0};this.outcome=null;this.game.reset('journey');this.game.intervalOverride=level.speed;
      level.holes.forEach((holes,i)=>{const row=this.game.board[19-i];row.fill(i%2?'M':'N');holes.forEach(x=>row[x]=null);if(level.kind==='seeds'){let x=1;while(!row[x])x++;row[x]='B';}});
      const sequence=[...level.queue,...this.game.queue];this.game.queue=sequence;this.game.spawn();this.active=true;return level;
    }
    get value(){return this.level.kind==='seeds'?this.metrics.seeds:this.level.kind==='multi'?this.metrics.multi:this.game.lines;}
    get remaining(){return this.level.moves===null?Math.max(0,Math.ceil(this.level.seconds-this.game.elapsed/1000)):Math.max(0,this.level.moves-this.metrics.pieces);}
    handle(event){
      if(!this.active)return;
      if(event.type==='clear'){this.metrics.seeds+=event.seeds||0;if(event.count>=2)this.metrics.multi++;}
      if(event.type==='over')this.finish(false,'方块抵达了天空边缘');
      if(event.type!=='lock')return;
      this.metrics.pieces++;
      if(this.value>=this.level.target){this.finish(true);return;}
      if(this.level.moves!==null&&this.metrics.pieces>=this.level.moves){this.finish(false,'修复步数已用完');return;}
      if(this.level.tide&&this.metrics.pieces%this.level.tide===0){
        const overflow=this.game.board.shift().some(Boolean);const row=Array(10).fill('N');row[(this.metrics.pieces*3+this.level.id)%10]=null;this.game.board.push(row);
        this.game.onEvent({type:'tide'});if(overflow)this.finish(false,'潮水抵达了天空边缘');
      }
    }
    update(){if(this.active&&this.game.status==='playing'&&this.level.seconds&&this.game.elapsed>=this.level.seconds*1000)this.finish(false,'本次修复时间已结束');}
    finish(won,reason=''){
      if(!this.active)return;this.active=false;this.game.status=won?'won':'over';
      const resource=this.level.seconds?this.game.elapsed/1000:this.metrics.pieces,par=this.level.parSeconds||this.level.par;
      const stars=won?(resource<=par?3:resource<=par*1.5?2:1):0;
      this.outcome={won,reason,stars,level:this.level.id,score:this.game.score,pieces:this.metrics.pieces,seconds:Math.round(this.game.elapsed/1000),reward:this.level.reward};this.onResult(this.outcome);
    }
    stop(){this.active=false;this.level=null;this.outcome=null;}
  }
  function record(progress,result){
    const next={...progress};if(result.won)next[result.level]=Math.max(Number(next[result.level])||0,result.stars);return next;
  }
  function unlocked(progress,id){return id===0||Number(progress[id-1])>0;}
  return {WORLDS,LEVELS,Journey,goalLabel,record,unlocked};
});
