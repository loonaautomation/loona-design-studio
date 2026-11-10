/* Loona Design Studio — shared canvas template editor core.
   Powers poster, flyer, banner, infographic, letterhead, menu, book & album
   covers, YouTube thumbnail/banner, quote, invitation, greeting card, ticket,
   ID card, calendar and announcement pages. Each page supplies sizes + starter
   templates as DATA. Pure helpers between CORE markers are unit-tested. */
/*CORE*/
function edClampBlock(b,W,H){b.w=Math.max(20,Math.min(b.w,W));b.h=Math.max(14,Math.min(b.h,H));
  b.x=Math.max(0,Math.min(b.x,W-b.w));b.y=Math.max(0,Math.min(b.y,H-b.h));return b;}
function edHitBlock(blocks,x,y){for(var i=blocks.length-1;i>=0;i--){var b=blocks[i];
  if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return i;}return -1;}
function edScaleBlocks(blocks,fromW,fromH,toW,toH){
  var sx=toW/fromW,sy=toH/fromH;
  return blocks.map(function(b){var c=JSON.parse(JSON.stringify(b));
    c.x*=sx;c.w*=sx;c.y*=sy;c.h*=sy;if(c.fontSize)c.fontSize=Math.max(8,Math.round(c.fontSize*sx));
    return edClampBlock(c,toW,toH);});
}
/*/CORE*/
function LoonaEditor(cfg){
  var $=function(s){return document.querySelector(s);};
  var blocks=[],sel=-1,images={},drag=null,bgImage=null;
  var sizeKey=Object.keys(cfg.sizes)[0];
  function curSize(){return cfg.sizes[sizeKey];}
  function loadTemplate(key){
    var all=cfg.templates||{};var t=all[key];if(!t)return;
    var s=curSize();var base=t.base||{w:1080,h:1080};
    blocks=edScaleBlocks(JSON.parse(JSON.stringify(t.blocks)),base.w,base.h,s.w,s.h);
    sel=-1;sync();draw();
  }
  function draw(){
    var s=curSize();var cv=$('#cv');if(cv.width!==s.w||cv.height!==s.h){cv.width=s.w;cv.height=s.h;}
    var ctx=cv.getContext('2d');
    ctx.fillStyle=($('#bgCol')?$('#bgCol').value:'#ffffff');ctx.fillRect(0,0,s.w,s.h);
    if(bgImage){var sc=Math.max(s.w/bgImage.naturalWidth,s.h/bgImage.naturalHeight);
      var w=bgImage.naturalWidth*sc,h=bgImage.naturalHeight*sc;ctx.drawImage(bgImage,(s.w-w)/2,(s.h-h)/2,w,h);}
    blocks.forEach(function(b,i){
      if(b.type==='shape'){ctx.fillStyle=b.fill;
        if(b.shape==='circle'){ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2,0,0,Math.PI*2);ctx.fill();}
        else if(b.shape==='line'){ctx.fillRect(b.x,b.y+b.h/2- Math.max(1,b.h*0.08),b.w,Math.max(2,b.h*0.16));}
        else ctx.fillRect(b.x,b.y,b.w,b.h);}
      else if(b.type==='image'){var im=images[b.imgKey];
        if(im){var sc2=Math.max(b.w/im.naturalWidth,b.h/im.naturalHeight);var w2=im.naturalWidth*sc2,h2=im.naturalHeight*sc2;
          ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();ctx.drawImage(im,b.x+(b.w-w2)/2,b.y+(b.h-h2)/2,w2,h2);ctx.restore();}
        else{ctx.strokeStyle='#9aa79f';ctx.setLineDash([8,6]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.setLineDash([]);
          ctx.fillStyle='#5a6d68';ctx.font='600 '+Math.max(14,Math.min(26,b.h/6))+'px Arial';ctx.textAlign='center';
          ctx.fillText('Ваше фото — используйте «Добавить блок фото», затем загрузите',b.x+b.w/2,b.y+b.h/2);}}
      else{ctx.fillStyle=b.color;ctx.font=(b.bold?'700 ':'400 ')+(b.fontSize||40)+'px '+(b.font||'"Segoe UI", Arial, sans-serif');
        ctx.textAlign=b.align||'left';ctx.textBaseline='top';
        var lines=String(b.text||'').split('\n');var lh=(b.fontSize||40)*1.24;
        var tx=b.align==='center'?b.x+b.w/2:(b.align==='right'?b.x+b.w:b.x);
        lines.forEach(function(ln,j){ctx.fillText(ln,tx,b.y+j*lh,b.w);});}
      if(i===sel){ctx.strokeStyle='#c9a227';ctx.lineWidth=3;ctx.setLineDash([10,6]);ctx.strokeRect(b.x-4,b.y-4,b.w+8,b.h+8);ctx.setLineDash([]);
        ctx.fillStyle='#c9a227';ctx.fillRect(b.x+b.w-6,b.y+b.h-6,14,14);}
    });
  }
  function sync(){
    var b=blocks[sel];var wrap=$('#edWrap');if(wrap)wrap.style.display=b?'block':'none';
    if(!b)return;
    var t=$('#edText');if(t){t.value=b.type==='text'?b.text:'';$('#edTextRow').style.display=b.type==='text'?'block':'none';}
    var sz=$('#edSize');if(sz)sz.value=b.fontSize||40;
    var co=$('#edColor');if(co)co.value=b.type==='text'?(b.color||'#062e2a'):(b.fill||'#062e2a');
    var bo=$('#edBold');if(bo)bo.checked=!!b.bold;
    var wEl=$('#edW'),hEl=$('#edH');if(wEl)wEl.value=Math.round(b.w);if(hEl)hEl.value=Math.round(b.h);
  }
  function syncSoft(){var b=blocks[sel];if(!b)return;var wEl=$('#edW'),hEl=$('#edH');if(wEl)wEl.value=Math.round(b.w);if(hEl)hEl.value=Math.round(b.h);}
  function pos(e){var r=$('#cv').getBoundingClientRect();var s=curSize();
    var cx=(e.touches?e.touches[0].clientX:e.clientX),cy=(e.touches?e.touches[0].clientY:e.clientY);
    return{x:(cx-r.left)*s.w/r.width,y:(cy-r.top)*s.h/r.height};}
  function init(){
    var cv=$('#cv');
    function down(e){var p=pos(e);var i=edHitBlock(blocks,p.x,p.y);sel=i;sync();
      if(i>=0){var b=blocks[i];
        if(p.x>=b.x+b.w-24&&p.y>=b.y+b.h-24)drag={mode:'resize',i:i};
        else drag={mode:'move',i:i,dx:p.x-b.x,dy:p.y-b.y};}
      else drag=null;draw();if(e.cancelable)e.preventDefault();}
    function move(e){if(!drag)return;var p=pos(e);var b=blocks[drag.i];var s=curSize();
      if(drag.mode==='move'){b.x=p.x-drag.dx;b.y=p.y-drag.dy;}else{b.w=p.x-b.x;b.h=p.y-b.y;}
      edClampBlock(b,s.w,s.h);syncSoft();draw();if(e.cancelable)e.preventDefault();}
    function up(){drag=null;}
    cv.addEventListener('mousedown',down);window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
    cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);
    var sizeSel=$('#sizeSel');
    if(sizeSel){sizeSel.innerHTML=Object.keys(cfg.sizes).map(function(k){return '<option value="'+k+'">'+cfg.sizes[k].label+'</option>';}).join('');
      sizeSel.addEventListener('change',function(){var old=curSize();sizeKey=this.value;var ns=curSize();
        blocks=edScaleBlocks(blocks,old.w,old.h,ns.w,ns.h);draw();});}
    var tpl=$('#tpl');
    if(tpl&&cfg.templates){tpl.innerHTML='<option value="">Выберите…</option>'+Object.keys(cfg.templates).map(function(k){return '<option value="'+k+'">'+cfg.templates[k].name+'</option>';}).join('');
      tpl.addEventListener('change',function(){if(this.value)loadTemplate(this.value);});}
    var bg=$('#bgCol');if(bg)bg.addEventListener('input',draw);
    var bgF=$('#bgFile');if(bgF)bgF.addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;
      var im=new Image();im.onload=function(){bgImage=im;draw();};im.src=URL.createObjectURL(f);});
    function bind(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('click',fn);}
    bind('addText',function(){var s=curSize();blocks.push(edClampBlock({type:'text',x:s.w*0.15,y:s.h*0.4,w:s.w*0.7,h:Math.round(s.h*0.1),text:'Ваш текст здесь',fontSize:Math.round(s.w*0.05),color:'#062e2a',bold:true,align:'center'},s.w,s.h));sel=blocks.length-1;sync();draw();});
    bind('addRect',function(){var s=curSize();blocks.push(edClampBlock({type:'shape',shape:'rect',x:s.w*0.3,y:s.h*0.4,w:s.w*0.4,h:s.h*0.14,fill:'#c9a227'},s.w,s.h));sel=blocks.length-1;sync();draw();});
    bind('addCircle',function(){var s=curSize();var d=Math.round(s.w*0.24);blocks.push(edClampBlock({type:'shape',shape:'circle',x:s.w*0.38,y:s.h*0.38,w:d,h:d,fill:'#0b6e5d'},s.w,s.h));sel=blocks.length-1;sync();draw();});
    bind('addPhoto',function(){var s=curSize();var key='img'+Object.keys(images).length;
      blocks.push(edClampBlock({type:'image',imgKey:key,x:s.w*0.25,y:s.h*0.25,w:s.w*0.5,h:s.h*0.4},s.w,s.h));sel=blocks.length-1;sync();draw();
      var inp=$('#photoFile');if(inp){inp.dataset.target=key;inp.click();}});
    var pf=$('#photoFile');if(pf)pf.addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;
      var key=this.dataset.target||('img'+Object.keys(images).length);var im=new Image();
      im.onload=function(){images[key]=im;draw();};im.src=URL.createObjectURL(f);});
    bind('delBlock',function(){if(sel>=0){blocks.splice(sel,1);sel=-1;sync();draw();}});
    bind('fwdBlock',function(){if(sel>=0&&sel<blocks.length-1){var b=blocks.splice(sel,1)[0];blocks.splice(sel+1,0,b);sel++;draw();}});
    bind('backBlock',function(){if(sel>0){var b=blocks.splice(sel,1)[0];blocks.splice(sel-1,0,b);sel--;draw();}});
    function bindIn(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('input',fn);}
    bindIn('edText',function(){var b=blocks[sel];if(b&&b.type==='text'){b.text=this.value;draw();}});
    bindIn('edSize',function(){var b=blocks[sel];if(b&&b.type==='text'){b.fontSize=+this.value||12;draw();}});
    bindIn('edColor',function(){var b=blocks[sel];if(!b)return;if(b.type==='text')b.color=this.value;else if(b.type==='shape')b.fill=this.value;draw();});
    var boldEl=$('#edBold');if(boldEl)boldEl.addEventListener('change',function(){var b=blocks[sel];if(b&&b.type==='text'){b.bold=this.checked;draw();}});
    var alEl=$('#edAlign');if(alEl)alEl.addEventListener('change',function(){var b=blocks[sel];if(b&&b.type==='text'){b.align=this.value;draw();}});
    bindIn('edW',function(){var b=blocks[sel];if(b){b.w=+this.value||b.w;edClampBlock(b,curSize().w,curSize().h);draw();}});
    bindIn('edH',function(){var b=blocks[sel];if(b){b.h=+this.value||b.h;edClampBlock(b,curSize().w,curSize().h);draw();}});
    bind('dlPng',function(){var keep=sel;sel=-1;draw();
      $('#cv').toBlob(function(bl){var u=URL.createObjectURL(bl);var a=document.createElement('a');a.href=u;a.download=cfg.downloadName||'loona-design.png';a.click();setTimeout(function(){URL.revokeObjectURL(u);},3000);
        var st=$('#st');if(st){st.textContent='Скачано в размере '+curSize().w+' × '+curSize().h+' px.';st.className='status ok';}},'image/png');
      sel=keep;draw();});
    bind('printBtn',function(){var keep=sel;sel=-1;draw();var url=$('#cv').toDataURL('image/png');sel=keep;draw();
      var w=window.open('','_blank');if(!w)return;
      w.document.write('<html><head><title>Print — Loona Design Studio</title></head><body style="margin:0"><img src="'+url+'" style="width:100%" onload="window.print()"></body></html>');w.document.close();});
    if(cfg.defaultTemplate&&cfg.templates&&cfg.templates[cfg.defaultTemplate])loadTemplate(cfg.defaultTemplate);
    else draw();
  }
  init();
  return{draw:draw,loadTemplate:loadTemplate,getBlocks:function(){return blocks;}};
}
/* Standard editor panel HTML is emitted by the page generator (ids:
   sizeSel, tpl, bgCol, bgFile, addText, addRect, addCircle, addPhoto, photoFile,
   delBlock, fwdBlock, backBlock, cv, edWrap, edTextRow, edText, edSize, edColor,
   edBold, edAlign, edW, edH, dlPng, printBtn, st). */
