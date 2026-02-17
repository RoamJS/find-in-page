# window.roamAlphaAPI.ui — components & react

Quick TOC
- `.components.renderBlock`
- `.components.renderPage`
- `.components.renderSearch`
- `.components.renderString`
- `.components.unmountNode`
- `.react.Block` / `.react.Page` / `.react.Search` / `.react.BlockString`

---

            - `.components`
                - `renderBlock`
                    - Description::
                        - Mounts a React component that renders a given block with children (editable) in a given DOM node.
                    - Parameters::
                        - `uid`
                            - Block UID of block to display
                            - __String__
                        - `el`
                            - DOM node where React component should be mounted
                            - __DOM Node__
                        - `open?` **optional**
                            - optional Boolean
                            - values
                                - If not passed = whatever the normal open state of that block is in the db/graph
                                - `true` = force open the block (show the children if exist)
                                - `false` = force close the block (even if the block has children, they are not shown)
                        - `zoom-path?`**optional**
                            - Optional boolean
                            - when `zoom-path?` is true, it shows the zoom path i.e. view which looks similar to how linked refs look
                        - `zoom-start-after-uid` **optional**
                            - Optional boolean
                            - only valid when `zoom-path?` is true
                                - path compacts to clickable `...` for everything until passed in uid
                                    - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2F0UbfHOyucp.png?alt=media&token=100fe5d1-6461-4e4d-986d-3916ef5e914e)
                            - block uid __String__
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Example::
                        - ```javascript
                          const newNode = document.createElement('div');
                          const wrap = document.getElementById('right-sidebar');
                          
                          // insert our new node after the wrap element in the DOM tree
                          wrap.insertBefore(newNode, wrap.firstChild)
                          
                          window.roamAlphaAPI.ui.components.renderBlock(
                            {
                              "uid": '6-P4ZEbIY', 
                              "el": newNode,
                          
                              // optional args below
                          
                              // open? is for if you want to force open/close the block
                              //   if not passed, uses whatever the normal open state of that block is in the db/graph
                              "open?": false, 
                          
                              // zoom-path? : if you want to show the zoomable path of the block too
                              "zoom-path?": true,
                              // optional addition in zoom-path? mode: path compacts to ... for everything until passed in uid
                              "zoom-start-after-uid": "ImSvJvm1_"
                              })
                          ```
                - `renderPage`
                    - Description::
                        - Mounts a React component that renders a given page with children (editable) in a given DOM node.
                        - unless you're using specific params (`zoom-path?` for block or `hide-mentions?` for page), you can use this interchangeably with `renderBlock`
                    - Parameters::
                        - (same as renderBlock except for the new "zoom-path?". has one additional optional param  `hide-mentions?` )
                        - `uid`
                            - Block UID of block to display
                            - __String__
                        - `el`
                            - DOM node where React component should be mounted
                            - __DOM Node__
                        -  `hide-mentions?`
                            - Optional boolean
                            - to show or not to show linked refs at bottom of page
                - `renderSearch`
                    - Description::
                        - Mounts a React component that renders search results (first pages then blocks) for a given `search-query-str` in a given DOM node.
                            - the results are the same as the "Find or Create Page" or cmd+u search
                        - class is `rm-search-query`. Also uses the existing `rm-query` class
                        - this search view is also available as an xparser component `{{[[search]]}}` or `{{[[search]]: Bret Victor}}`
                    - Screenshot::
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Frs51OdcD-S.png?alt=media&token=e028dfc5-4a5e-4b4c-9f60-b28dc3f955cd)
                    - Parameters::
                        - `search-query-str`
                            - Required string
                        - `el`
                            - Required
                            - DOM node where React component should be mounted
                            - __DOM Node__
                        - `closed?`
                            - optional boolean
                                - default is false
                            - whether view is closed or no
                        - `group-by-page?`
                            - optional boolean
                                - default is false
                        - `hide-paths?`
                            - optional boolean
                                - default is fale
                        - `config-changed-callback`
                            - optional function parameter
                            - is called when config is changed as a result of user interaction
                    - Example::
                        - ```javascript
                          const newNode = document.createElement('div');
                          const wrap = document.getElementById('right-sidebar');
                          
                          // insert our new node after the wrap element in the DOM tree
                          wrap.insertBefore(newNode, wrap.firstChild)
                          
                          window.roamAlphaAPI.ui.components.renderSearch(
                            {"search-query-str": 'Bret Victor',
                             "closed?": false,
                             "group-by-page?": false,
                             "hide-paths?": false,
                             "config-changed-callback": (config) => {console.log("new-config", config);},
                             el: newNode})
                          ```
                - `renderString`
                    - Description::
                        - Mounts a React component that renders the passed-in string
                            - the string can contain existing page titles, block refs and all the elements of roam-flavored markdown
                                - in other words, it can contain anything you can keep in a block string
                                - Watch out for
                                    - If you pass/show `[[Page Title]]` like links for pages that do not exist, those links will not work. Please try not to do that
                    - Parameters::
                        - `string`
                            - The string to be displayed
                            - the string can contain existing page titles, block refs and all the elements of roam-flavored markdown
                                - in other words, it can contain anything you can keep in a block string
                                - Watch out for
                                    - If you pass/show `[[Page Title]]` like links for pages that do not exist, those links will not work. Please try not to do that
                            - __String__
                        - `el`
                            - DOM node where React component should be mounted
                            - __DOM Node__
                    - Returns:: [[Roam Alpha API]]
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Example:: (shows up in right sidebar)
                        - ```javascript
                          const newNode = document.createElement('div');
                          const wrap = document.getElementById('right-sidebar');
                          
                          // insert our new node after the wrap element in the DOM tree
                          wrap.insertBefore(newNode, wrap.firstChild)
                          
                          window.roamAlphaAPI.ui.components.renderString(
                            {
                              el: newNode, 
                              string: "Hello this is via [[Roam Alpha API]]'s `renderString` which ((-PAiIlJ14))"})
                          ```
                            - [[Screenshot]] (see top right)
                                - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FojUSHmwVlU.png?alt=media&token=1d759b50-99e5-4b71-b9cd-0cc46ad17ae9)
                - `unmountNode`
                    - Description::
                        - Unmounts a React component from a certain DOM node.
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Parameters::
                        - `el`
                            - DOM node where React component was mounted
                            - __DOM Node__
            - `.react`
                - `Block`
                    - Description::
                        - A React component that renders a given block with children (editable). Can be used declaratively in JSX.
                    - Props::
                        - `uid`
                            - Block UID of block to display
                            - __String__ (required)
                        - `open` **optional**
                            - Optional boolean
                            - values
                                - If not passed = whatever the normal open state of that block is in the db/graph
                                - `true` = force open the block (show the children if exist)
                                - `false` = force close the block (even if the block has children, they are not shown)
                        - `zoomPath` **optional**
                            - Optional boolean
                            - when `zoomPath` is true, it shows the zoom path i.e. view which looks similar to how linked refs look
                        - `zoomStartAfterUid` **optional**
                            - Optional string
                            - only valid when `zoomPath` is true
                                - path compacts to clickable `...` for everything until passed in uid
                            - block uid __String__
                        - Example::
                            - ```javascript
                              const { Block } = window.roamAlphaAPI.ui.react;
                              
                              // Basic usage
                              <Block uid="6-P4ZEbIY" />
                              
                              // Force closed
                              <Block uid="6-P4ZEbIY" open={false} />
                              
                              // With zoom path
                              <Block
                                uid="6-P4ZEbIY"
                                zoomPath={true}
                                zoomStartAfterUid="ImSvJvm1_"
                              />
                              ```
                - `Page`
                    - Description::
                        - A React component that renders a given page. Can be used declaratively in JSX.
                    - Props::
                        - `uid` **optional**
                            - Page UID to display
                            - __String__ (either `uid` or `title` is required)
                        - `title` **optional**
                            - Page title (alternative to UID)
                            - __String__ (either `uid` or `title` is required)
                        - `hideMentions` **optional**
                            - Optional boolean
                            - When `true`, hides the linked references section at the bottom of the page
                    - Example::
                        - ```javascript
                          const { Page } = window.roamAlphaAPI.ui.react;
                          
                          // By UID
                          <Page uid="page-uid-123" />
                          
                          // By title
                          <Page title="My Page" />
                          
                          // Hide mentions
                          <Page uid="page-uid-123" hideMentions={true} />
                          ```
                - `Search`
                    - Description::
                        - A React component that renders search results for a given query string. Can be used declaratively in JSX.
                    - Props::
                        - `searchQueryStr`
                            - The search query string
                            - __String__ (required)
                        - `closed` **optional**
                            - Optional boolean
                            - When `true`, the view is collapsed
                        - `groupByPage` **optional**
                            - Optional boolean
                            - When `true`, groups search results by their parent page
                        - `hidePaths` **optional**
                            - Optional boolean
                            - When `true`, hides the block paths in results
                        - `onConfigChange` **optional**
                            - Optional callback function
                            - Called when the user changes the search configuration (grouping, etc.)
                            - Receives the new config object as an argument
                    - Example::
                        - ```javascript
                          const { Search } = window.roamAlphaAPI.ui.react;
                          
                          // Basic search
                          <Search searchQueryStr="Bret Victor" />
                          
                          // Grouped by page with callback
                          <Search
                            searchQueryStr="Bret Victor"
                            groupByPage={true}
                            onConfigChange={(config) => console.log('Config changed:', config)}
                          />
                          
                          // Hide paths
                          <Search
                            searchQueryStr="TODO"
                            hidePaths={true}
                          />
                          ```
                - `BlockString`
                    - Description::
                        - A React component that renders a Roam-markdown string. This includes rendering `[[page links]]`, `((block refs))`, and other Roam formatting. The rendered content is **not** editable.
                    - Props::
                        - `string`
                            - The Roam-markdown string to render
                            - __String__ (required)
                    - Example::
                        - ```javascript
                          const { String } = window.roamAlphaAPI.ui.react;
                          
                          // Render text with page link
                          <String string="Hello [[World]]" />
                          
                          // Render text with block reference
                          <String string="See also: ((abc123def))" />
                          
                          // Render formatted text
                          <String string="This is **bold** and __italic__" />
                          ```
            - `.react`
                - `Block`
                    - Description::
                        - A React component that renders a given block with children (editable). Can be used declaratively in JSX.
                    - Props::
                        - `uid`
                            - Block UID of block to display
                            - __String__ (required)
                        - `open` **optional**
                            - Optional boolean
                            - values
                                - If not passed = whatever the normal open state of that block is in the db/graph
                                - `true` = force open the block (show the children if exist)
                                - `false` = force close the block (even if the block has children, they are not shown)
                        - `zoomPath` **optional**
                            - Optional boolean
                            - when `zoomPath` is true, it shows the zoom path i.e. view which looks similar to how linked refs look
                        - `zoomStartAfterUid` **optional**
                            - Optional string
                            - only valid when `zoomPath` is true
                                - path compacts to clickable `...` for everything until passed in uid
                            - block uid __String__
                        - Example::
                            - ```javascript
                              const { Block } = window.roamAlphaAPI.ui.react;
                              
                              // Basic usage
                              <Block uid="6-P4ZEbIY" />
                              
                              // Force closed
                              <Block uid="6-P4ZEbIY" open={false} />
                              
                              // With zoom path
                              <Block
                                uid="6-P4ZEbIY"
                                zoomPath={true}
                                zoomStartAfterUid="ImSvJvm1_"
                              />
                              ```
                - `Page`
                    - Description::
                        - A React component that renders a given page. Can be used declaratively in JSX.
                    - Props::
                        - `uid` **optional**
                            - Page UID to display
                            - __String__ (either `uid` or `title` is required)
                        - `title` **optional**
                            - Page title (alternative to UID)
                            - __String__ (either `uid` or `title` is required)
                        - `hideMentions` **optional**
                            - Optional boolean
                            - When `true`, hides the linked references section at the bottom of the page
                    - Example::
                        - ```javascript
                          const { Page } = window.roamAlphaAPI.ui.react;
                          
                          // By UID
                          <Page uid="page-uid-123" />
                          
                          // By title
                          <Page title="My Page" />
                          
                          // Hide mentions
                          <Page uid="page-uid-123" hideMentions={true} />
                          ```
                - `Search`
                    - Description::
                        - A React component that renders search results for a given query string. Can be used declaratively in JSX.
                    - Props::
                        - `searchQueryStr`
                            - The search query string
                            - __String__ (required)
                        - `closed` **optional**
                            - Optional boolean
                            - When `true`, the view is collapsed
                        - `groupByPage` **optional**
                            - Optional boolean
                            - When `true`, groups search results by their parent page
                        - `hidePaths` **optional**
                            - Optional boolean
                            - When `true`, hides the block paths in results
                        - `onConfigChange` **optional**
                            - Optional callback function
                            - Called when the user changes the search configuration (grouping, etc.)
                            - Receives the new config object as an argument
                    - Example::
                        - ```javascript
                          const { Search } = window.roamAlphaAPI.ui.react;
                          
                          // Basic search
                          <Search searchQueryStr="Bret Victor" />
                          
                          // Grouped by page with callback
                          <Search
                            searchQueryStr="Bret Victor"
                            groupByPage={true}
                            onConfigChange={(config) => console.log('Config changed:', config)}
                          />
                          
                          // Hide paths
                          <Search
                            searchQueryStr="TODO"
                            hidePaths={true}
                          />
                          ```
                - `BlockString`
                    - Description::
                        - A React component that renders a Roam-markdown string. This includes rendering `[[page links]]`, `((block refs))`, and other Roam formatting. The rendered content is **not** editable.
                    - Props::
                        - `string`
                            - The Roam-markdown string to render
                            - __String__ (required)
                    - Example::
                        - ```javascript
                          const { String } = window.roamAlphaAPI.ui.react;
                          
                          // Render text with page link
                          <String string="Hello [[World]]" />
                          
                          // Render text with block reference
                          <String string="See also: ((abc123def))" />
                          
                          // Render formatted text
                          <String string="This is **bold** and __italic__" />
                          ```
