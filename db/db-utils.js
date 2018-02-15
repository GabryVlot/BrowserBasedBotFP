const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const _ = require('underscore');

function initialize(){

    const db = connect();
    db.serialize(function() {

        db.run("CREATE TABLE if not exists configuration (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "value TEXT)"
        );

        db.run("CREATE TABLE if not exists plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists ie_plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists fonts (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists browser (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "window_keys TEXT," +
            "document_keys TEXT," +
            "navigator_keys TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists requests (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "headers TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists fp (" +
            "id integer PRIMARY KEY AUTOINCREMENT," +
            "configuration_id integer," +
            "hash text," +
            "user_agent text," +
            "language text," +
            "color_depth integer," +
            "device_memory integer," +
            "pixel_ratio integer," +
            "hardware_concurrency integer," +
            "resolution text," +
            "available_resolution text," +
            "timezone_offset integer," +
            "session_storage integer," +
            "local_storage integer," +
            "indexed_db integer," +
            "open_database integer," +
            "cpu_class text," +
            "navigator_platform text," +
            "do_not_track text," +
            "canvas text," +
            "webgl text," +
            "webgl_vendor text," +
            "adblock integer," +
            "has_lied_languages integer," +
            "has_lied_resolution integer," +
            "has_lied_os integer," +
            "has_lied_browser integer, " +
            "touch_support text," +
            "missingBindFunction integer," +
            "stackTrace text," +
            "webSecurity integer," +
            "autoClosePopup integer," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );
    });
    db.close();
}

function connect(){
    const dbPath = path.resolve(__dirname, 'fpdb.db')
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('Connected to  database.');
    });
    return db;
}

function insertFP(params, requestHeaders){
    const db = connect();
    let fields = ['hash'];
    let valueArray = ["'" + params.hash + "'"];
    let plugins = '';
    let ie_plugins = '';
    let fonts = '';

    let counter = 0;
    _.each(params.fp, function(fingerPrint){
        counter++;
        // if (counter >= 6) {
        //     if (counter === 6)
        //     console.log(fingerPrint.key, fingerPrint.value)
        //     return;
        // }
         if (fingerPrint.key === 'regular_plugins'){
             plugins = fingerPrint.value;
             return;
         }

         if (fingerPrint.key === 'ie_plugins'){
             ie_plugins = fingerPrint.value;
             return;
         }

         if (fingerPrint.key === 'js_fonts') {
             fonts = fingerPrint.value;
             return;
         }

         fields.push(fingerPrint.key);
        switch(fingerPrint.key) {
            case "resolution":
            case "available_resolution":
                valueArray.push("'" + fingerPrint.value[0].toString() + 'x' + fingerPrint.value[1].toString() + "'");
                break;
            case "touch_support":
                let touchValue = '';
                _.each(fingerPrint.value, function(value){
                    touchValue += value.toString() + ','
                })
                valueArray.push("'" + touchValue + "'");
                break;
            case "adblock":
            case "has_lied_languages":
            case "has_lied_resolution":
            case "has_lied_os":
            case "has_lied_browser":
                valueArray.push(fingerPrint.value ? 1 : 0);
                break;
            case "user_agent":
            case "language":
            case "cpu_class":
            case "navigator_platform":
            case "do_not_track":
            case "canvas":
            case "webgl":
            case "webgl_vendor":
                valueArray.push("'" + fingerPrint.value + "'");
                break;
            default:
                valueArray.push(typeof fingerPrint.value === 'number' ? fingerPrint.value : -1);
        }
    });

    insertTableRecord('configuration', 'value', "'" + params.configuration + "'", db, function(insertedID){
       //Plugins
        insertTableRecord('plugins', 'configuration_id, value', insertedID + ',"' + plugins.toString() + '"', db);
        //ie plugins
        insertTableRecord('ie_plugins', 'configuration_id, value', insertedID + ',"' + ie_plugins.toString() + '"', db);
       //Fonts
        insertTableRecord('fonts', 'configuration_id, value', insertedID + ',"' + fonts.toString() + '"', db);
        //Browser
        insertTableRecord('browser', 'configuration_id, window_keys, document_keys, navigator_keys', insertedID + ',"' +
            params.browser.window.map((value) =>  value).join(',') + '","' + params.browser.document.map((value) =>  value).join(',')
            + '","' + params.browser.navigator.map((value) =>  value).join(',') + '"'  , db);
        //Requests
        insertTableRecord('requests', 'configuration_id, headers', insertedID + ",'" + requestHeaders + "'", db);
       //FP
        fields.push('missingBindFunction', 'stackTrace', 'webSecurity', 'autoClosePopup', 'configuration_id');
        valueArray.push(params.misc.missingBindFunction ? 1 : 0, '"' + params.misc.stackTrace + '"', params.misc.webSecurity ? 1 : 0, params.misc.autoClosePopup ? 1 : 0, insertedID);

        insertTableRecord('fp', fields.map((value) =>  value).join(','),  valueArray.map((value) =>  value).join(','), db);
    });
    db.close();
}

function insertTableRecord(tablename, fields, values, db, cb){
    let sqlPlugins = 'INSERT INTO ' + tablename + '(' + fields + ') VALUES ('+ values + ')';
    db.run(sqlPlugins, function(err, result) {
        if (err) {
            return console.error(tablename + ' ' + err.message);
        }
        console.log(tablename + ` Rows inserted ${this.changes}`, this.lastID);
        if (cb)
            cb(this.lastID);
    })
}

module.exports.initialize = initialize;
module.exports.insertFP =insertFP;
