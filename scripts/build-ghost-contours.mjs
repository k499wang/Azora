/**
 * Traces the empty-slot outline for each room slot, from the room's own art.
 *
 * A decoration is dozens of overlapping polygons, so the outline of one is not
 * a thing that exists in the data: flattening gives a lumpy blob and stroking
 * dots every internal seam. The shape is rasterized instead, its outer boundary
 * walked, and the result simplified to a single closed loop — which is a real
 * object's silhouette *and* one path, so the dotted contour comes out clean.
 *
 * A slot's outline is a list of loops, not one loop: most pieces trace as a
 * single region, but a garland is flags strung across both walls and is two
 * shapes however it is drawn. Each region is walked separately, so every loop
 * stays closed and strokeable.
 *
 * The stand-in is the option that flattens best — fewest regions first, then
 * fewest polygons. Two slots override the trace with an authored shape; see
 * `OVERRIDES`. Colour carries these decorations, so a 36-piece checkerboard
 * rug and a 5-piece cloud rug are the same footprint once flattened, and the
 * plain one keeps a shape you can name.
 *
 * Run after the room art changes:
 *   node scripts/build-ghost-contours.mjs src/features/room/roomGhostShapes.ts
 */
import fs from 'node:fs';

const src=fs.readFileSync('src/features/room/RoomScene.tsx','utf8');

// --- parse DECOR ------------------------------------------------------------
const re=/"(day\d)\.([a-z_0-9]+)":\s*\[/g;let m;const decor={};
while((m=re.exec(src))){
  let depth=0,k=m.index+m[0].length-1;
  for(;k<src.length;k++){const c=src[k];if(c==='[')depth++;else if(c===']'){depth--;if(depth===0)break;}}
  const body=src.slice(m.index,k);
  const polys=[];
  for(const e of body.split('{"p":').slice(1)){
    if(/"sh":1/.test(e.slice(0,400)))continue;
    const pts=e.match(/^"([^"]+)"/);if(!pts)continue;
    polys.push(pts[1].trim().split(/\s+/).map(p=>p.split(',').map(Number)));
  }
  (decor[m[1]]=decor[m[1]]||{})[m[2]]=polys;
}

// The stand-in is chosen after rasterizing, further down: an outline can only
// be walked around one connected region, so how the art holds together matters
// more than how few polygons it has.
const chosen={};

// --- rasterize --------------------------------------------------------------
const RES=1.2;           // viewBox units per cell
const PAD=5;             // cells of margin so the contour never clips
const CLOSE=4;           // cells of gap-closing, in a grow-then-shrink pair
function raster(polys){
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for(const p of polys)for(const [x,y] of p){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const w=Math.ceil((maxX-minX)/RES)+PAD*2, h=Math.ceil((maxY-minY)/RES)+PAD*2;
  const g=new Uint8Array(w*h);
  const inside=(px,py,poly)=>{let hit=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const [xi,yi]=poly[i],[xj,yj]=poly[j];
      if((yi>py)!==(yj>py)&&px<((xj-xi)*(py-yi))/(yj-yi)+xi)hit=!hit;
    }return hit;};
  for(let cy=0;cy<h;cy++)for(let cx=0;cx<w;cx++){
    const px=minX+(cx-PAD+0.5)*RES, py=minY+(cy-PAD+0.5)*RES;
    for(const poly of polys) if(inside(px,py,poly)){g[cy*w+cx]=1;break;}
  }
  return {g,w,h,minX,minY};
}

// --- close small gaps (dilate then erode) -----------------------------------
function morph(src,w,h,r,grow){
  const out=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let hit=grow?0:1;
    for(let dy=-r;dy<=r&&hit===(grow?0:1);dy++)for(let dx=-r;dx<=r;dx++){
      const nx=x+dx,ny=y+dy;
      const v=(nx<0||ny<0||nx>=w||ny>=h)?0:src[ny*w+nx];
      if(grow&&v){hit=1;break;} if(!grow&&!v){hit=0;break;}
    }
    out[y*w+x]=hit;
  }
  return out;
}

// --- trace the outer boundary (moore neighbourhood) -------------------------
function trace(g,w,h){
  const at=(x,y)=>(x<0||y<0||x>=w||y>=h)?0:g[y*w+x];
  let sx=-1,sy=-1;
  outer: for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y)){sx=x;sy=y;break outer;}
  if(sx<0)return[];
  const dirs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const path=[];let cx=sx,cy=sy,dir=6;
  for(let step=0;step<w*h*8;step++){
    path.push([cx,cy]);
    let moved=false;
    for(let i=0;i<8;i++){
      const d=(dir+6+i)%8,[dx,dy]=dirs[d];
      if(at(cx+dx,cy+dy)){cx+=dx;cy+=dy;dir=d;moved=true;break;}
    }
    if(!moved)break;
    if(cx===sx&&cy===sy)break;
  }
  return path;
}

// --- douglas-peucker --------------------------------------------------------
function simplify(pts,tol){
  if(pts.length<3)return pts;
  const d2=(p,a,b)=>{const [px,py]=p,[ax,ay]=a,[bx,by]=b;
    const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
    let t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=Math.max(0,Math.min(1,t));
    const qx=ax+t*dx,qy=ay+t*dy;return (px-qx)**2+(py-qy)**2;};
  const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;
  const stack=[[0,pts.length-1]];
  while(stack.length){
    const [a,b]=stack.pop();let far=-1,fd=tol*tol;
    for(let i=a+1;i<b;i++){const d=d2(pts[i],pts[a],pts[b]);if(d>fd){fd=d;far=i;}}
    if(far>0){keep[far]=1;stack.push([a,far],[far,b]);}
  }
  return pts.filter((_,i)=>keep[i]);
}

// --- split into connected regions -------------------------------------------
/** the smallest share of the art a region must hold to be worth outlining */
const MIN_REGION=0.06;

function regions(g,w,h){
  const seen=new Int8Array(w*h);
  const found=[];let total=0;
  for(let i=0;i<g.length;i++)total+=g[i];
  for(let i=0;i<g.length;i++){
    if(!g[i]||seen[i])continue;
    const stack=[i],cells=[];seen[i]=1;
    while(stack.length){
      const c=stack.pop();cells.push(c);
      const x=c%w,y=(c-x)/w;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=w||ny>=h)continue;
        const n=ny*w+nx;
        if(g[n]&&!seen[n]){seen[n]=1;stack.push(n);}
      }
    }
    found.push(cells);
  }
  return found
    .filter((cells)=>cells.length/total>=MIN_REGION)
    .sort((a,b)=>b.length-a.length)
    .map((cells)=>{
      const grid=new Uint8Array(w*h);
      for(const c of cells)grid[c]=1;
      return grid;
    });
}

/**
 * The stand-in for a slot: the option that survives flattening best.
 *
 * An outline can be walked around one region, so an option drawn as separate
 * pieces — bunting's flags, a string of lights — loses everything but the piece
 * the walk happens to start on. Coverage (how much of the art the largest
 * region holds) decides first; polygon count breaks ties, because colour is
 * what carries these decorations and the detailed options flatten into a blob.
 */
function pickStandIn(options){
  let best=null;
  for(const [id,polys] of Object.entries(options)){
    if(!polys.length)continue;
    const r=raster(polys);
    // Close before splitting: a grow-then-shrink of the same radius merges
    // neighbouring pieces into one region without fattening the silhouette.
    const closed=morph(morph(r.g,r.w,r.h,CLOSE,true),r.w,r.h,CLOSE,false);
    const parts=regions(closed,r.w,r.h);
    if(!parts.length)continue;
    const cand={id,polys,raster:r,parts};
    const better=!best
      || parts.length<best.parts.length
      || (parts.length===best.parts.length && polys.length<best.polys.length);
    if(better)best=cand;
  }
  return best;
}

for(const day of Object.keys(decor).sort()) chosen[day]=pickStandIn(decor[day]);

/**
 * Slots whose traced outline is replaced by an authored one.
 *
 * Tracing is right when the piece has a shape worth recognising. It is wrong
 * twice over: the rug is a soft blob whose traced edge reads as a smudge on the
 * floor rather than a slab waiting to be filled, and a garland is flags on a
 * string, so its outline is a row of triangles that says *bunting* when the
 * slot may end up holding ivy or lights.
 *
 * Both are drawn on the room's isometric planes, not the screen: a floor slab
 * is a diamond and a band on an angled wall is a parallelogram, or they float
 * off the surface they belong to.
 */
const OVERRIDES={
  // the rug's patch as a plain slab on the floor
  day1: [[[0,59.3],[88.4,113],[0,166.7],[-88.4,113]]],
  // one band per wall, following the pitch the bunting is strung at
  day7: [
    [[9,-160],[140,-80],[140,-56],[9,-136]],
    [[-9,-160],[-140,-80],[-140,-56],[-9,-136]],
  ],
};

// --- run --------------------------------------------------------------------
const out={};
for(const [day,pick] of Object.entries(chosen)){
  const {w,h,minX,minY}=pick.raster;
  const override=OVERRIDES[day];
  const loops=override!=null?override:pick.parts.map((grid)=>{
    let path=trace(grid,w,h).map(([x,y])=>[minX+(x-PAD+0.5)*RES, minY+(y-PAD+0.5)*RES]);
    path=simplify(path,2.2);
    if(path.length>2){const [a,b]=[path[0],path[path.length-1]];
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<2.5)path.pop();}
    return path.map(([x,y])=>[Math.round(x*10)/10,Math.round(y*10)/10]);
  }).filter((loop)=>loop.length>=3);
  out[day]={
    option:override!=null?'authored':pick.id,
    polys:pick.polys.length,
    loops,
  };
}
const body=Object.entries(out).map(([day,v])=>
  `  // ${v.option==='authored'?'authored shape':`traced from ${v.option}`} — ${v.loops.length} loop${v.loops.length===1?'':'s'}\n` +
  `  ${day}: [\n` +
  v.loops.map((loop)=>
    `    [\n` + loop.map(([x,y])=>`      [${x}, ${y}],`).join('\n') + `\n    ],`
  ).join('\n') +
  `\n  ],`).join('\n');

fs.writeFileSync(process.argv[2], `import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * The outline of the piece each slot is waiting for, in room space.
 *
 * A list of closed loops per slot — one for most pieces, two for a garland
 * strung across both walls.
 *
 * Generated by \`scripts/build-ghost-contours.mjs\` — see that file for why
 * these are traced rather than taken from the art directly. Do not hand-edit;
 * re-run the script when the room art changes.
 */
export type GhostPoint = readonly [x: number, y: number];

export const ROOM_GHOST_SHAPES: Record<RoomSlot, readonly (readonly GhostPoint[])[]> = {
${body}
};
`);

for(const [d,v] of Object.entries(out))console.log(d,v.option.padEnd(18),String(v.polys).padStart(2)+' polys ->',v.loops.length+' loop(s),',v.loops.reduce((n,l)=>n+l.length,0)+' pts');
