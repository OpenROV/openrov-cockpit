function vfilter(name, deps) {
  console.log('This is where the video filter edge threejs plugin code would execute in the node process.');

}


module.exports = function (name, deps) {
  return new vfilter(name,deps);
};
