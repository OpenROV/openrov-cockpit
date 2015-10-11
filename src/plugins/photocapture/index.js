(function() {
  function PhotoCapture(name, deps) {
    console.log('PhotoCapture plugin loaded');
  }
  module.exports = function (name, deps) {
    return new PhotoCapture(name,deps);
  };  
})();
