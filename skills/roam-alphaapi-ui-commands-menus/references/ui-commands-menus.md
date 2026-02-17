# window.roamAlphaAPI.ui — commands, menus, selection

Quick TOC
- `.commandPalette.*`
- `.slashCommand.*`
- `.multiselect.*` and `.individualMultiselect.*`
- `.blockContextMenu.*`
- `.pageContextMenu.*`
- `.pageLinkContextMenu.*`
- `.pageRefContextMenu.*`
- `.blockRefContextMenu.*`
- `.msContextMenu.*`

---

            - `.commandPalette`
                - `.addCommand`
                    - Description::
                        - Adds a command to the [[Command Palette]] (Cmd+P), and calls the provided callback when the user selects that command. 
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                    - Parameters::
                        - `label`
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                            - __string__
                        - `callback`
                            - Function called with no parameters when the user selects the command in the Command Palette
                            - __function__
                        - `disable-hotkey`
                            - __boolean__
                        - `default-hotkey`
                            - it should be a __string__ or vectors of strings are for multi step hotkeys
                                - __string__
                                    - __string__ should be of the form "super-shift-d". should have at least one modifier. Modifiers are listed in table below
                                        - {{[[table]]}}
                                            - **modifier-str**
                                                - **key in Windows/Linux**
                                                    - **key in MacOS**
                                            - "shift"
                                                - shift
                                                    - shift
                                            - "ctrl"
                                                - ctrl
                                                    - ctrl
                                            - "alt"
                                                - alt
                                                    - option
                                            - "super"
                                                - win
                                                    - cmd
                                            - "defmod" (default modifier for OS X is cmd and for others is ctrl)
                                                - ctrl
                                                    - cmd
                                - __vector of ((yE0X7Un1l))s__
                                    - vectors of strings are for multi step hotkeys
                                        - An example of a native hotkey like that is `["ctrl-c", "ctrl-m"]` for going to next block
                                    - limit is 5 
                            - if this has not been provided but `disable-hotkey` is absent or false, no hotkey is set up but user can customize it from settings. **So, most commands should NOT have default-hotkey** 
                            - user can customize this from the "Hotkeys" menu
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui
                                .commandPalette
                                .addCommand({label: 'hi', 
                                             callback: () => console.log('Hello World!')})
                              ```
                        - Examples showing `default-hotkey`
                            - example 1:
                                - ```javascript
                                  window.roamAlphaAPI.ui
                                    .commandPalette
                                    .addCommand({label: 'example1', 
                                                 callback: () => console.log('Hello World!'),
                                                 "disable-hotkey": false,
                                                 // this is the default hotkey, and can be customized by the user. 
                                                 // in most cases, you DO NOT want to be setting a default hotkey
                                                 "default-hotkey": "ctrl-cmd-l"})
                                  ```
                            - example 2: 
                                - ```javascript
                                  window.roamAlphaAPI.ui
                                    .commandPalette
                                    .addCommand({label: 'example2', 
                                                 callback: () => console.log('Hello World2!'),
                                                 // this is the default hotkey, and can be customized by the user
                                                 // in most cases, you DO NOT want to be setting a default hotkey
                                                 "default-hotkey": ["ctrl-c", "ctrl-x"]})
                                  ```
                            - 
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Command Palette
                    - Parameters::
                        - `label`
                            - Label provided when using `.addCommand`
                            - __string__
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window.roamAlphaAPI.ui
                                .commandPalette
                                .removeCommand({label: 'hi'})
                              ```
            - `.slashCommand`
                - `.addCommand`
                    - Description::
                        - Adds a command to the [[Slash Command]], and calls the provided callback when the user selects that command. 
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Slash Command
                        - `display-conditional`: __function__, optional
                            - Function called with `context` but without the `indexes` which should return true if the command should be shown or false if not.
                                - `context`
                                    - ```javascript
                                      {
                                        block-uid: "YnatnbZzF",
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021",
                                        indexes: [1 10]
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `context` when the user selects the command in block context menu. 
                            - It should return either
                                - a string to insert at the current location
                                - null to handle insertion manually (e.g., via custom logic, this will not remove the search string)
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.slashCommand.addCommand({
                            label: "Quick Test",
                            'display-conditional': (args) => {
                              console.log("display:", args);
                            },
                            callback: (args) => {
                              console.log("Callback received:", args);
                              return "It works! 🎉";
                            }
                          });
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.multiselect`
                - `.getSelected`
                    - Description::
                        - Returns an array of objects representing the currently drag-selected blocks in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Returns an array of selected blocks with their uid and window-id
                          [
                            { "block-uid": "Vfht187T1", "window-id": "main-window" },
                            { "block-uid": "abc123xyz", "window-id": "main-window" }
                          ]
                          
                          // Empty array if no blocks are selected
                          []
                          ```
            - `.individualMultiselect`
                - `getSelectedUids`
                    - Description::
                        - Gets the uids currently selected by individual multiselect (usually triggered by `cmd-m`)
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.getSelectedUids()
                          ```
            - `.blockContextMenu`
                - `.addCommand`
                    - Description::
                        - Adds a menu item to the [[Block Context Menu]] (what comes up if you right click on the bullet of a single block), and calls the provided callback when the user selects that command.
                        - All custom commands are nested under the Plugins menu item.
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fa87mH7hqIQ.png?alt=media&token=b9dcb514-470c-44fb-8f32-f6b8f11cc7ce)
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                        - You can optionally provide a conditional function, which runs every time the menu is opened, with context about the current block, and returns a boolean of whether this menu item should be included for this particular block.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `block-context` which should return true if the command should be shown or false if not.
                                - `block-context`
                                    - ```javascript
                                      {
                                        block-string: "Todos"
                                        block-uid: "YnatnbZzF"
                                        heading: null
                                        page-uid: "04-15-2021"
                                        read-only?: false
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `block-context` when the user selects the command in block context menu. 
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockContextMenu.addCommand(
                            {label: "Debug: Console Log", 
                             'display-conditional': 
                               (e) => e['block-string'].includes("Test Block"), 
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.slashCommand`
                - `.addCommand`
                    - Description::
                        - Adds a command to the [[Slash Command]], and calls the provided callback when the user selects that command. 
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Slash Command
                        - `display-conditional`: __function__, optional
                            - Function called with `context` but without the `indexes` which should return true if the command should be shown or false if not.
                                - `context`
                                    - ```javascript
                                      {
                                        block-uid: "YnatnbZzF",
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021",
                                        indexes: [1 10]
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `context` when the user selects the command in block context menu. 
                            - It should return either
                                - a string to insert at the current location
                                - null to handle insertion manually (e.g., via custom logic, this will not remove the search string)
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.slashCommand.addCommand({
                            label: "Quick Test",
                            'display-conditional': (args) => {
                              console.log("display:", args);
                            },
                            callback: (args) => {
                              console.log("Callback received:", args);
                              return "It works! 🎉";
                            }
                          });
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.multiselect`
                - `.getSelected`
                    - Description::
                        - Returns an array of objects representing the currently drag-selected blocks in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Returns an array of selected blocks with their uid and window-id
                          [
                            { "block-uid": "Vfht187T1", "window-id": "main-window" },
                            { "block-uid": "abc123xyz", "window-id": "main-window" }
                          ]
                          
                          // Empty array if no blocks are selected
                          []
                          ```
            - `.individualMultiselect`
                - `getSelectedUids`
                    - Description::
                        - Gets the uids currently selected by individual multiselect (usually triggered by `cmd-m`)
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.getSelectedUids()
                          ```
            - `.blockContextMenu`
                - `.addCommand`
                    - Description::
                        - Adds a menu item to the [[Block Context Menu]] (what comes up if you right click on the bullet of a single block), and calls the provided callback when the user selects that command.
                        - All custom commands are nested under the Plugins menu item.
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fa87mH7hqIQ.png?alt=media&token=b9dcb514-470c-44fb-8f32-f6b8f11cc7ce)
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                        - You can optionally provide a conditional function, which runs every time the menu is opened, with context about the current block, and returns a boolean of whether this menu item should be included for this particular block.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `block-context` which should return true if the command should be shown or false if not.
                                - `block-context`
                                    - ```javascript
                                      {
                                        block-string: "Todos"
                                        block-uid: "YnatnbZzF"
                                        heading: null
                                        page-uid: "04-15-2021"
                                        read-only?: false
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `block-context` when the user selects the command in block context menu. 
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockContextMenu.addCommand(
                            {label: "Debug: Console Log", 
                             'display-conditional': 
                               (e) => e['block-string'].includes("Test Block"), 
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.blockContextMenu`
                - `.addCommand`
                    - Description::
                        - Adds a menu item to the [[Block Context Menu]] (what comes up if you right click on the bullet of a single block), and calls the provided callback when the user selects that command.
                        - All custom commands are nested under the Plugins menu item.
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fa87mH7hqIQ.png?alt=media&token=b9dcb514-470c-44fb-8f32-f6b8f11cc7ce)
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                        - You can optionally provide a conditional function, which runs every time the menu is opened, with context about the current block, and returns a boolean of whether this menu item should be included for this particular block.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `block-context` which should return true if the command should be shown or false if not.
                                - `block-context`
                                    - ```javascript
                                      {
                                        block-string: "Todos"
                                        block-uid: "YnatnbZzF"
                                        heading: null
                                        page-uid: "04-15-2021"
                                        read-only?: false
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `block-context` when the user selects the command in block context menu. 
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockContextMenu.addCommand(
                            {label: "Debug: Console Log", 
                             'display-conditional': 
                               (e) => e['block-string'].includes("Test Block"), 
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.multiselect`
                - `.getSelected`
                    - Description::
                        - Returns an array of objects representing the currently drag-selected blocks in the main window
                    - Parameters::
                        - none
                    - return example::
                        - ```javascript
                          // Returns an array of selected blocks with their uid and window-id
                          [
                            { "block-uid": "Vfht187T1", "window-id": "main-window" },
                            { "block-uid": "abc123xyz", "window-id": "main-window" }
                          ]
                          
                          // Empty array if no blocks are selected
                          []
                          ```
            - `.individualMultiselect`
                - `getSelectedUids`
                    - Description::
                        - Gets the uids currently selected by individual multiselect (usually triggered by `cmd-m`)
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.getSelectedUids()
                          ```
            - `.blockContextMenu`
                - `.addCommand`
                    - Description::
                        - Adds a menu item to the [[Block Context Menu]] (what comes up if you right click on the bullet of a single block), and calls the provided callback when the user selects that command.
                        - All custom commands are nested under the Plugins menu item.
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fa87mH7hqIQ.png?alt=media&token=b9dcb514-470c-44fb-8f32-f6b8f11cc7ce)
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                        - You can optionally provide a conditional function, which runs every time the menu is opened, with context about the current block, and returns a boolean of whether this menu item should be included for this particular block.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `block-context` which should return true if the command should be shown or false if not.
                                - `block-context`
                                    - ```javascript
                                      {
                                        block-string: "Todos"
                                        block-uid: "YnatnbZzF"
                                        heading: null
                                        page-uid: "04-15-2021"
                                        read-only?: false
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `block-context` when the user selects the command in block context menu. 
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockContextMenu.addCommand(
                            {label: "Debug: Console Log", 
                             'display-conditional': 
                               (e) => e['block-string'].includes("Test Block"), 
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
            - `.individualMultiselect`
                - `getSelectedUids`
                    - Description::
                        - Gets the uids currently selected by individual multiselect (usually triggered by `cmd-m`)
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.getSelectedUids()
                          ```
            - `.blockContextMenu`
                - `.addCommand`
                    - Description::
                        - Adds a menu item to the [[Block Context Menu]] (what comes up if you right click on the bullet of a single block), and calls the provided callback when the user selects that command.
                        - All custom commands are nested under the Plugins menu item.
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fa87mH7hqIQ.png?alt=media&token=b9dcb514-470c-44fb-8f32-f6b8f11cc7ce)
                        - If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
                        - You can optionally provide a conditional function, which runs every time the menu is opened, with context about the current block, and returns a boolean of whether this menu item should be included for this particular block.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `block-context` which should return true if the command should be shown or false if not.
                                - `block-context`
                                    - ```javascript
                                      {
                                        block-string: "Todos"
                                        block-uid: "YnatnbZzF"
                                        heading: null
                                        page-uid: "04-15-2021"
                                        read-only?: false
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `block-context` when the user selects the command in block context menu. 
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockContextMenu.addCommand(
                            {label: "Debug: Console Log", 
                             'display-conditional': 
                               (e) => e['block-string'].includes("Test Block"), 
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page context menu when right clicking on titles.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `page-context` which should return true if the command should be shown or false if not.
                                - `page-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF"
                                        page-title: "title"
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `page-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageLinkContextMenu`
                - `.addCommand`
                    - Description::
                        - For all places that are not the main page title or in a block reference
                        - Currently this is only in linked references / query results when grouping by page
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        page-uid: "YnatnbZzF",
                                        page-title: "title"
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageLinkContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.pageRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the page ref context menu when right clicking on a page reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the context menu
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "xyz" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                        type: "attribute"
                                      }
                                      ```
                                - `type`
                                    - "page-ref": `[[test]]`
                                    - "attribute": `test::`
                                    - "tag": `#test`
                                    - "multitag": `#[[Test]]`
                                    - "inline-link": `[t]([[Test]])`
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.pageRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.blockRefContextMenu`
                - `.addCommand`
                    - Description::
                        - See `.blockContextMenu` description, this is identical but for the block ref context menu when clicking on a block reference.
                    - Parameters::
                        - `label`: __string__
                            - Text displayed in the Command Palette
                                - Should preferably include a plugin prefix to ensure global uniqueness if user has more than one plugin installed
                                    - for example `"RoamRS: Start review session"`
                        - `display-conditional`: __function__, optional
                            - Function called with `ref-context` which should return true if the command should be shown or false if not.
                                - `ref-context`
                                    - ```javascript
                                      {
                                        ref-uid: "YnatnbZzF"
                                        block-uid: "YnatnbZzF" // containing block uid
                                        window-id: "BBG4fFwolaVlT5FZQdzAI7P40aB3-body-outline-04-15-2021"
                                        indexes: [0 9] //outer indexes
                                      }
                                      ```
                        - `callback`: __function__
                            - Function called with `ref-context` when the user selects the command in block context menu. 
                    - Returns::
                        - null
                    - Usage::
                        - ```javascript
                          roamAlphaAPI.ui.blockRefContextMenu.addCommand(
                            {label: "Debug: Console Log",  
                             callback: (e)=>console.log(e)
                            }
                          )
                          ```
                - `.removeCommand`
                    - Description::
                        - Removes a command with the given `label` from the Block Context Menu
                    - Parameters::
                        - `label`: __string__
                            - Label provided when using `.addCommand`
                    - Returns::
                        - null
            - `.msContextMenu`
                - **What is this?** - MultiSelect Context Menu
                    - For adding, removing and executing callbacks on the block context menu when multiple blocks are selected
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdeveloper-documentation%2Fs7cSCoo1Ti.png?alt=media&token=584a7843-f870-4c6c-aa6d-e1204d2e1da0)
                - `addCommand`
                    - Parameters::
                        - `label`
                            - __string__
                        - `display-conditional`
                            - __function__
                            - Optional
                        - `callback`
                            - __function__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.addCommand(
                            {
                              "label": "test",
                              "callback": () => { console.log("hey") }
                            }
                          )
                          ```
                - `removeCommand`
                    - Parameters::
                        - `label`
                            - __string__
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.ui.msContextMenu.removeCommand(
                            {"label": "test"}
                          )
                          ```
