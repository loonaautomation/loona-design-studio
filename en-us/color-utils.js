/* Loona Design Studio — colour maths (pure functions, unit-tested in Node).
   NOTE: Loona Image Tools hosts the Color Palette Generator and Gradient Generator;
   these utilities power this site's CSS-developer-grade generators. */
/*CORE*/
function hexToRgb(hex){
  hex=String(hex).replace('#','').trim();
  if(hex.length===3)hex=hex.split('').map(function(c){return c+c;}).join('');
  var n=parseInt(hex,16);if(isNaN(n)||hex.length!==6)return null;
  return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}
function rgbToHex(r,g,b){
  function p(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');}
  return '#'+p(r)+p(g)+p(b);
}
function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b);var h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}
  return{h:Math.round(h),s:Math.round(s*100),l:Math.round(l*100)};
}
function hslToRgb(h,s,l){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;
  var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;var r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};
}
function rgbToHsv(r,g,b){
  r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b);var h=0,d=mx-mn;
  if(d){if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}
  return{h:Math.round(h),s:Math.round((mx?d/mx:0)*100),v:Math.round(mx*100)};
}
function hsvToRgb(h,s,v){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;v=Math.max(0,Math.min(100,v))/100;
  var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;var r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};
}
function rgbToCmyk(r,g,b){
  if(r===0&&g===0&&b===0)return{c:0,m:0,y:0,k:100};
  var rr=r/255,gg=g/255,bb=b/255;var k=1-Math.max(rr,gg,bb);
  return{c:Math.round((1-rr-k)/(1-k)*100),m:Math.round((1-gg-k)/(1-k)*100),y:Math.round((1-bb-k)/(1-k)*100),k:Math.round(k*100)};
}
function cmykToRgb(c,m,y,k){
  c/=100;m/=100;y/=100;k/=100;
  return{r:Math.round(255*(1-c)*(1-k)),g:Math.round(255*(1-m)*(1-k)),b:Math.round(255*(1-y)*(1-k))};
}
function shadeScale(hex){
  var rgb=hexToRgb(hex);if(!rgb)return[];var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
  var steps=[50,100,200,300,400,500,600,700,800,900,950];
  var lightness={50:97,100:93,200:84,300:72,400:58,500:46,600:37,700:29,800:22,900:15,950:9};
  return steps.map(function(st){var c=hslToRgb(hsl.h,hsl.s,lightness[st]);return{step:st,hex:rgbToHex(c.r,c.g,c.b)};});
}
function tintsAndShades(hex,count){
  var rgb=hexToRgb(hex);if(!rgb)return{tints:[],shades:[]};
  count=count||5;var tints=[],shades=[];
  for(var i=1;i<=count;i++){var f=i/(count+1);
    tints.push(rgbToHex(rgb.r+(255-rgb.r)*f,rgb.g+(255-rgb.g)*f,rgb.b+(255-rgb.b)*f));
    shades.push(rgbToHex(rgb.r*(1-f),rgb.g*(1-f),rgb.b*(1-f)));}
  return{tints:tints,shades:shades};
}
function harmonies(hex){
  var rgb=hexToRgb(hex);if(!rgb)return{};
  var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
  function at(h,s,l){var c=hslToRgb(h,s==null?hsl.s:s,l==null?hsl.l:l);return rgbToHex(c.r,c.g,c.b);}
  return{
    complementary:[hex,at(hsl.h+180)],
    analogous:[at(hsl.h-30),hex,at(hsl.h+30)],
    triadic:[hex,at(hsl.h+120),at(hsl.h+240)],
    splitComplementary:[hex,at(hsl.h+150),at(hsl.h+210)],
    square:[hex,at(hsl.h+90),at(hsl.h+180),at(hsl.h+270)],
    monochrome:[at(hsl.h,hsl.s,20),at(hsl.h,hsl.s,40),hex,at(hsl.h,hsl.s,65),at(hsl.h,hsl.s,85)]
  };
}
function mixColors(hex1,hex2,steps){
  var a=hexToRgb(hex1),b=hexToRgb(hex2);if(!a||!b)return[];
  var out=[];for(var i=0;i<steps;i++){var f=steps===1?0:i/(steps-1);
    out.push(rgbToHex(a.r+(b.r-a.r)*f,a.g+(b.g-a.g)*f,a.b+(b.b-a.b)*f));}
  return out;
}
function relativeLuminance(r,g,b){
  function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
}
function contrastRatio(hex1,hex2){
  var a=hexToRgb(hex1),b=hexToRgb(hex2);if(!a||!b)return null;
  var l1=relativeLuminance(a.r,a.g,a.b),l2=relativeLuminance(b.r,b.g,b.b);
  var hi=Math.max(l1,l2),lo=Math.min(l1,l2);return Math.round((hi+0.05)/(lo+0.05)*100)/100;
}
/*/CORE*/
