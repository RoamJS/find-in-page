# window.roamAlphaAPI.data — block/page mutations

Quick TOC
- `.block.create` / `.block.update` / `.block.move` / `.block.delete`
- `.block.fromMarkdown`
- `.block.reorderBlocks`
- `.page.create` / `.page.update` / `.page.delete`
- `.page.fromMarkdown`
- `.page.addShortcut` / `.page.removeShortcut`
- `.user.upsert` (data-level)

---

            - `.block`
                - `create`
                    - Description::
                        - Creates a new block at a location
                    - Parameters::
                        - `location`
                            - `parent-uid` **required**
                            - `order` **required**
                        - `block`
                            - `string` **required**
                            - `uid` **optional**
                            - `open` **optional**
                            - `heading` **optional**
                            - `text-align` **optional**
                            - `children-view-type` **optional**
                            - `block-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window
                                .roamAlphaAPI
                                .createBlock(
                              	{"location": 
                              		{"parent-uid": "01-21-2021", 
                              		 "order": 0}, 
                              	 "block": 
                              		{"string": "test"}})
                              ```
                                - Thank you [[Tyler Wince]] and [[ccc]] for catching the original mistake in the docs :D 
                        - [[roam/render]]
                            - ```clojure
                              (ns demo.usage
                                (:require
                                 [reagent.core :as r]
                                 [roam.block :as block]))
                              
                              (defn create-block-btn [_]
                                  [:span
                                   {:draggable true
                                    :style    {:border "1px solid black"
                                               :cursor "pointer"
                                               :padding "5px"}
                                    :on-click (fn [evt] (block/create 
                              					{:location {:parent-uid "f8cXfDIRn"
                                                              :order 0}
                              					 :block {:string "Carthago delenda est"}}))}
                                   "create block"])
                              ```
                            - {{[[roam/render]]: ((HX31FisiA))}}
                - `move`
                    - Description::
                        - Move a block to a new location
                    - Parameters::
                        - `block`
                            - `uid` **required**
                        - `location`
                            - `parent-uid` **required**
                            - `order` **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window
                                .roamAlphaAPI
                                .moveBlock(
                              	{"location": 
                              		{"parent-uid": "01-21-2021", 
                              		 "order": 0}, 
                              	 "block": 
                              		{"uid": "f8cXfDIRn"}})
                              ```
                                - Thank you [[Tyler Wince]] and [[ccc]] for catching the original mistake in the docs :D 
                        - [[roam/render]]
                            - ```clojure
                              (ns demo.usage
                                (:require
                                 [reagent.core :as r]
                                 [roam.block :as block]))
                              
                              (defn move-block-btn [_]
                                  [:span
                                   {:draggable true
                                    :style    {:border "1px solid black"
                                               :cursor "pointer"
                                               :padding "5px"}
                                    :on-click (fn [evt] (block/move 
                              					{:location {:parent-uid "f8cXfDIRn"
                                                              :order 0}
                              					 :block {:uid "VCuWBrulO"}}))}
                                   "move block"])
                              ```
                            - {{[[roam/render]]: ((VZ-BSkkg3))}}
                - `update`
                    - Description::
                        - Updates a block's text and/or other properties like collapsed state, heading, text-align, children-view-type
                    - Parameters::
                        - `block`
                            - `uid` **required**
                            - `string` **optional**
                            - `open` **optional**
                            - `heading` **optional**
                            - `text-align` **optional**
                            - `children-view-type` **optional**
                            - `block-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - [[roam/js]]
                            - ```javascript
                              window
                                .roamAlphaAPI
                                .updateBlock({"block": 
                                              {"uid": "f8cXfDIRn",
                                               "string": "Love"}})
                              ```
                        - [[roam/render]]
                            - ```clojure
                              (ns demo.usage
                                (:require
                                 [reagent.core :as r]
                                 [roam.block :as block]))
                              
                              (defn update-block-btn [_]
                                  [:span
                                   {:draggable true
                                    :style    {:border "1px solid black"
                                               :cursor "pointer"
                                               :padding "5px"}
                                    :on-click (fn [evt] 
                                                (block/update 
                                                 {:block {:uid "VCuWBrulO"
                                                          :string "Love"}}))}
                                   "update block"])
                              ```
                            - {{[[roam/render]]: ((O7CtLyoUl))}}
                - `delete`
                    - Description::
                        - Delete a block and all its children, and recalculates order of sibling blocks
                    - Parameters::
                        - `block`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - [[roam/js]]
                        - ```javascript
                          // NOTE: The upstream docs sometimes show `updateBlock` here; deleting should use `deleteBlock`.
                          window
                            .roamAlphaAPI
                            .deleteBlock({"block": 
                                          {"uid": "f8cXfDIRn"}})
                          ```
                    - [[roam/render]]
                        - ```clojure
                          (ns demo.usage
                            (:require
                             [reagent.core :as r]
                             [roam.block :as block]))
                          
                          (defn update-block-btn [_]
                              [:span
                               {:draggable true
                                :style    {:border "1px solid black"
                                           :cursor "pointer"
                                           :padding "5px"}
                                :on-click (fn [evt] 
                                            (block/update 
                                             {:block {:uid "VCuWBrulO"}}))}
                               "delete block"])
                          ```
                        - {{[[roam/render]]: ((GOWw9B2MX))}}
                - `fromMarkdown`
                    - Description::
                        - Parses a markdown string into blocks and inserts them at a location
                        - Uses the same markdown parsing logic as the file import feature
                        - Nested lists become nested blocks
                        - Supports standard markdown: headings, lists, code blocks, bold, italic, links, etc.
                    - Parameters::
                        - `location`
                            - `parent-uid` **required**
                            - `order` **required**
                        - `markdown-string` required
                            - The markdown content to parse into blocks
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.data.block.fromMarkdown({
                              location: { "parent-uid": "4VuwigG1O", "order": "first" },
                              "markdown-string": "# Hello\n\n- Item 1\n- Item 2\n  - Nested"
                            });
                          ```
                    - Returns::
                        - Promise which resolves to a map of the top level UIDs created
                - `reorderBlocks`
                    - Description::
                        - Takes a `parent-uid` and an array of all the direct children of that block, and reorders the blocks according to the order provided in the array. 
                    - Parameters::
                        - `location`
                            - `parent-uid` **required**
                        - `blocks`
                            - array including all children of `parent-uid`, and no other blocks, with no duplicates, listed in order
                            - **required**
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - example blocks
                            - 1
                            - 2
                            - 3
                        - ```javascript
                          roamAlphaAPI.data.block.reorderBlocks({
                            location: {'parent-uid': 'ihu5eUofL'},
                            blocks: ['QCE0cNNNL','IATKcVmWE','nC22orMO4']})
                          ```
            - `.page`
                - `create`
                    - Description::
                        - Creates a new page with a given title
                        - Pages with title in the format of `January 21st, 2021` will create a new daily note if it does not yet exist
                    - Parameters::
                        - `page`
                            - `title` **required**
                            - `uid` **optional**
                                - in normal operation, should not be required
                            - `children-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `fromMarkdown`
                    - Description::
                        - Creates a new page with a given title and populates it with blocks parsed from a markdown string
                        - Uses the same markdown parsing logic as the file import feature
                        - Pages with title in the format of January 21st, 2021 will create a new daily note if it does not yet exist
                        - Will error if a page with the given title already exists
                    - Parameters::
                        - `page`
                            - `title` **required**
                            - `uid` **optional**
                                - in normal operation, should not be required
                            - `children-view-type` **optional**
                        - `markdown-string` required
                            - The markdown content to parse into blocks
                            - Supports standard markdown: headings, lists, code blocks, bold, italic, links, etc.
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.data.page.fromMarkdown({
                              page: {
                                title: "My New Page"
                              },
                              "markdown-string": "# Heading\n\n- Item 1\n- Item 2"
                            })
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `update`
                    - Description::
                        - Updates a page's title and/or its children-view-type
                    - Parameters::
                        - `page`
                            - `uid` **required**
                            - `title` **optional**
                            - `children-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `delete`
                    - Description::
                        - Delete a page and all its children blocks
                    - Parameters::
                        - `page`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `addShortcut`
                    - Description::
                        - Add page to the left sidebar shortcuts, supply an index to add at a specific place, or none to add at the end
                        - Can also use to update the index
                    - Parameters::
                        - `uid` **required**
                        - `index`
                    - Example::
                        - ```javascript
                          roamAlphaAPI.data.page.addShortcut("12-11-2025");
                          roamAlphaAPI.data.page.addShortcut("12-11-2025", 4);
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `removeShortcut`
                    - Description::
                        - removes page from shortcuts
                    - Parameters::
                        - `uid` **required**
                    - Example::
                        - ```javascript
                          roamAlphaAPI.data.page.removeShortcut("12-11-2025")
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
            - `.page`
                - `create`
                    - Description::
                        - Creates a new page with a given title
                        - Pages with title in the format of `January 21st, 2021` will create a new daily note if it does not yet exist
                    - Parameters::
                        - `page`
                            - `title` **required**
                            - `uid` **optional**
                                - in normal operation, should not be required
                            - `children-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `fromMarkdown`
                    - Description::
                        - Creates a new page with a given title and populates it with blocks parsed from a markdown string
                        - Uses the same markdown parsing logic as the file import feature
                        - Pages with title in the format of January 21st, 2021 will create a new daily note if it does not yet exist
                        - Will error if a page with the given title already exists
                    - Parameters::
                        - `page`
                            - `title` **required**
                            - `uid` **optional**
                                - in normal operation, should not be required
                            - `children-view-type` **optional**
                        - `markdown-string` required
                            - The markdown content to parse into blocks
                            - Supports standard markdown: headings, lists, code blocks, bold, italic, links, etc.
                    - Example::
                        - ```javascript
                          window.roamAlphaAPI.data.page.fromMarkdown({
                              page: {
                                title: "My New Page"
                              },
                              "markdown-string": "# Heading\n\n- Item 1\n- Item 2"
                            })
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `update`
                    - Description::
                        - Updates a page's title and/or its children-view-type
                    - Parameters::
                        - `page`
                            - `uid` **required**
                            - `title` **optional**
                            - `children-view-type` **optional**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `delete`
                    - Description::
                        - Delete a page and all its children blocks
                    - Parameters::
                        - `page`
                            - `uid` **required**
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `addShortcut`
                    - Description::
                        - Add page to the left sidebar shortcuts, supply an index to add at a specific place, or none to add at the end
                        - Can also use to update the index
                    - Parameters::
                        - `uid` **required**
                        - `index`
                    - Example::
                        - ```javascript
                          roamAlphaAPI.data.page.addShortcut("12-11-2025");
                          roamAlphaAPI.data.page.addShortcut("12-11-2025", 4);
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
                - `removeShortcut`
                    - Description::
                        - removes page from shortcuts
                    - Parameters::
                        - `uid` **required**
                    - Example::
                        - ```javascript
                          roamAlphaAPI.data.page.removeShortcut("12-11-2025")
                          ```
                    - Returns::
                        - Promise which resolves once operation has [completed](((CMKX2Zpwl)))
