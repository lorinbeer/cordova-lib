var fs = require('fs')
  , path = require('path')
  , plist = require('plist')
  , xcode = require('xcode')
  , osenv = require('osenv')
  , shell = require('shelljs')
  , et = require('elementtree')
  , ios = require(path.join(__dirname, '..', 'platforms', 'ios'))

  , test_dir = path.join(osenv.tmpdir(), 'test_plugman')
  , test_project_dir = path.join(test_dir, 'projects', 'ios')
  , test_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
  , xml_path     = path.join(test_dir, 'plugins', 'ChildBrowser', 'plugin.xml')
  , xml_text, plugin_et

  //, assetsDir = path.resolve(config.projectPath, 'www')
  , srcDir = path.resolve(test_project_dir, 'SampleApp/Plugins')
  , resDir = path.resolve(test_project_dir, 'SampleApp/Resources');

exports.setUp = function(callback) {
    shell.mkdir('-p', test_dir);
    
    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

    // copy the ios test plugin to a temp directory
    shell.cp('-r', path.join(__dirname, 'plugins'), test_dir);

    // parse the plugin.xml into an elementtree object
    xml_text   = fs.readFileSync(xml_path, 'utf-8')
    plugin_et  = new et.ElementTree(et.XML(xml_text));

    callback();
}

exports.tearDown = function(callback) {
    // remove the temp files (projects and plugins)
    shell.rm('-rf', test_dir);
    callback();
}

exports['should remove the js file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    var jsPath = path.join(test_dir, 'projects', 'ios', 'www', 'childbrowser.js');
    test.ok(!fs.existsSync(jsPath))
    test.done();
}

exports['should remove the source files'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    test.ok(!fs.existsSync(srcDir + '/ChildBrowserCommand.m'))
    test.ok(!fs.existsSync(srcDir + '/ChildBrowserViewController.m'))
    test.ok(!fs.existsSync(srcDir + '/preserveDirs/PreserveDirsTest.m'))
    test.ok(!fs.existsSync(srcDir + '/targetDir/TargetDirTest.m'))
    test.done();
}

exports['should remove the header files'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    test.ok(!fs.existsSync(srcDir + '/ChildBrowserCommand.h'))
    test.ok(!fs.existsSync(srcDir + '/ChildBrowserViewController.h'))
    test.ok(!fs.existsSync(srcDir + '/preserveDirs/PreserveDirsTest.h'))
    test.ok(!fs.existsSync(srcDir + '/targetDir/TargetDirTest.h'))
    test.done();
}

exports['should remove the xib file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    test.ok(!fs.existsSync(resDir + '/ChildBrowserViewController.xib'))
    test.done();
}

exports['should remove the bundle'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    test.ok(!fs.existsSync(resDir + '/ChildBrowser.bundle'))
    test.done();
}

exports['should edit PhoneGap.plist'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    var plistPath = test_project_dir + '/SampleApp/PhoneGap.plist';
    obj = plist.parseFileSync(plistPath);

    test.notEqual(obj.Plugins['com.phonegap.plugins.childbrowser'],
        'ChildBrowserCommand');
        
    test.equal(obj.ExternalHosts.length, 2)    
    test.equal(obj.ExternalHosts[0], "build.phonegap.com")
    test.equal(obj.ExternalHosts[1], "s3.amazonaws.com")

    test.done();
}

exports['should edit the pbxproj file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    var projPath = test_project_dir + '/SampleApp.xcodeproj/project.pbxproj';

    obj = xcode.project(projPath).parseSync();
    var fileRefSection = obj.hash.project.objects['PBXFileReference'],
        fileRefLength = Object.keys(fileRefSection).length,
        EXPECTED_TOTAL_REFERENCES = 70; // magic number ahoy!

    test.equal(fileRefLength, EXPECTED_TOTAL_REFERENCES);
    test.done();
}

exports['should remove the framework references from the pbxproj file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et);

    
    var projPath = test_project_dir + '/SampleApp.xcodeproj/project.pbxproj',
        projContents = fs.readFileSync(projPath, 'utf8'),
        projLines = projContents.split("\n"),
        references;

    references = projLines.filter(function (line) {
        return !!(line.match("libsqlite3.dylib"));
    })

    // should be four libsqlite3 reference lines added
    // pretty low-rent test eh
    test.equal(references.length, 0);
    test.done();
}