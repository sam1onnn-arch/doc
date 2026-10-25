/* Если телефон показывает страницу в широком окне, увеличиваем её до ширины телефона и включаем телефонную вёрстку.
   Ссылка с #debug показывает размеры окна и применённое увеличение. */
(function(){
  var info={};
  try{
    var sw=screen.width,iw=window.innerWidth,ih=window.innerHeight;
    var ua=/Mobi|Android|iPhone|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>0&&sw<=900);
    var wide=iw/sw>1.25||(ua&&sw<=900&&iw>600&&iw>sw*1.05);
    var target=Math.min(sw,430);
    info={screen:sw,inner:iw,innerH:ih,mobileUA:ua,dpr:window.devicePixelRatio,wide:wide,zoom:1};
    if(sw<=900&&wide){
      var h=document.documentElement,z=iw/target;
      h.style.zoom=z;
      h.classList.add('m');
      [860,700,560,359].forEach(function(b){if(target<=b)h.classList.add('m'+b)});
      info.zoom=Math.round(z*100)/100;info.layout=Math.round(target);
    }
  }catch(e){info.error=String(e)}
  if(/debug/.test(location.hash)){
    document.addEventListener('DOMContentLoaded',function(){
      var d=document.createElement('pre');
      d.style.cssText='position:fixed;left:0;bottom:0;z-index:99;margin:0;padding:6px 8px;background:#000;color:#0f0;font:11px/1.3 monospace;max-width:100%;white-space:pre-wrap';
      d.textContent=JSON.stringify(info);
      document.body.appendChild(d);
    });
  }
})();
