(function (window, document, jQuery) { //The function wrapper prevents leaking variables to global space
  'use strict';


  var VideoFilter;

  //These lines register the Example object in a plugin namespace that makes
  //referencing the plugin easier when debugging.
  var plugins = namespace('plugins');
  plugins.VideoFilter = VideoFilter;

  VideoFilter = function VideoFilter(cockpit) {

    console.log('Loading VideoFilter plugin in the browser.');

    //instance variables
    this.cockpit = cockpit;
    this.rov = cockpit.rov;
    this.removeCanvas = null;

    // for plugin management:
    this.pluginDefaults = {
      name : 'videofilter-edge-threejs',   // for the settings
      viewName: 'Video Filter: Edge Detection 3js',
      canBeDisabled : true, //allow enable/disable
      defaultEnabled: false
   };

  };

  //private functions and variables (hidden within the function, available via the closure)


  //Adding the public methods using prototype simply groups those methods
  //together outside the parent function definition for easier readability.

  //Called by the plugin-manager to enable a plugin
  VideoFilter.prototype.enable = function enable() {
    this.startfilter();
  };

  //Called by the plugin-manager to disable a plugin
  VideoFilter.prototype.disable = function disable() {
    this.stopfilter();
  };

  $.getScript('components/three.js/build/three.js',function(){
    var head = document.getElementsByTagName("head")[0];
    [
      'components/three.js/examples/js/shaders/CopyShader.js',
      'components/three.js/examples/js/shaders/EdgeShader.js',
      'components/three.js/examples/js/postprocessing/EffectComposer.js',
      'components/three.js/examples/js/postprocessing/MaskPass.js',
      'components/three.js/examples/js/postprocessing/RenderPass.js',
      'components/three.js/examples/js/postprocessing/ShaderPass.js',
    ].forEach(function(script){
      var js = document.createElement("script");
      js.type = "text/javascript";
      js.src = script;
      head.appendChild(js);
    });
  });

  VideoFilter.prototype.stopfilter = function stopfilter() {
    if (this.removeCanvas!=null){
      this.removeCanvas();
    }
  }

  VideoFilter.prototype.startfilter = function startfilter() {
    var self=this;

    if ((typeof(THREE) === 'undefined')
      || (typeof(THREE.RenderPass) === 'undefined')
      || (typeof(THREE.ShaderPass) === 'undefined')
      || (typeof(THREE.EffectComposer) === 'undefined')
      || (typeof(THREE.MaskPass) === 'undefined')
      || (typeof(THREE.CopyShader) === 'undefined')
      || (typeof(THREE.EdgeShader) === 'undefined')

      ){
      setTimeout(this.startfilter.bind(this),1000);
      return;
    }



    this.cockpit.withHistory.on('video.videoElementAvailable',function(video){
      var canvas = document.createElement("canvas");
      canvas.style.width='100%';
      canvas.style.height='100%';
      video.parentNode.insertBefore(canvas,video);
      self.removeCanvas=function(){
        video.parentNode.removeChild(canvas);
      }

      var cw = 1920;
      var ch = 1080;
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;

      var renderer = new THREE.WebGLRenderer({
          canvas: canvas
      });
      renderer.setClearColor(0x000000);
      var tmpScene = new THREE.Scene();

      // camera
      // These numbers include the dimenions for the visual plain split in half (16x9)
      var camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 1, 10);
      camera.position.set(0, 0, 5);
      tmpScene.add(camera);



      var renderPass = new THREE.RenderPass(tmpScene, camera);

      var edgeShader = new THREE.ShaderPass(THREE.EdgeShader);

      var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
      effectCopy.renderToScreen = true;

      var composer = new THREE.EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(edgeShader);
      composer.addPass(effectCopy);


      // video texture
      var videoImage = document.createElement('canvas');
      videoImage.width = canvas.width;
      videoImage.height = canvas.height;

      var videoImageContext = videoImage.getContext('2d');
      // background color if no video present
      videoImageContext.fillStyle = '#ff0000';
      videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

      var videoTexture = new THREE.Texture(videoImage);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      var videoMaterial = new THREE.MeshBasicMaterial({
          map: videoTexture,
          overdraw: true
      });
      var videoGeometry = new THREE.PlaneGeometry(16, 10);
      var videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
      videoMesh.position.set(0, 0, 0);
      tmpScene.add(videoMesh);


//      video.addEventListener('play', function(){
        videoImage.width = video.videoWidth;
        videoImage.height = video.videoHeight;
        renderFrame.call(self);
//      },false);

      function renderFrame() {
          if(!video.paused || !video.ended){

            if ((videoImage.width !== video.videoWidth) ||
               (videoImage.height !== video.videoHeight)){
                  videoImage.width = video.videoWidth;
                  videoImage.height = video.videoHeight;
               };

            videoImageContext.drawImage(video, 0, 0);
            if (videoTexture) {
                videoTexture.needsUpdate = true;
            }
            composer.render();
          }
          if(self.isEnabled){
            requestAnimationFrame(renderFrame.bind(self));
          }
      }

    });
  };


  window.Cockpit.plugins.push(VideoFilter);

}(window, document, $));
