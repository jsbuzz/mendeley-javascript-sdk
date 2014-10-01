(function(root) {

    // Browser globals
    root.MendeleySDK = {};

    // Fake define maps dependencies to globals
    var define = function(deps, fun) {
        if (typeof deps !== 'function') {
            var args = [];
            deps.forEach(function(dep) {
                dep = dep.replace(/[^a-z\-]/g, '');
                dep = dep[0].toUpperCase() + dep.substring(1);
                args.push(root.MendeleySDK[dep]);
            });

            return fun.apply(this, args);
        }
        else {
            return deps();
        }
    }

    root.MendeleySDK.Auth = AUTH_MODULE
    root.MendeleySDK.Request = REQUEST_MODULE
    root.MendeleySDK.API = API_MODULE

})(this);
