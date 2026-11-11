/* Loona Design Studio — shared chart engine (hand-rolled canvas, no libraries).
   Used by chart-maker and every chart-family page. Pure geometry lives between
   the CORE markers so it can be unit-tested in Node. */
/*CORE*/
var CHART_PALETTE=['#0b6e5d','#c9a227','#2563eb','#dc2626','#7c3aed','#059669','#ea580c','#0891b2','#be185d','#4d7c0f','#b45309','#1d4ed8'];
function parseChartCSV(text){
  var lines=String(text||'').split(/\r?\n/).filter(function(l){return l.trim().length>0;});
  if(!lines.length)return{labels:[],series:[]};
  function splitLine(l){return l.split(/[,\t;]/).map(function(c){return c.trim();});}
  var head=splitLine(lines[0]);var names=head.slice(1);if(!names.length)names=['Value'];
  var labels=[],cols=names.map(function(){return[];});
  for(var i=1;i<lines.length;i++){var cells=splitLine(lines[i]);labels.push(cells[0]||('항목 '+(i)));
    for(var j=0;j<names.length;j++){var v=parseFloat(cells[j+1]);cols[j].push(isNaN(v)?0:v);}}
  return{labels:labels,series:names.map(function(n,j){return{name:n,values:cols[j],color:CHART_PALETTE[j%CHART_PALETTE.length]};})};
}
function dataToCSV(data){
  var out=[['Label'].concat(data.series.map(function(s){return s.name;})).join(',')];
  data.labels.forEach(function(lab,i){out.push([lab].concat(data.series.map(function(s){return s.values[i];})).join(','));});
  return out.join('\n');
}
function pieSlices(values){
  var total=values.reduce(function(a,b){return a+Math.max(0,b);},0);var start=-90,out=[];
  values.forEach(function(v){var val=Math.max(0,v);var ang=total>0?val/total*360:0;
    out.push({value:val,angle:ang,start:start,end:start+ang,mid:start+ang/2,share:total>0?val/total:0});start+=ang;});
  return out;
}
function niceMax(v){if(!(v>0))return 1;var p=Math.pow(10,Math.floor(Math.log10(v)));var n=v/p;var s=n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10;return s*p;}
function niceMin(v){if(!(v<0))return 0;return -niceMax(-v);}
function dataMax(series){var m=0;series.forEach(function(s){s.values.forEach(function(v){if(v>m)m=v;});});return m;}
function dataMin(series){var m=0;series.forEach(function(s){s.values.forEach(function(v){if(v<m)m=v;});});return m;}
function barHeights(values,plotH,maxV){return values.map(function(v){return maxV>0?Math.max(0,v)/maxV*plotH:0;});}
function scaleY(v,y0,plotH,maxV,minV){var range=(maxV-minV)||1;return y0+plotH-(v-minV)/range*plotH;}
function histogramBins(values,binCount){
  if(!values.length)return{bins:[],min:0,max:0,width:0};
  var min=Math.min.apply(null,values),max=Math.max.apply(null,values);
  if(min===max){max=min+1;}
  var width=(max-min)/binCount;var bins=[];
  for(var i=0;i<binCount;i++)bins.push({from:min+i*width,to:min+(i+1)*width,count:0});
  values.forEach(function(v){var idx=Math.min(binCount-1,Math.floor((v-min)/width));bins[idx].count++;});
  return{bins:bins,min:min,max:max,width:width};
}
function quartiles(values){
  var s=values.slice().sort(function(a,b){return a-b;});var n=s.length;
  function q(p){if(!n)return 0;var idx=(n-1)*p;var lo=Math.floor(idx),hi=Math.ceil(idx);
    return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(idx-lo);}
  return{min:s[0],q1:q(0.25),median:q(0.5),q3:q(0.75),max:s[n-1]};
}
function funnelWidths(values){
  var max=Math.max.apply(null,values.concat([1]));
  return values.map(function(v){return{value:v,ratio:v/max};});
}
function gaugeAngle(value,min,max){
  var t=max>min?(value-min)/(max-min):0;t=Math.max(0,Math.min(1,t));
  return{angle:180+t*180,fraction:t};
}
function radarPoints(values,maxV,cx,cy,R){
  var n=values.length;return values.map(function(v,i){var ang=-Math.PI/2+i*2*Math.PI/n;
    var r=maxV>0?Math.max(0,v)/maxV*R:0;return{x:cx+Math.cos(ang)*r,y:cy+Math.sin(ang)*r,axisX:cx+Math.cos(ang)*R,axisY:cy+Math.sin(ang)*R};});
}
function scatterPoints(pairs,x0,y0,w,h){
  var xs=pairs.map(function(p){return p[0];}),ys=pairs.map(function(p){return p[1];});
  var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);
  if(minX===maxX)maxX=minX+1;if(minY===maxY)maxY=minY+1;
  return{pairs:pairs.map(function(p){return{x:x0+(p[0]-minX)/(maxX-minX)*w,y:y0+h-(p[1]-minY)/(maxY-minY)*h,vx:p[0],vy:p[1]};}),minX:minX,maxX:maxX,minY:minY,maxY:maxY};
}
function trendLine(pairs){
  var n=pairs.length;if(n<2)return null;
  var mx=pairs.reduce(function(a,p){return a+p[0];},0)/n,my=pairs.reduce(function(a,p){return a+p[1];},0)/n;
  var num=0,den=0;pairs.forEach(function(p){num+=(p[0]-mx)*(p[1]-my);den+=(p[0]-mx)*(p[0]-mx);});
  if(!den)return null;var slope=num/den;return{slope:slope,intercept:my-slope*mx};
}
function waffleCells(values){
  var total=values.reduce(function(a,b){return a+Math.max(0,b);},0);var cells=[];var counts=[];
  if(total<=0)return{counts:values.map(function(){return 0;}),cells:[]};
  var raw=values.map(function(v){return Math.max(0,v)/total*100;});
  counts=raw.map(function(r){return Math.floor(r);});
  var left=100-counts.reduce(function(a,b){return a+b;},0);
  var order=raw.map(function(r,i){return{frac:r-Math.floor(r),i:i};}).sort(function(a,b){return b.frac-a.frac;});
  for(var k=0;k<left;k++)counts[order[k%order.length].i]++;
  values.forEach(function(_,i){for(var j=0;j<counts[i];j++)cells.push(i);});
  return{counts:counts,cells:cells};
}
function treemapRects(values,x,y,w,h){
  var total=values.reduce(function(a,b){return a+Math.max(0,b);},0);if(total<=0||!values.length)return[];
  var items=values.map(function(v,i){return{v:Math.max(0,v),i:i,area:Math.max(0,v)/total*w*h};}).filter(function(it){return it.area>0;});
  items.sort(function(a,b){return b.area-a.area;});
  var rects=[];var cx=x,cy=y,cw=w,ch=h;
  var list=items.slice();
  while(list.length){
    var horizontal=cw>=ch;var rowArea=0,row=[];
    for(var k=0;k<list.length;k++){row.push(list[k]);rowArea+=list[k].area;
      var rowLen=horizontal?rowArea/ch:rowArea/cw;
      var worst=0;row.forEach(function(it){var other=horizontal?it.area/rowLen:it.area/rowLen;var asp=Math.max(rowLen/Math.max(1,other),Math.max(1,other)/rowLen);if(asp>worst)worst=asp;});
      if(k>0){var prevRow=row.slice(0,-1);var prevArea=rowArea-list[k].area;var prevLen=horizontal?prevArea/ch:prevArea/cw;
        var prevWorst=0;prevRow.forEach(function(it){var other=horizontal?it.area/prevLen:it.area/prevLen;var asp2=Math.max(prevLen/Math.max(1,other),Math.max(1,other)/prevLen);if(asp2>prevWorst)prevWorst=asp2;});
        if(worst>prevWorst){row.pop();rowArea=prevArea;break;}}
    }
    var rl=horizontal?rowArea/ch:rowArea/cw;var off=0;
    row.forEach(function(it){var other=it.area/rl;
      if(horizontal)rects.push({i:it.i,x:cx,y:cy+off,w:rl,h:other});
      else rects.push({i:it.i,x:cx+off,y:cy,w:other,h:rl});
      off+=other;});
    if(horizontal){cx+=rl;cw-=rl;}else{cy+=rl;ch-=rl;}
    list=list.slice(row.length);
    if(cw<1||ch<1)break;
  }
  rects.sort(function(a,b){return a.i-b.i;});return rects;
}
/*/CORE*/

/* ---------- shared UI: table editor + renderer ---------- */
function LoonaChart(opts){
  var prefix=opts.prefix||'../';
  var state={type:opts.type||'bar',title:opts.title||'',data:JSON.parse(JSON.stringify(opts.data)),colors:{}};
  var $=function(s){return document.querySelector(s);};
  function readTable(){
    var names=document.querySelectorAll('.ser-name');var series=[];
    names.forEach(function(inp,j){series.push({name:inp.value||('시리즈 '+(j+1)),values:[],color:state.colors[j]||CHART_PALETTE[j%CHART_PALETTE.length]});});
    var labels=[];document.querySelectorAll('#dataTable tbody tr').forEach(function(tr){
      var inputs=tr.querySelectorAll('input');labels.push(inputs[0].value||'');
      series.forEach(function(s,j){var v=parseFloat(inputs[j+1].value);s.values.push(isNaN(v)?0:v);});});
    return{labels:labels,series:series};
  }
  function buildTable(data){
    $('#dataTable thead').innerHTML='<tr><th style="min-width:110px">라벨</th>'+data.series.map(function(s){return '<th><input class="ser-name" value="'+String(s.name).replace(/"/g,'&quot;')+'"></th>';}).join('')+'</tr>';
    $('#dataTable tbody').innerHTML=data.labels.map(function(lab,i){return '<tr><td><input value="'+String(lab).replace(/"/g,'&quot;')+'"></td>'+data.series.map(function(s){return '<td><input type="number" step="any" value="'+s.values[i]+'"></td>';}).join('')+'</tr>';}).join('');
    var cc=$('#colours');if(cc){cc.innerHTML=data.series.map(function(s,j){return '<label style="display:flex;align-items:center;gap:6px;font-size:.9rem"><input type="color" data-ser="'+j+'" value="'+(state.colors[j]||s.color||CHART_PALETTE[j%12])+'"> '+(s.name||('시리즈 '+(j+1)))+'</label>';}).join('');
      cc.querySelectorAll('input[type=color]').forEach(function(inp){inp.addEventListener('input',function(){state.colors[+inp.dataset.ser]=inp.value;draw();});});}
    document.querySelectorAll('#dataTable input').forEach(function(inp){inp.addEventListener('input',draw);});
  }
  function axes(ctx,x0,y0,plotW,plotH,maxV,minV){
    ctx.strokeStyle='#e3ddc9';ctx.fillStyle='#5a6d68';ctx.font='12px Arial';ctx.textAlign='right';
    for(var g=0;g<=5;g++){var val=minV+(maxV-minV)*g/5;var gy=scaleY(val,y0,plotH,maxV,minV);
      ctx.beginPath();ctx.moveTo(x0,gy);ctx.lineTo(x0+plotW,gy);ctx.stroke();
      ctx.fillText(String(Math.round(val*100)/100),x0-8,gy+4);}
    ctx.strokeStyle='#9aa79f';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0,y0+plotH);ctx.lineTo(x0+plotW,y0+plotH);ctx.stroke();
    var zy=scaleY(0,y0,plotH,maxV,minV);if(minV<0){ctx.strokeStyle='#9aa79f';ctx.beginPath();ctx.moveTo(x0,zy);ctx.lineTo(x0+plotW,zy);ctx.stroke();}
  }
  function legend(ctx,data,x,y,horizontal){
    ctx.font='13px Arial';ctx.textAlign='left';var lx=x;
    data.series.forEach(function(s){ctx.fillStyle=s.color;ctx.fillRect(lx,y,14,14);ctx.fillStyle='#12211e';
      ctx.fillText(s.name,lx+19,y+12);lx+=ctx.measureText(s.name).width+42;});
  }
  function draw(){
    var data=readTable();state.data=data;var type=state.type;
    var typeSel=$('#chartType');if(typeSel&&typeSel.value)type=typeSel.value,state.type=type;
    var title=$('#chartTitle')?$('#chartTitle').value.trim():state.title;
    var showLegend=$('#showLegend')?$('#showLegend').checked:true;
    var cv=$('#cv');var ctx=cv.getContext('2d');var W=cv.width,H=cv.height;
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#062e2a';ctx.font='bold 22px "Segoe UI", Arial, sans-serif';ctx.textAlign='center';
    if(title)ctx.fillText(title,W/2,36);
    var top=title?56:26;
    var first=data.series.length?data.series[0].values:[];
    if(type==='pie'||type==='doughnut'||type==='polar'){
      var slices=pieSlices(first);var cx=W/2-(showLegend?80:0),cy=top+(H-top-30)/2;
      var R=Math.max(80,Math.min(215,(H-top)/2-14));
      slices.forEach(function(sl,i){if(sl.angle<=0)return;ctx.beginPath();ctx.moveTo(cx,cy);
        var rr=type==='polar'?R*(0.45+0.55*sl.share/Math.max.apply(null,slices.map(function(s){return s.share;}))):R;
        ctx.arc(cx,cy,rr,sl.start*Math.PI/180,sl.end*Math.PI/180);ctx.closePath();
        ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
        if(sl.share>=0.04){var mx=cx+Math.cos(sl.mid*Math.PI/180)*(rr*0.66),my=cy+Math.sin(sl.mid*Math.PI/180)*(rr*0.66);
          ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(Math.round(sl.share*100)+'%',mx,my+5);}});
      if(type==='doughnut'){ctx.beginPath();ctx.arc(cx,cy,R*0.55,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        var tot=first.reduce(function(a,b){return a+b;},0);ctx.fillStyle='#062e2a';ctx.font='bold 26px Arial';ctx.textAlign='center';ctx.fillText(String(Math.round(tot*100)/100),cx,cy+4);
        ctx.font='13px Arial';ctx.fillStyle='#5a6d68';ctx.fillText('total',cx,cy+24);}
      if(showLegend){var lx=cx+R+26,ly=top+14;ctx.textAlign='left';ctx.font='14px Arial';
        data.labels.forEach(function(lab,i){ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.fillRect(lx,ly,14,14);
          ctx.fillStyle='#12211e';ctx.fillText(lab+' — '+first[i]+' ('+Math.round((slices[i]?slices[i].share:0)*100)+'%)',lx+20,ly+12);ly+=24;});}
      return;
    }
    if(type==='waffle'){
      var wc=waffleCells(first);var grid=10;var cell=Math.min((W-80)/grid,(H-top-60)/grid);
      var gx=(W-cell*grid)/2,gy=top+8;
      wc.cells.forEach(function(ci,idx){var r=Math.floor(idx/grid),c=idx%grid;
        ctx.fillStyle=CHART_PALETTE[ci%CHART_PALETTE.length];ctx.fillRect(gx+c*cell+1.5,gy+r*cell+1.5,cell-3,cell-3);});
      if(showLegend){var lx2=gx,ly2=gy+grid*cell+22;ctx.font='14px Arial';ctx.textAlign='left';
        data.labels.forEach(function(lab,i){ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.fillRect(lx2,ly2,14,14);
          ctx.fillStyle='#12211e';ctx.fillText(lab+': '+wc.counts[i]+'%',lx2+20,ly2+12);lx2+=ctx.measureText(lab+': '+wc.counts[i]+'%').width+58;});}
      return;
    }
    if(type==='treemap'){
      var rects=treemapRects(first,40,top+6,W-80,H-top-50);
      rects.forEach(function(r,i){ctx.fillStyle=CHART_PALETTE[r.i%CHART_PALETTE.length];ctx.fillRect(r.x,r.y,Math.max(0,r.w-3),Math.max(0,r.h-3));
        if(r.w>64&&r.h>30){ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';
          ctx.fillText(data.labels[r.i]||'',r.x+9,r.y+22);ctx.font='13px Arial';ctx.fillText(String(first[r.i]),r.x+9,r.y+42);}});
      return;
    }
    if(type==='radar'){
      var maxR=niceMax(dataMax(data.series));var cx2=W/2,cy2=top+(H-top-40)/2,RR=Math.min(200,(H-top)/2-26);
      ctx.strokeStyle='#d8d2ba';var n=data.labels.length;
      for(var ring=1;ring<=4;ring++){ctx.beginPath();for(var i2=0;i2<=n;i2++){var ang=-Math.PI/2+(i2%n)*2*Math.PI/n;
        var px=cx2+Math.cos(ang)*RR*ring/4,py=cy2+Math.sin(ang)*RR*ring/4;i2?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}
      ctx.fillStyle='#33473f';ctx.font='13px Arial';
      data.labels.forEach(function(lab,i){var ang=-Math.PI/2+i*2*Math.PI/n;var px=cx2+Math.cos(ang)*(RR+16),py=cy2+Math.sin(ang)*(RR+16);
        ctx.textAlign=Math.abs(Math.cos(ang))<0.3?'center':(Math.cos(ang)>0?'left':'right');ctx.fillText(lab,px,py+4);});
      data.series.forEach(function(s){var pts=radarPoints(s.values,maxR,cx2,cy2,RR);
        ctx.strokeStyle=s.color;ctx.lineWidth=2.5;ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.stroke();
        ctx.fillStyle=s.color;ctx.globalAlpha=0.16;ctx.fill();ctx.globalAlpha=1;
        pts.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();});});
      if(showLegend)legend(ctx,data,60,H-24);
      return;
    }
    if(type==='gauge'){
      var v=first.length?first[0]:0;var g2=gaugeAngle(v,0,niceMax(v||1));var cx3=W/2,cy3=top+(H-top)/2+60,GR=Math.min(240,(H-top)/2-10);
      var grad=ctx.createLinearGradient(cx3-GR,0,cx3+GR,0);grad.addColorStop(0,'#dc2626');grad.addColorStop(0.5,'#c9a227');grad.addColorStop(1,'#059669');
      ctx.strokeStyle='#e8e2cc';ctx.lineWidth=30;ctx.beginPath();ctx.arc(cx3,cy3,GR,Math.PI,2*Math.PI);ctx.stroke();
      ctx.strokeStyle=grad;ctx.beginPath();ctx.arc(cx3,cy3,GR,Math.PI,g2.angle*Math.PI/180);ctx.stroke();
      var na=g2.angle*Math.PI/180;ctx.strokeStyle='#062e2a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx3,cy3);
      ctx.lineTo(cx3+Math.cos(na)*(GR-34),cy3+Math.sin(na)*(GR-34));ctx.stroke();
      ctx.fillStyle='#062e2a';ctx.beginPath();ctx.arc(cx3,cy3,10,0,Math.PI*2);ctx.fill();
      ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.fillText(String(v),cx3,cy3+58);
      ctx.font='14px Arial';ctx.fillStyle='#5a6d68';ctx.fillText(data.labels[0]||'',cx3,cy3+82);
      return;
    }
    if(type==='funnel'){
      var fw=funnelWidths(first);var maxW2=W*0.62,x0f=(W-maxW2)/2;var rowH=Math.min(64,(H-top-30)/Math.max(1,fw.length));
      fw.forEach(function(f,i){var w=maxW2*f.ratio;var y=top+8+i*(rowH+6);var nw=i+1<fw.length?maxW2*fw[i+1].ratio:w*0.92;
        ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.beginPath();
        ctx.moveTo(x0f+(maxW2-w)/2,y);ctx.lineTo(x0f+(maxW2+w)/2,y);ctx.lineTo(x0f+(maxW2+nw)/2,y+rowH);ctx.lineTo(x0f+(maxW2-nw)/2,y+rowH);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 15px Arial';ctx.textAlign='center';
        ctx.fillText((data.labels[i]||'')+' — '+f.value+' ('+Math.round(f.ratio*100)+'%)',W/2,y+rowH/2+5);});
      return;
    }
    if(type==='venn'){
      var cxv=W/2,cyv=top+(H-top-30)/2,rv=Math.min(170,(H-top)/2-16);
      var sets=data.labels.slice(0,3);var cols=['rgba(11,110,93,.55)','rgba(201,162,39,.55)','rgba(37,99,235,.55)'];
      var centers=sets.length===2?[{x:cxv-rv*0.45,y:cyv},{x:cxv+rv*0.45,y:cyv}]:[{x:cxv,y:cyv-rv*0.4},{x:cxv-rv*0.48,y:cyv+rv*0.34},{x:cxv+rv*0.48,y:cyv+rv*0.34}];
      centers.forEach(function(c,i){ctx.beginPath();ctx.arc(c.x,c.y,rv,0,Math.PI*2);ctx.fillStyle=cols[i];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#062e2a';ctx.font='bold 16px Arial';ctx.textAlign='center';
        var lx3=c.x+(c.x-cxv)*0.55,ly3=c.y+(c.y-cyv)*0.55-(sets.length===2?rv*0.55:0);
        ctx.fillText(sets[i],lx3,ly3);ctx.font='14px Arial';ctx.fillText(String(first[i]||''),lx3,ly3+20);});
      ctx.fillStyle='#5a6d68';ctx.font='13px Arial';ctx.textAlign='center';
      ctx.fillText('원 크기는 예시예요. 라벨과 값은 편집할 수 있어요.',cxv,H-16);
      return;
    }
    if(type==='pictogram'){
      var unit=opts.unit||10;var rowH2=44;var y=top+10;
      data.labels.forEach(function(lab,i){var v=first[i]||0;var full=Math.floor(v/unit);var frac=v/unit-full;
        ctx.fillStyle='#33473f';ctx.font='14px Arial';ctx.textAlign='left';ctx.fillText(lab+' ('+v+')',50,y+16);
        for(var k=0;k<full;k++){ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.beginPath();ctx.arc(50+110+k*26,y+8,9,0,Math.PI*2);ctx.fill();}
        if(frac>0.15){ctx.fillStyle=CHART_PALETTE[i%CHART_PALETTE.length];ctx.globalAlpha=0.45;ctx.beginPath();ctx.arc(50+110+full*26,y+8,9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
        y+=rowH2;});
      ctx.fillStyle='#5a6d68';ctx.font='13px Arial';ctx.fillText('전체 점 하나 = '+unit+' 단위',50,y+8);
      return;
    }
    /* axis-based types */
    var minV=niceMin(dataMin(data.series));var maxV=niceMax(dataMax(data.series));
    var x0=64,y0=top,plotW=W-x0-24,plotH=H-y0-64;
    if(type==='histogram'){
      var all=[];data.series.forEach(function(s){all=all.concat(s.values);});
      var hb=histogramBins(all,opts.bins||10);var hmax=niceMax(Math.max.apply(null,hb.bins.map(function(b){return b.count;})));
      axes(ctx,x0,y0,plotW,plotH,hmax,0);var bw=plotW/hb.bins.length;
      hb.bins.forEach(function(b,i){var h=b.count/hmax*plotH;ctx.fillStyle=CHART_PALETTE[0];ctx.fillRect(x0+i*bw+1,y0+plotH-h,bw-2,h);
        if(i%Math.ceil(hb.bins.length/8)===0){ctx.fillStyle='#33473f';ctx.font='11px Arial';ctx.textAlign='center';ctx.fillText(String(Math.round(b.from*10)/10),x0+i*bw+bw/2,y0+plotH+16);}});
      ctx.fillStyle='#5a6d68';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText('값 범위 →',x0+plotW/2,y0+plotH+38);
      return;
    }
    if(type==='boxplot'){
      axes(ctx,x0,y0,plotW,plotH,maxV,minV);var n2=data.series.length;var bw2=Math.min(120,plotW/Math.max(1,n2)*0.5);
      data.series.forEach(function(s,i){var q=quartiles(s.values);var cx4=x0+plotW*(i+0.5)/n2;
        var yMin=scaleY(q.min,y0,plotH,maxV,minV),yQ1=scaleY(q.q1,y0,plotH,maxV,minV),yMed=scaleY(q.median,y0,plotH,maxV,minV),yQ3=scaleY(q.q3,y0,plotH,maxV,minV),yMax=scaleY(q.max,y0,plotH,maxV,minV);
        ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.globalAlpha=0.25;ctx.fillRect(cx4-bw2/2,yQ3,bw2,yQ1-yQ3);ctx.globalAlpha=1;
        ctx.strokeRect(cx4-bw2/2,yQ3,bw2,yQ1-yQ3);
        ctx.beginPath();ctx.moveTo(cx4-bw2/2,yMed);ctx.lineTo(cx4+bw2/2,yMed);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cx4,yQ3);ctx.lineTo(cx4,yMax);ctx.moveTo(cx4,yQ1);ctx.lineTo(cx4,yMin);
        ctx.moveTo(cx4-bw2/4,yMax);ctx.lineTo(cx4+bw2/4,yMax);ctx.moveTo(cx4-bw2/4,yMin);ctx.lineTo(cx4+bw2/4,yMin);ctx.stroke();
        ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText(s.name,cx4,y0+plotH+20);
        ctx.fillText('med '+q.median,cx4,yMed-8);});
      return;
    }
    if(type==='scatter'||type==='bubble'){
      var pairs=[];data.series.forEach(function(s){s.values.forEach(function(v,i){});});
      var xs=data.series.length?data.series[0].values:[];var ys2=data.series.length>1?data.series[1].values:xs;
      xs.forEach(function(x,i){if(ys2[i]!=null)pairs.push([x,ys2[i]]);});
      var sp=scatterPoints(pairs,x0,y0,plotW,plotH);maxV=sp.maxY;minV=sp.minY;
      axes(ctx,x0,y0,plotW,plotH,niceMax(sp.maxY),0);
      if(opts.trend){var tl=trendLine(pairs);if(tl){var xa=sp.minX,xb=sp.maxX;
        var ya=tl.slope*xa+tl.intercept,yb=tl.slope*xb+tl.intercept;
        var sx1=x0,sx2=x0+plotW,sy1=scaleY(ya,y0,plotH,niceMax(sp.maxY),0),sy2=scaleY(yb,y0,plotH,niceMax(sp.maxY),0);
        ctx.strokeStyle='#c9a227';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(sx1,sy1);ctx.lineTo(sx2,sy2);ctx.stroke();ctx.setLineDash([]);}}
      sp.pairs.forEach(function(p,i){var r=type==='bubble'?6+(i%5)*2.4:5.5;
        ctx.fillStyle=CHART_PALETTE[2];ctx.globalAlpha=0.75;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
      ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='center';
      ctx.fillText((data.series[0]?data.series[0].name:'X')+' →',x0+plotW/2,y0+plotH+22);
      return;
    }
    axes(ctx,x0,y0,plotW,plotH,maxV,minV);
    var n=data.labels.length;var zeroY=scaleY(0,y0,plotH,maxV,minV);
    if(type==='bar'||type==='column'){
      var groupW=plotW/Math.max(1,n);var bw3=Math.min(46,(groupW-14)/Math.max(1,data.series.length));
      data.labels.forEach(function(lab,i){var gx=x0+groupW*i+groupW/2;
        data.series.forEach(function(s,j){var hs2=barHeights([s.values[i]],plotH,maxV-minV)[0];var bx=gx-(bw3*data.series.length)/2+j*bw3;
          ctx.fillStyle=s.color;if(s.values[i]>=0)ctx.fillRect(bx,zeroY-hs2,bw3-2,hs2);else ctx.fillRect(bx,zeroY,bw3-2,barHeights([-s.values[i]],plotH,maxV-minV)[0]);});
        ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText(lab,gx,y0+plotH+20);});
    }else if(type==='horizontal'){
      var rowH3=plotH/Math.max(1,n);var bh=Math.min(30,rowH3-10);
      data.labels.forEach(function(lab,i){var gy=y0+rowH3*i+rowH3/2;
        data.series.forEach(function(s,j){var wv=Math.max(0,s.values[i])/(maxV||1)*plotW;var by=gy-bh/2+j*(bh+2)-(data.series.length>1?bh/2:0);
          ctx.fillStyle=s.color;ctx.fillRect(x0,by,Math.max(0,wv),bh);});
        ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='right';ctx.fillText(lab,x0-8,gy+4);
        ctx.textAlign='left';ctx.fillStyle='#12211e';ctx.fillText(String(data.series[0]?data.series[0].values[i]:''),x0+Math.max(0,(data.series[0]?data.series[0].values[i]:0)/(maxV||1)*plotW)+7,gy+4);});
      return;
    }else if(type==='stacked'){
      var smax=0;data.labels.forEach(function(_,i){var t=0;data.series.forEach(function(s){t+=Math.max(0,s.values[i]);});if(t>smax)smax=t;});
      maxV=niceMax(smax);axes(ctx,x0,y0,plotW,plotH,maxV,0);
      var groupW2=plotW/Math.max(1,n);var bw4=Math.min(54,groupW2-16);
      data.labels.forEach(function(lab,i){var gx=x0+groupW2*i+groupW2/2;var base=zeroY;
        data.series.forEach(function(s){var h=Math.max(0,s.values[i])/maxV*plotH;ctx.fillStyle=s.color;ctx.fillRect(gx-bw4/2,base-h,bw4,h);base-=h;});
        ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText(lab,gx,y0+plotH+20);});
    }else if(type==='line'||type==='area'){
      data.series.forEach(function(s){var pts=[];for(var i=0;i<n;i++){var px=n===1?x0+plotW/2:x0+plotW*i/(n-1);pts.push({x:px,y:scaleY(s.values[i],y0,plotH,maxV,minV)});}
        if(type==='area'){ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});
          ctx.lineTo(pts[pts.length-1].x,zeroY);ctx.lineTo(pts[0].x,zeroY);ctx.closePath();ctx.fillStyle=s.color;ctx.globalAlpha=0.28;ctx.fill();ctx.globalAlpha=1;}
        ctx.strokeStyle=s.color;ctx.lineWidth=2.5;ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();
        ctx.fillStyle=s.color;pts.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});});
      ctx.fillStyle='#33473f';ctx.font='12px Arial';ctx.textAlign='center';
      data.labels.forEach(function(lab,i){var px=n===1?x0+plotW/2:x0+plotW*i/(n-1);ctx.fillText(lab,px,y0+plotH+20);});
    }
    if(showLegend)legend(ctx,data,x0,y0+plotH+30);
  }
  buildTable(state.data);draw();
  ['chartTitle','showLegend'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('input',draw);if(el)el.addEventListener('change',draw);});
  var ts=$('#chartType');if(ts)ts.addEventListener('change',draw);
  function bind(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('click',fn);}
  bind('addRow',function(){var d=readTable();d.labels.push('항목 '+(d.labels.length+1));d.series.forEach(function(s){s.values.push(0);});buildTable(d);draw();});
  bind('addCol',function(){var d=readTable();d.series.push({name:'시리즈 '+(d.series.length+1),values:d.labels.map(function(){return 0;}),color:CHART_PALETTE[d.series.length%12]});buildTable(d);draw();});
  bind('delRow',function(){var d=readTable();if(d.labels.length>1){d.labels.pop();d.series.forEach(function(s){s.values.pop();});buildTable(d);draw();}});
  bind('delCol',function(){var d=readTable();if(d.series.length>1){d.series.pop();buildTable(d);draw();}});
  bind('applyCsv',function(){var d=parseChartCSV($('#csvIn').value);var st=$('#st');
    if(!d.labels.length){if(st){st.textContent='그 CSV가 비어 보여요 — 형식을 확인하고 다시 시도하세요.';st.className='status err';}return;}
    state.colors={};buildTable(d);draw();if(st){st.textContent='CSV를 적용했어요: '+d.labels.length+' 행, '+d.series.length+' 시리즈.';st.className='status ok';}});
  bind('copyCsv',function(){var csv=dataToCSV(readTable());var ta=$('#csvIn');if(ta)ta.value=csv;
    if(navigator.clipboard)navigator.clipboard.writeText(csv);var st=$('#st');if(st){st.textContent='현재 표는 CSV 상자에 있어요(복사됐어요). 차트를 복원하려면 언제든 다시 붙여 넣으세요.';st.className='status ok';}});
  bind('dlPng',function(){$('#cv').toBlob(function(b){var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download='loona-chart.png';a.click();setTimeout(function(){URL.revokeObjectURL(u);},3000);},'image/png');});
  return{draw:draw,readTable:readTable};
}
