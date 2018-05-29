# BrowserBasedBotFP

##Description
BrowserBasedBotFP makes it possible to extract browser fingerprint relevant in relation to web bot detection by making use of a test web site.

The directory /client  contains a web site that gathers the following browser fingerprinting properties :

1. Fingerprintjs2 properties (https://github.com/Valve/fingerprintjs2)
    *UserAgent
    *Language
    *Color Depth
    *Screen Resolution
    *Timezone
    *Has session storage or not
    *Has local storage or not
    *Has indexed DB
    *Has IE specific 'AddBehavior'
    *Has open DB
    *CPU class
    *Platform
    *DoNotTrack or not
    *Full list of installed fonts (maintaining their order, which increases the entropy), implemented with Flash.
    *A list of installed fonts, detected with JS/CSS (side-channel technique) - can detect up to 500 installed fonts without flash
    *Canvas fingerprinting
    *WebGL fingerprinting
    *Plugins (IE included)
    *Is AdBlock installed or not
    *Has the user tampered with its languages 1
    *Has the user tampered with its screen resolution 1
    *Has the user tampered with its OS 1
    *Has the user tampered with its browser 1
    *Touch screen detection and capabilities
    *Pixel Ratio
    *System's total number of logical processors available to the user agent.
    *Device memory
2. Global DOM window object keys
3. Missing JS Engine Bind function
4. StackTrace
5. WebSecurity enabled
6. AutoClose Alert dialog
7. Lack of image width and height features
8. MimeTypes
9. Global DOM navigator object keys
10. Navigator language
11. Installed languages
12. WebSocket properties
13. Global DOM document object keys
14. Test page main body element.

##Installation
Run: npm install

##Configuration
Specify the root of the project in ./settings.json
