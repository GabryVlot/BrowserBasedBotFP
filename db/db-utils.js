/**********************************************************
 * db-utils.js
 * Responsible for the creation of the DB structure and making the DB connection
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbName = 'fpdb.db';

//create database structure: implementation of db Tables if the tables haven't been created yet
function initialize(){
    const db = connect();
    db.serialize(function() {

        db.run("CREATE TABLE if not exists configuration (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "value TEXT)"
        );

        db.run("CREATE TABLE if not exists regular_plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists ie_plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "hash text," +
            "configuration_id integer," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists js_fonts (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists swf_fonts (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists navigator (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "navigator TEXT," +
            "language," +
            "languages," +
            "mimeTypes," +
            "webSocket," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists document (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "document_keys TEXT," +
            "documentElement TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists browser (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "window_keys TEXT," +
            "missingBindFunction integer," +
            "stackTrace text," +
            "webSecurity integer," +
            "autoClosePopup integer," +
            "missingImage integer," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists requests (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
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
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );
    });
    db.close();
}

//Create a connection to the db
function connect(){
    const dbPath = path.resolve(__dirname, dbName)
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('Connected to database.');
    });
    return db;
}

module.exports.initialize = initialize;
module.exports.connect = connect;
