(function() {
    'use strict';

    //https://github.com/danialfarid/ng-file-upload
    var service = angular.module('sca-product-raw', [ ]);
    service.directive('scaProductRaw', ['toaster', '$http', '$timeout', 
    function(toaster, $http, $timeout) {
        return {
            restrict: 'E',
            scope: {
                taskid: '=',
                path: '=', //if empty, it will be set to instantce_id / task_id
                jwt: '=',
                conf: '=', //need sca_api set
            }, 
            templateUrl: 'bower_components/sca-product-raw/ui/raw.html',
            link: function($scope, element) {

                load_task();
                var t = null;

                function load_task() {
                    $http.get($scope.conf.sca_api+"/task/"+$scope.taskid)
                    .then(function(res) {
                        var task = res.data;
                        if(!task.resource_id) {
                            //task doesn't have resource_id.. probably hasn't run yet.. reload later
                            t = $timeout(load_task, 1000);
                            
                        } else {
                            //we have resource! now display!
                            $scope.resourceid = task.resource_id;
                            $scope.path = $scope.path || task.instance_id+"/"+task._id;
                            load_files();
                        }
                    }, function(res) {
                        if(res.data && res.data.message) toaster.error(res.data.message);
                        else toaster.error(res.statusText);
                    });
                }

                function load_files() {
                    $http.get($scope.conf.sca_api+"/resource/ls", {
                        params: {
                            resource_id: $scope.resourceid,
                            path: $scope.path,
                        }
                    })
                    .then(function(res) {
                        $scope.files = res.data.files;
                        $scope.files.forEach(function(file) {
                            file.path = $scope.path+"/"+file.filename;
                        });
                    }, function(res) {
                        if(res.data && res.data.message) toaster.error(res.data.message);
                        else toaster.error(res.statusText);
                    });
                }
                $scope.$on("$destroy", function(event) {
                    if(t) $timeout.cancel(t);
                });

                /*
                $scope.$watch('resourceid', function() {
                    //console.log("resource id set to "+$scope.resourceid);
                    if(!$scope.resourceid) return;
                    load_files();
                });
                */
            }
        };
    }]);

    //can't quite do the slidedown animation through pure angular/css.. borrowing slideDown from jQuery..
    service.animation('.slide-down', ['$animateCss', function($animateCss) {
        return {
            enter: function(elem, done) {
                $(elem).hide().slideDown("normal", done);
            },
            leave: function(elem, done) {
                $(elem).slideUp("normal", done);
            }
        };
    }]);

    service.filter('bytes', function() {
        return function(bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 1;
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        }
    });

    service.filter('encodeURI', function() {
      return window.encodeURIComponent;
    });
        
    //end of IIFE (immediately-invoked function expression)
})();

