# window.roamAlphaAPI — util/platform/graph/file/user/depot/constants

Quick TOC
- `.util.*` (uid/date helpers)
- `.platform.*` (device flags)
- `.graph.*` (graph metadata)
- `.file.*` (upload/get/delete)
- `.user.*` (uid/admin)
- `.depot.getInstalledExtensions`
- `.constants.*` (corsAnywhereProxyUrl)

---

# util
        - `.util`
            - `.generateUID`
                - Description::
                    - Generates a roam block UID which is a random string of length nine. 
                - Parameters::
                    - None
                - Usage::
                    - ```javascript
                      window.roamAlphaAPI.util.generateUID()
                      ```
            - `.pageTitleToDate`
                - Description::
                    - Convert a daily note page title to a date
                - Parameters::
                    - a daily note title string, `"June 16th, 2022"`, any non daily note title string will return nil, instead of a date
            - `.dateToPageTitle`
                - Description::
                    - Convert a date to a daily note page title
                - Parameters::
                    - a [javascript date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
            - `.dateToPageUid`
                - Description::
                    - Convert a date to a daily note page uid (`06-16-2022`)
                    - Use this instead of `.generateUID` if you are programmatically generating a daily note page and need the uid ahead of time
                - Parameters::
                    - a [javascript date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

# platform
        - `.platform`
            - All below are boolean variables that are true if the user's device is that platform
                - If you find out that any of the following have some edge cases for which they're failing, please [[Contact Us]]
            - `.isDesktop` #property
                - true if client is Roam [[Desktop App]]
            - `.isMobileApp` #property
                - true if client is Roam [[Mobile App]]
            - `.isMobile` #property
                - Note that this is only a check on the screen size
                    - just uses a media query `max-width: 450px`
            - `.isIOS` #property
                - true if client is iphone, ipad or ipod
            - `.isPC` #property
                - true if client is a PC 
                - useful if you want to have different shortcuts on PC vs Mac 
            - `.isTouchDevice` #property
                - true if client is a touch device

# graph
        - `.graph`
            - `.name` #property
                - The name of the current graph
            - `.type` #property
                - `"hosted"` or `"offline"`
            - `.isEncrypted` #property
                - Whether the graph is encrypted or not

# file
        - `.file`
            - `.upload`
                - Description::
                    - Upload a file to Roam
                    - This also exists as `roamAlphaAPI.util.uploadFile`, prefer using the new version, but the old function will not be removed
                - Parameters::
                    - `file`
                    - `toast` #optional
                        - `hide`
                            - To show / hide the upload toast, default to `false`
                - Returns::
                    - Promise that resolve to a firebase download url
                - Usage::
                    - ```javascript
                      roamAlphaAPI.file.upload({file: new File([""], "test"), toast: {hide: true}})
                      
                      roamAlphaAPI.file.upload({file: new File([""], "blah")})
                      ```
            - `.get`
                - Description::
                    - Fetch a file hosted on Roam
                    - You could also fetch the file yourself with `fetch`, but `.get` handles decrypting the file for encrypted graphs, and fetches the original file name and file type metadata for creating the file object
                - Parameters::
                    - `url`
                        - A firebase storage url, obtained from `.upload`, or from a block
                - Returns::
                    - A promise that resolve to a [File object](https://developer.mozilla.org/en-US/docs/Web/API/File)
                - Usage::
                    - ```javascript
                      roamAlphaAPI.file.get({url: "https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Ftest103%2FGVfB6XBcMR.pdf?alt=media&token=0e0495c7-fbe9-4e13-b9a2-9ffb2c32cd26"})
                      ```
            - `.delete`
                - Description::
                    - Delete a file hosted on Roam
                - Parameters::
                    - `url`
                        - A firebase storage url, obtained from `.upload`, or from a block
                - Returns::
                    - Promise that resolves to `undefined`
                - Usage::
                    - ```javascript
                      roamAlphaAPI.file.delete({url: "https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Ftest103%2FVxMoWmo8pI.jpeg?alt=media&token=39af97c0-32f5-46f9-a198-90481b29d974"})
                      ```

# user
        - `.user`
            - `.uid`
                - Description::
                    - Function which returns the current user's uid
                    - Use this in conjunction with pull to get the user's display page and other meta data about the user
                - Returns::
                    - A string or null
                - Usage::
                    - ```javascript
                      roamAlphaAPI.user.uid()
                      
                      // pull all info about a user
                      roamAlphaAPI.pull("[*]", [":user/uid", window.roamAlphaAPI.user.uid()]);
                      ```
            - `isAdmin`
                - Description::
                    - Function that returns whether the current user is an admin or not (an admin is the graph owner)
                - Returns::
                    - boolean

# depot
        - `depot`
            - `getInstalledExtensions`
                - Description::
                    - Function that returns a map of the extensions currently installed through Roam Depot or dev mode
                - Returns::
                    - Object of {ext-id ext-map}
                        - Example::
                            - ```javascript
                              {ccc+ccc-roam-pdf-2: 
                               {id: 'ccc+ccc-roam-pdf-2', 
                                name: 'Roam PDF Highlighter 2', 
                                enabled: false,
                                version: '1' //version 'DEV' is for developer loaded extensions
                               }
                              ...}
                              ```

# constants
        - `.constants`
            - `.corsAnywhereProxyUrl`
                - (added on [[November 23rd, 2024]])
                - the url for a [CORS-anywhere proxy](https://github.com/Rob--W/cors-anywhere) hosted by the Roam team
                - This can be useful when you're querying an external API in your extension but it has CORS restrictions
                - **How to use it**
                    - pretty easy, instead of `fetch`ing the `url`, instead fetch (`roamAlphaAPI.constants.corsAnywhereProxyUrl` + "/" + `url`)
                    - Some sample JS code
                        - ```javascript
                          let urlToFetch = "https://google.com"
                          
                          await fetch(`${roamAlphaAPI.constants.corsAnywhereProxyUrl}/${urlToFetch}`)
                            .then(a=>a.text())
                          ```
                    - Note that to prevent misuse, this proxy only works when the request originates from Roam domains `https://roamresearch.com`

