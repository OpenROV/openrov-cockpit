
function CloudProfile(name,deps) 
{
  'use strict';
  var self = this;
};

module.exports = function(name,deps){
  return new CloudProfile(name,deps);
}
