var should = require('should');
var sinon = require('sinon');
var testee = require('../');

var deps = {
  cockpit: { on: function() {} },
};

describe('unit',function(){
  describe('Example plugin constructor', function() {
    beforeEach(function () {
      sinon.spy(console, 'log');
      sinon.spy(deps.cockpit, 'on');
    });

    afterEach(function () {
      console.log.restore();
      deps.cockpit.on.restore();
    });

    it('the example calls console.log', function () {
      console.log.called.should.be.false; /* jshint ignore:line */
      new testee('', deps);
      console.log.called.should.be.true; /* jshint ignore:line */
    });

    it('calls console.foo with right argument', function () {
      new testee('', deps);
      console.log.calledOnce.should.be.true; /* jshint ignore:line */
      console.log.firstCall.calledWith(sinon.match(/^This/)).should.be.ok; /* jshint ignore:line */
    }); 

    it('registers on events from cockpit', function() {
      new testee('', deps).start();
      deps.cockpit.on.calledTwice.should.be.true; /* jshint ignore:line */
    });
  });
});
