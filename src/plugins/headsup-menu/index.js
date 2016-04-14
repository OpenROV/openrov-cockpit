function headsupmenu(name, deps) {
  console.log('Loading Heads-up menu plugin.');
}
module.exports = function (name, deps) {
  return new headsupmenu(name,deps);
};
