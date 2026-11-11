/* Loona Design Studio — tiny store-only ZIP writer (no compression, no libraries).
   Pure logic between CORE markers is unit-tested in Node. */
/*CORE*/
function loonaCrc32(bytes){
  if(!loonaCrc32.t){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}loonaCrc32.t=t;}
  var crc=0xFFFFFFFF;for(var i=0;i<bytes.length;i++)crc=loonaCrc32.t[(crc^bytes[i])&0xFF]^(crc>>>8);
  return (crc^0xFFFFFFFF)>>>0;
}
function buildZip(entries){
  /* entries: [{name:string, data:Uint8Array}] -> Uint8Array (ZIP, stored) */
  var enc=new TextEncoder();var chunks=[];var central=[];var offset=0;
  function u16(v){return[v&0xFF,(v>>>8)&0xFF];}
  function u32(v){return[v&0xFF,(v>>>8)&0xFF,(v>>>16)&0xFF,(v>>>24)&0xFF];}
  entries.forEach(function(e){
    var nameBytes=enc.encode(e.name);var crc=loonaCrc32(e.data);var size=e.data.length;
    var local=[].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(size),u32(size),u16(nameBytes.length),u16(0));
    chunks.push(new Uint8Array(local));chunks.push(nameBytes);chunks.push(e.data);
    var cen=[].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(size),u32(size),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset));
    central.push(new Uint8Array(cen));central.push(nameBytes);
    offset+=local.length+nameBytes.length+size;
  });
  var cenSize=0;central.forEach(function(c){cenSize+=c.length;});
  var end=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(cenSize),u32(offset),u16(0)));
  var total=offset+cenSize+end.length;var out=new Uint8Array(total);var pos=0;
  chunks.concat(central).concat([end]).forEach(function(c){out.set(c,pos);pos+=c.length;});
  return out;
}
function downloadZip(entries,filename){
  var zip=buildZip(entries);var blob=new Blob([zip],{type:'application/zip'});
  var u=URL.createObjectURL(blob);var a=document.createElement('a');a.href=u;a.download=filename;a.click();
  setTimeout(function(){URL.revokeObjectURL(u);},4000);
}
/*/CORE*/
