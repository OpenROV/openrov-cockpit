$( document ).ready(function() {

  /*
    Dynamically add link files for widgets, hopefully blocking
    while loading per the script example: http://www.html5rocks.com/en/tutorials/speed/script-loading/
  */
  var wid =  window.OROV.widgets;

  Object.keys(wid).forEach(function(src) {
    var link = document.createElement('link');
    link.href = 'components/'+ wid[src].url;
    link.rel = "import";
    link.async = false;
    document.head.appendChild(link);
  });


  window.addEventListener('WebComponentsReady', function(e) {
    var wid =  window.OROV.widgets;
  //  $('#t')[0]['system-panel-widgets'] = wid;
    console.dir(wid);
    for( var i in wid){
      var el1 = document.createElement(wid[i].name);
      if(wid[i].name.startsWith('orov')){
        el1.eventEmitter = window.cockpit;
      }
      $('#'+wid[i].defaultUISymantic).append(el1);
    }
  });
});
