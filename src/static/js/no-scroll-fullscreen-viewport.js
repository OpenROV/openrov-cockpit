$(function () {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    var ww = $(window).width() < window.screen.width ? $(window).width() : window.screen.width;
    //get proper width
    var mw = 480;
    // min width of site
    var ratio = ww / mw;
    //calculate ratio
    if (ww < mw) {
      //smaller than minimum size
      $('#Viewport').attr('content', 'initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=yes, width=' + ww);
    } else {
      //regular size
      $('#Viewport').attr('content', 'initial-scale=1.0, maximum-scale=2, minimum-scale=1.0, user-scalable=yes, width=' + ww);
    }
  }
});