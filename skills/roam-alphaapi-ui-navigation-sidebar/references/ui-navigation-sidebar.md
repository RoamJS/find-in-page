# window.roamAlphaAPI.ui — navigation & sidebars

Quick TOC
- `.getFocusedBlock`
- `.setBlockFocusAndSelection`
- `.mainWindow.*`
- `.leftSidebar.*`
- `.rightSidebar.*`

---

            - `.getFocusedBlock`
                - Description::
                    - Returns metadata about the currently focused block (or null, if no currently selected block). 
                    - More robust than using CSS selectors, and works even from a `.commandPalette` callback, even if the block has lost focus in the DOM.
                - Parameters::
                    - none
                - return example::
                    - ```javascript
                      {
                        block-uid: "YnatnbZzF"
                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                      }
                      ```
            - `.setBlockFocusAndSelection`
                - Description::
                    - Focuses on the given block and window pair (identified using the `location` parameter)
                        - (if location is not present, defaults to the currently focused block)
                    - Can set cursor position/selection using the `selection` parameter
                        - if `selection` is not present, defaults to placing the cursor at the end of the string
                        - if `end`  is specified, it becomes a selection, otherwise it becomes a cursor placement before the `start`  element (0-indexed)
                - Parameters::
                    - `location`
                        - (same structure as the [output](((lIzNihu0n))) of [roamAlphaAPI.ui.getFocusedBlock](((WSy7_Gxf1))))
                        - (if location is not present, defaults to the currently focused block)
                        - `block-uid`
                            - string
                        - `window-id`
                            - string
                            - either 
                                - the actual `window-id` 
                                    - the type you get from `.rightSidebar`/`.getWindows`
                                - or 
                                - the string "main-window"
                                    - convenience to focus on the main window
                    - `selection`
                        - `start` 
                            - int
                        - `end` 
                            - int
                        - Notes::
                            - if `selection` is not present, defaults to placing the cursor at the end of the string
                            - if `selection` is present, `start`  is mandatory
                            - if `end`  is specified, it becomes a selection, otherwise it becomes a cursor placement before the `start`  element (0-indexed)
                            - if  `end`  is less than `start` , then both are treated as the value of `end` 
                - Usage::
                    - [[roam/js]]
                        - ```javascript
                          window.roamAlphaAPI.ui.setBlockFocusAndSelection(
                            {location: window.roamAlphaAPI.ui.getFocusedBlock(),
                             selection: {start: 3,
                                         end: 7}})
                          ```
            - `.mainWindow`
                - `.openBlock`
                    - Description::
                        - Opens a block with the given uid
                        - If pass a page's uid, will open the page
                            - for example, `openBlock({block: {uid: "10-16-2021"}})` opens the daily note page for [[October 16th, 2021]]
                        - If a block/page with uid does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `block`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open(zoom into) a block in the main window
                              window.roamAlphaAPI.ui.mainWindow
                                .openBlock({block: 
                                            {uid: "v9eHoHwqS"}})
                              ```
                - `.openPage`
                    - Description::
                        - Opens a page with the given title (or uid)
                        - If a page with given title (or uid) does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `page`
                            - Either one of the following
                                - `title`
                                - `uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open a page in the main window using uid
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {uid: "RZVuh3aZN"}})
                              
                              // open a page in the main window using it's title
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {title: "test-new"}})
                              ```
                - `.openDailyNotes`
                    - Description::
                        - Opens the daily notes / logs in the main window
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.getOpenView`
                    - Description::
                        - Returns an object describing what is currently displayed in the main window (outline, log, graph, diagram, pdf, search, or custom component)
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Page outline
                          { type: "outline", uid: "Vfht187T1", title: "My Page Title" }
                          
                          // Block outline (zoomed into a block)
                          { type: "outline", uid: "abc123xyz", "block-string": "Some block content" }
                          
                          // Daily notes log
                          { type: "log" }
                          
                          // Graph view
                          { type: "graph" }
                          
                          // Diagram
                          { type: "diagram", uid: "diagram-uid" }
                          
                          // PDF viewer
                          { type: "pdf", uid: "pdf-block-uid" }
                          
                          // All pages search
                          { type: "search" }
                          
                          // Custom component
                          { type: "custom", id: "component-id", args: [] }
                          ```
                - `.getOpenPageOrBlockUid`
                    - Description::
                        - Returns the uid string of the page/block currently open in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // returns a uid, which is a string like the one below
                          'Vfht187T1'
                          ```
                - `.focusFirstBlock`
                    - Description::
                        - Focuses on the first block in the main window
                    - Parameters::
                        - none
            - `.leftSidebar`
                - `.open`
                    - Description::
                        - Makes the left sidebar visible
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.close`
                    - Description::
                        - closes/hides the left sidebar
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
            - `.rightSidebar`
                - `.open`
                    - Description::
                        - Makes the right side bar visible. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.open()
                              ```
                - `.close`
                    - Description::
                        - Makes the right sidebar invisible but keeps the open windows. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.close()
                              ```
                - `.getWindows`
                    - Description::
                        - Returns an array of all open windows.
                    - Parameters::
                        - None
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.getWindows()
                              ```
                    - [[Sample Output]]
                        - P.S. We now have ability to pin a sidebar window to the top. These windows will also have a `pinned-to-top?`: `true` in the `.getWindows` output
                            - To programmatically pin a window to the top, use the new `pin-to-top?` parameter in `.pinWindow`
                        - (shows all 4 kinds of sidebar windows)
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FRboI-gvPtS.png?alt=media&token=b6dff6b6-8421-4f67-80e4-48fae122b561)
                - `.addWindow`
                    - Description::
                        - Adds a window to the right sidebar. If the sidebar is closed, opens it.
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                                    - Example usage
                                        - ```javascript
                                          // Add a window that searches for "API"
                                          window.roamAlphaAPI.ui.rightSidebar
                                            .addWindow({window:
                                                        {type:'search-query' ,'search-query-str':'API'}})
                                          ```
                            - `order`
                                - optional
                                - if not specified, new window will be at the top of the right sidebar
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              //Add a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'block' ,'block-uid':'1fP8LY5ED'}})
                              //Add a page
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'outline' ,'block-uid':'cArVJL_vg'}})
                              //Add mentions of a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'mentions' ,'block-uid':'vutDCPD8G'}})
                              
                              // Add a window that searches for "API"
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'search-query' ,'search-query-str':'API'}})
                              ```
                - `.removeWindow`
                    - Description::
                        - Removes a window from the right sidebar. 
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.expandWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.collapseWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.pinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                        - `pin-to-top?`
                            - optional parameter
                            - If `pin-to-top?` is passed, it should be either `true` or `false`
                                - If explicit value is not passed, we do not change the state
                                    - i.e. if a window is pinned to top and we call `.pinWindow` on it again but without specifying an explicit `pin-to-top?`, nothing changes
                            - If value is `true`, then we pin the specified `window` to the top of the sidebar. Visually this will make the pin look red.  new sidebar windows will be added below it
                                - If another window was already pinned to top, it will be unpinned
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.unpinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.setWindowOrder`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                            - `order`
                                - Required
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
            - `.setBlockFocusAndSelection`
                - Description::
                    - Focuses on the given block and window pair (identified using the `location` parameter)
                        - (if location is not present, defaults to the currently focused block)
                    - Can set cursor position/selection using the `selection` parameter
                        - if `selection` is not present, defaults to placing the cursor at the end of the string
                        - if `end`  is specified, it becomes a selection, otherwise it becomes a cursor placement before the `start`  element (0-indexed)
                - Parameters::
                    - `location`
                        - (same structure as the [output](((lIzNihu0n))) of [roamAlphaAPI.ui.getFocusedBlock](((WSy7_Gxf1))))
                        - (if location is not present, defaults to the currently focused block)
                        - `block-uid`
                            - string
                        - `window-id`
                            - string
                            - either 
                                - the actual `window-id` 
                                    - the type you get from `.rightSidebar`/`.getWindows`
                                - or 
                                - the string "main-window"
                                    - convenience to focus on the main window
                    - `selection`
                        - `start` 
                            - int
                        - `end` 
                            - int
                        - Notes::
                            - if `selection` is not present, defaults to placing the cursor at the end of the string
                            - if `selection` is present, `start`  is mandatory
                            - if `end`  is specified, it becomes a selection, otherwise it becomes a cursor placement before the `start`  element (0-indexed)
                            - if  `end`  is less than `start` , then both are treated as the value of `end` 
                - Usage::
                    - [[roam/js]]
                        - ```javascript
                          window.roamAlphaAPI.ui.setBlockFocusAndSelection(
                            {location: window.roamAlphaAPI.ui.getFocusedBlock(),
                             selection: {start: 3,
                                         end: 7}})
                          ```
            - `.mainWindow`
                - `.openBlock`
                    - Description::
                        - Opens a block with the given uid
                        - If pass a page's uid, will open the page
                            - for example, `openBlock({block: {uid: "10-16-2021"}})` opens the daily note page for [[October 16th, 2021]]
                        - If a block/page with uid does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `block`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open(zoom into) a block in the main window
                              window.roamAlphaAPI.ui.mainWindow
                                .openBlock({block: 
                                            {uid: "v9eHoHwqS"}})
                              ```
                - `.openPage`
                    - Description::
                        - Opens a page with the given title (or uid)
                        - If a page with given title (or uid) does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `page`
                            - Either one of the following
                                - `title`
                                - `uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open a page in the main window using uid
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {uid: "RZVuh3aZN"}})
                              
                              // open a page in the main window using it's title
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {title: "test-new"}})
                              ```
                - `.openDailyNotes`
                    - Description::
                        - Opens the daily notes / logs in the main window
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.getOpenView`
                    - Description::
                        - Returns an object describing what is currently displayed in the main window (outline, log, graph, diagram, pdf, search, or custom component)
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Page outline
                          { type: "outline", uid: "Vfht187T1", title: "My Page Title" }
                          
                          // Block outline (zoomed into a block)
                          { type: "outline", uid: "abc123xyz", "block-string": "Some block content" }
                          
                          // Daily notes log
                          { type: "log" }
                          
                          // Graph view
                          { type: "graph" }
                          
                          // Diagram
                          { type: "diagram", uid: "diagram-uid" }
                          
                          // PDF viewer
                          { type: "pdf", uid: "pdf-block-uid" }
                          
                          // All pages search
                          { type: "search" }
                          
                          // Custom component
                          { type: "custom", id: "component-id", args: [] }
                          ```
                - `.getOpenPageOrBlockUid`
                    - Description::
                        - Returns the uid string of the page/block currently open in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // returns a uid, which is a string like the one below
                          'Vfht187T1'
                          ```
                - `.focusFirstBlock`
                    - Description::
                        - Focuses on the first block in the main window
                    - Parameters::
                        - none
            - `.leftSidebar`
                - `.open`
                    - Description::
                        - Makes the left sidebar visible
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.close`
                    - Description::
                        - closes/hides the left sidebar
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
            - `.rightSidebar`
                - `.open`
                    - Description::
                        - Makes the right side bar visible. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.open()
                              ```
                - `.close`
                    - Description::
                        - Makes the right sidebar invisible but keeps the open windows. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.close()
                              ```
                - `.getWindows`
                    - Description::
                        - Returns an array of all open windows.
                    - Parameters::
                        - None
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.getWindows()
                              ```
                    - [[Sample Output]]
                        - P.S. We now have ability to pin a sidebar window to the top. These windows will also have a `pinned-to-top?`: `true` in the `.getWindows` output
                            - To programmatically pin a window to the top, use the new `pin-to-top?` parameter in `.pinWindow`
                        - (shows all 4 kinds of sidebar windows)
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FRboI-gvPtS.png?alt=media&token=b6dff6b6-8421-4f67-80e4-48fae122b561)
                - `.addWindow`
                    - Description::
                        - Adds a window to the right sidebar. If the sidebar is closed, opens it.
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                                    - Example usage
                                        - ```javascript
                                          // Add a window that searches for "API"
                                          window.roamAlphaAPI.ui.rightSidebar
                                            .addWindow({window:
                                                        {type:'search-query' ,'search-query-str':'API'}})
                                          ```
                            - `order`
                                - optional
                                - if not specified, new window will be at the top of the right sidebar
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              //Add a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'block' ,'block-uid':'1fP8LY5ED'}})
                              //Add a page
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'outline' ,'block-uid':'cArVJL_vg'}})
                              //Add mentions of a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'mentions' ,'block-uid':'vutDCPD8G'}})
                              
                              // Add a window that searches for "API"
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'search-query' ,'search-query-str':'API'}})
                              ```
                - `.removeWindow`
                    - Description::
                        - Removes a window from the right sidebar. 
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.expandWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.collapseWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.pinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                        - `pin-to-top?`
                            - optional parameter
                            - If `pin-to-top?` is passed, it should be either `true` or `false`
                                - If explicit value is not passed, we do not change the state
                                    - i.e. if a window is pinned to top and we call `.pinWindow` on it again but without specifying an explicit `pin-to-top?`, nothing changes
                            - If value is `true`, then we pin the specified `window` to the top of the sidebar. Visually this will make the pin look red.  new sidebar windows will be added below it
                                - If another window was already pinned to top, it will be unpinned
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.unpinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.setWindowOrder`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                            - `order`
                                - Required
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
            - `.mainWindow`
                - `.openBlock`
                    - Description::
                        - Opens a block with the given uid
                        - If pass a page's uid, will open the page
                            - for example, `openBlock({block: {uid: "10-16-2021"}})` opens the daily note page for [[October 16th, 2021]]
                        - If a block/page with uid does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `block`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open(zoom into) a block in the main window
                              window.roamAlphaAPI.ui.mainWindow
                                .openBlock({block: 
                                            {uid: "v9eHoHwqS"}})
                              ```
                - `.openPage`
                    - Description::
                        - Opens a page with the given title (or uid)
                        - If a page with given title (or uid) does not exist, does nothing
                            - but still returns true (NOTE!)
                    - Parameters::
                        - `page`
                            - Either one of the following
                                - `title`
                                - `uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              // open a page in the main window using uid
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {uid: "RZVuh3aZN"}})
                              
                              // open a page in the main window using it's title
                              window.roamAlphaAPI.ui.mainWindow
                                .openPage({page: 
                                           {title: "test-new"}})
                              ```
                - `.openDailyNotes`
                    - Description::
                        - Opens the daily notes / logs in the main window
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.getOpenView`
                    - Description::
                        - Returns an object describing what is currently displayed in the main window (outline, log, graph, diagram, pdf, search, or custom component)
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Page outline
                          { type: "outline", uid: "Vfht187T1", title: "My Page Title" }
                          
                          // Block outline (zoomed into a block)
                          { type: "outline", uid: "abc123xyz", "block-string": "Some block content" }
                          
                          // Daily notes log
                          { type: "log" }
                          
                          // Graph view
                          { type: "graph" }
                          
                          // Diagram
                          { type: "diagram", uid: "diagram-uid" }
                          
                          // PDF viewer
                          { type: "pdf", uid: "pdf-block-uid" }
                          
                          // All pages search
                          { type: "search" }
                          
                          // Custom component
                          { type: "custom", id: "component-id", args: [] }
                          ```
                - `.getOpenPageOrBlockUid`
                    - Description::
                        - Returns the uid string of the page/block currently open in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // returns a uid, which is a string like the one below
                          'Vfht187T1'
                          ```
                - `.focusFirstBlock`
                    - Description::
                        - Focuses on the first block in the main window
                    - Parameters::
                        - none
            - `.leftSidebar`
                - `.open`
                    - Description::
                        - Makes the left sidebar visible
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.close`
                    - Description::
                        - closes/hides the left sidebar
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
            - `.rightSidebar`
                - `.open`
                    - Description::
                        - Makes the right side bar visible. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.open()
                              ```
                - `.close`
                    - Description::
                        - Makes the right sidebar invisible but keeps the open windows. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.close()
                              ```
                - `.getWindows`
                    - Description::
                        - Returns an array of all open windows.
                    - Parameters::
                        - None
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.getWindows()
                              ```
                    - [[Sample Output]]
                        - P.S. We now have ability to pin a sidebar window to the top. These windows will also have a `pinned-to-top?`: `true` in the `.getWindows` output
                            - To programmatically pin a window to the top, use the new `pin-to-top?` parameter in `.pinWindow`
                        - (shows all 4 kinds of sidebar windows)
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FRboI-gvPtS.png?alt=media&token=b6dff6b6-8421-4f67-80e4-48fae122b561)
                - `.addWindow`
                    - Description::
                        - Adds a window to the right sidebar. If the sidebar is closed, opens it.
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                                    - Example usage
                                        - ```javascript
                                          // Add a window that searches for "API"
                                          window.roamAlphaAPI.ui.rightSidebar
                                            .addWindow({window:
                                                        {type:'search-query' ,'search-query-str':'API'}})
                                          ```
                            - `order`
                                - optional
                                - if not specified, new window will be at the top of the right sidebar
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              //Add a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'block' ,'block-uid':'1fP8LY5ED'}})
                              //Add a page
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'outline' ,'block-uid':'cArVJL_vg'}})
                              //Add mentions of a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'mentions' ,'block-uid':'vutDCPD8G'}})
                              
                              // Add a window that searches for "API"
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'search-query' ,'search-query-str':'API'}})
                              ```
                - `.removeWindow`
                    - Description::
                        - Removes a window from the right sidebar. 
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.expandWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.collapseWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.pinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                        - `pin-to-top?`
                            - optional parameter
                            - If `pin-to-top?` is passed, it should be either `true` or `false`
                                - If explicit value is not passed, we do not change the state
                                    - i.e. if a window is pinned to top and we call `.pinWindow` on it again but without specifying an explicit `pin-to-top?`, nothing changes
                            - If value is `true`, then we pin the specified `window` to the top of the sidebar. Visually this will make the pin look red.  new sidebar windows will be added below it
                                - If another window was already pinned to top, it will be unpinned
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.unpinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.setWindowOrder`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                            - `order`
                                - Required
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
            - `.leftSidebar`
                - `.open`
                    - Description::
                        - Makes the left sidebar visible
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.close`
                    - Description::
                        - closes/hides the left sidebar
                    - Parameters::
                        - none
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
            - `.rightSidebar`
                - `.open`
                    - Description::
                        - Makes the right side bar visible. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.open()
                              ```
                - `.close`
                    - Description::
                        - Makes the right sidebar invisible but keeps the open windows. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.close()
                              ```
                - `.getWindows`
                    - Description::
                        - Returns an array of all open windows.
                    - Parameters::
                        - None
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.getWindows()
                              ```
                    - [[Sample Output]]
                        - P.S. We now have ability to pin a sidebar window to the top. These windows will also have a `pinned-to-top?`: `true` in the `.getWindows` output
                            - To programmatically pin a window to the top, use the new `pin-to-top?` parameter in `.pinWindow`
                        - (shows all 4 kinds of sidebar windows)
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FRboI-gvPtS.png?alt=media&token=b6dff6b6-8421-4f67-80e4-48fae122b561)
                - `.addWindow`
                    - Description::
                        - Adds a window to the right sidebar. If the sidebar is closed, opens it.
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                                    - Example usage
                                        - ```javascript
                                          // Add a window that searches for "API"
                                          window.roamAlphaAPI.ui.rightSidebar
                                            .addWindow({window:
                                                        {type:'search-query' ,'search-query-str':'API'}})
                                          ```
                            - `order`
                                - optional
                                - if not specified, new window will be at the top of the right sidebar
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              //Add a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'block' ,'block-uid':'1fP8LY5ED'}})
                              //Add a page
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'outline' ,'block-uid':'cArVJL_vg'}})
                              //Add mentions of a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'mentions' ,'block-uid':'vutDCPD8G'}})
                              
                              // Add a window that searches for "API"
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'search-query' ,'search-query-str':'API'}})
                              ```
                - `.removeWindow`
                    - Description::
                        - Removes a window from the right sidebar. 
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.expandWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.collapseWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.pinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                        - `pin-to-top?`
                            - optional parameter
                            - If `pin-to-top?` is passed, it should be either `true` or `false`
                                - If explicit value is not passed, we do not change the state
                                    - i.e. if a window is pinned to top and we call `.pinWindow` on it again but without specifying an explicit `pin-to-top?`, nothing changes
                            - If value is `true`, then we pin the specified `window` to the top of the sidebar. Visually this will make the pin look red.  new sidebar windows will be added below it
                                - If another window was already pinned to top, it will be unpinned
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.unpinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.setWindowOrder`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                            - `order`
                                - Required
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
            - `.rightSidebar`
                - `.open`
                    - Description::
                        - Makes the right side bar visible. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.open()
                              ```
                - `.close`
                    - Description::
                        - Makes the right sidebar invisible but keeps the open windows. 
                    - Parameters::
                        - None
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.close()
                              ```
                - `.getWindows`
                    - Description::
                        - Returns an array of all open windows.
                    - Parameters::
                        - None
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui.rightSidebar.getWindows()
                              ```
                    - [[Sample Output]]
                        - P.S. We now have ability to pin a sidebar window to the top. These windows will also have a `pinned-to-top?`: `true` in the `.getWindows` output
                            - To programmatically pin a window to the top, use the new `pin-to-top?` parameter in `.pinWindow`
                        - (shows all 4 kinds of sidebar windows)
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2FRboI-gvPtS.png?alt=media&token=b6dff6b6-8421-4f67-80e4-48fae122b561)
                - `.addWindow`
                    - Description::
                        - Adds a window to the right sidebar. If the sidebar is closed, opens it.
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                                    - Example usage
                                        - ```javascript
                                          // Add a window that searches for "API"
                                          window.roamAlphaAPI.ui.rightSidebar
                                            .addWindow({window:
                                                        {type:'search-query' ,'search-query-str':'API'}})
                                          ```
                            - `order`
                                - optional
                                - if not specified, new window will be at the top of the right sidebar
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              //Add a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'block' ,'block-uid':'1fP8LY5ED'}})
                              //Add a page
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'outline' ,'block-uid':'cArVJL_vg'}})
                              //Add mentions of a block
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'mentions' ,'block-uid':'vutDCPD8G'}})
                              
                              // Add a window that searches for "API"
                              window.roamAlphaAPI.ui.rightSidebar
                                .addWindow({window:
                                            {type:'search-query' ,'search-query-str':'API'}})
                              ```
                - `.removeWindow`
                    - Description::
                        - Removes a window from the right sidebar. 
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.expandWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.collapseWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.pinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                        - `pin-to-top?`
                            - optional parameter
                            - If `pin-to-top?` is passed, it should be either `true` or `false`
                                - If explicit value is not passed, we do not change the state
                                    - i.e. if a window is pinned to top and we call `.pinWindow` on it again but without specifying an explicit `pin-to-top?`, nothing changes
                            - If value is `true`, then we pin the specified `window` to the top of the sidebar. Visually this will make the pin look red.  new sidebar windows will be added below it
                                - If another window was already pinned to top, it will be unpinned
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.unpinWindow`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                - `.setWindowOrder`
                    - Description::
                    - Parameters::
                        - `window`
                            - `type`
                                - Required
                                - Can be one of:
                                    - "mentions"
                                    - "block"
                                    - "outline"
                                    - "graph"
                                    - "search-query"
                            - `block-uid`
                                - Required
                                - If `type` = "search-query", then you need to pass `search-query-str` parameter instead of `block-uid`
                            - `order`
                                - Required
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
