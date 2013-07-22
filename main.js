#! /usr/bin/env node

var fs = require('fs');
var semver = require('semver');
var prompt = require('prompt');

var fatal = function(s){
    console.error(s);
    process.exit(1);
}

var names = ['package', 'bower', 'component'];
var manifests = [];

for(var i = 0; i < names.length; i++){
    var name = names[i] + '.json';

    if(fs.existsSync(name)){
        var str = fs.readFileSync(name, 'utf-8');

        try {
            var obj = JSON.parse(str);
            manifests.push({
                name: name,
                obj: obj
            });
        }
        catch(e) {
            fatal(name + ' is not a valid JSON file.')
        }
    }
}

var maxVersion = manifests[0].obj.version;
var consistent = true;

for(var i = 0; i < manifests.length; i++){
    var manifest = manifests[i];
    var version = manifest.obj.version;
    if(semver.valid(version)){
        if(semver.neq(version, maxVersion)){
            consistent = false;
            if(semver.gt(version, maxVersion)){
                maxVersion = version;
            }
        }
    }
    else {
        fatal('Invalid SemVer version ' + manifest.obj.version + ' in ' + manifest.name);
    }
}

if(!consistent){
    console.warn('Inconsistent versions in your manifests. Using maximum found version: ' + maxVersion);
}

var msg = "What type of change is this?\n" +
    "1. Patch version increase (bugfix)\n" +
    "2. Minor version increase (backwards-compatible change)\n" +
    "3. Major version increase (API-breaking change)\n";

console.log(msg);

prompt.start();
prompt.get(
    {
        properties: {
            number: {
                pattern: /[1-3]/,
                message: 'Pick 1, 2 or 3',
                required: true
            }
        }
    },
    function(err, result){
        var type = ['patch', 'minor', 'major'][parseInt(result.number, 10) - 1];
        maxVersion = semver.inc(maxVersion, type);

        for(var i = 0; i < manifests.length; i++){
            var manifest = manifests[i];
            manifest.obj.version = maxVersion;
            fs.writeFileSync(manifest.name, JSON.stringify(manifest.obj, null, 2));
        }

        console.log('Manifests upgraded to version ' + maxVersion);
    }
);
