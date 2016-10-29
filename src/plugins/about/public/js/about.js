(function(window)
{
    var autoDownloadDataAsJsonToBrowser = function(){console.log("WebComponetsReady never fired")};
    window.addEventListener('WebComponentsReady', function(e) {
        autoDownloadDataAsJsonToBrowser = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (data, fileName) {
                var json = JSON.stringify(data),
                    blob = new Blob([json], {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
    });


    'use strict';
    class about
    {
        constructor(cockpit)
        {
            console.log('System About Plugin running');
            var self = this;
            this.cockpit = cockpit;
            this.rov = cockpit.rov;

            this.cockpit.on('plugin.about.dumpReport', function(callback) {
                self.rov.emit('plugin.about.dumpReport',callback);
            })

            this.cockpit.on('plugin.about.downloadSystemInformation',function(){
                self.downloadSystemInformation();
            })
        }

        downloadSystemInformation (){
            var self=this;
            this.rov.emit("plugin.about.dumpReport",function(report){
                var result = JSON.parse(report);
                result.browserString=navigator.userAgent;
                result.timestamp=Date.now().toString();
                self.cockpit.emit("plugin.host-diagnostics.getbrowserlogs",function(logs){
                    result.console=logs;
                    report = JSON.stringify(result);
                    console.dir(JSON.parse(report));
                    autoDownloadDataAsJsonToBrowser(result,`rovCrashReportingDump${Date.now().toString()}.json`)
                });

            });   
        }     
    }

    // Add plugin to the window object and add it to the plugins list
    var plugins = namespace('plugins');
    plugins.about = about;
    window.Cockpit.plugins.push(plugins.about);
}(window));