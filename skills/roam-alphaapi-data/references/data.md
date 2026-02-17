# window.roamAlphaAPI.data

Quick TOC
- `.q` (datalog)
- `.pull` / `.pull_many`
- `.search`
- `.roamQuery`
- `.async.*` variants
- `.fast.*` variants
- `.backend.q`
- `.addPullWatch` / `.removePullWatch`
- `.undo` / `.redo`

---

        - `.data`
            - `.q`
                - Description::
                    - Query the graph using datomic flavored datalog
                    - See the [datomic docs](https://docs.datomic.com/on-prem/query/query.html) for a full explanation of datalog queries
                        - Or http://www.learndatalogtoday.org learn how to write them
                        - [Datascript tests](https://github.com/tonsky/datascript/tree/master/test/datascript/test) also include great examples
                    - `q`, `pull`, and variant API functions now have a timeout of 20 seconds
                        - Throws an error with message `Query and/or pull expression took too long to run.` when you run into the timeout limit
                - Parameters::
                    - `query`
                        - Type::
                            - String
                    - `& args`
                - Example::
                    - ```javascript
                      window.roamAlphaAPI.data.q(
                        `[:find ?b ?s
                          :where 
                          [?e :block/uid ?b]
                          [?e :block/string ?s]]`);
                      ```
                        - Find a relation of all block uids and strings in the graph
            - `.pull`
                - Description::
                    - A declarative way to make hierarchical (and possibly nested) selections of information about entities. Pull applies a `pattern` to a collection of entities, building a map for each entity.
                    - See for the [datomic docs](https://docs.datomic.com/on-prem/query/pull.html) for a good explanation of how to use pull
                        - There are slight differences because we use [datascript](https://github.com/tonsky/datascript) internally, but it supports the majority of datomic syntax
                        - The main difference is the JS API the pattern is written in a string instead of clojure data structures
                    - `q`, `pull`, and variant API functions now have a timeout of 20 seconds
                        - Throws an error with message `Query and/or pull expression took too long to run.` when you run into the timeout limit
                - Parameters::
                    - `pattern`
                        - Type::
                            - String
                        - Examples::
                            - `"[*]"`
                            - `"[:block/string {:block/children ...}]"`
                    - `eid`
                        - [[OR]]
                            - a database id `:db/id`
                                - Type::
                                    - Integer
                                - Example::
                                    - `24`
                            - an entity unique identifier
                                - Type::
                                    - String | 2-tuple array
                                - Example::
                                    - `"[:node/title \"hello world\"]"`
                                    - `[":block/uid", "xyz"]`
                - Example::
                    - ```javascript
                      window.roamAlphaAPI.data.pull("[*]", [":block/uid", "xyz"])
                      ```
                        - Get all of the attributes for this block
                    - `window.roamAlphaAPI.data.pull("[:block/string {:block/children ...}]", "[:block/uid \"xyz\"]")`
                        - Get the block string for this block and all it's children
            - `.pull_many`
                - Description::
                    - Same as `.pull` but for multiple entities
                        - May be faster for pulling many entities at the same time
                    - `q`, `pull`, and variant API functions now have a timeout of 20 seconds
                        - Throws an error with message `Query and/or pull expression took too long to run.` when you run into the timeout limit
                - Parameters::
                    - `pattern`
                        - Same as pull's `pattern`
                    - `eids`
                        - an array of `eid`s
                - Example::
                    - `roamAlphaAPI.data.pull_many("[*]", [[":block/uid", "_fM7pkQEa"], [":block/uid", "kZHsZniZs"]]);`
            - `.fast`
                - Description::
                    - Functions underneath `.fast` use experimental clojurescript to javascript conversion to speed up read access. They tend to be around 33% faster and more comparable to running it in pure clojurescript.
                    - Functions accept the same parameters as their regular peers
                    - Functions return a cljs object wrapped in a js [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
                        - This object should be treated as **read only**
                            - and may not print to the console correctly
                        - Map/object access may be different
                            - Key access will by default include the full namespaced key like this
                                - `obj[":block/string"]`
                                    - This proxies to the cljs keyword `:block/string`
                                - but if you renamed the key in a pull
                                    - Like this `"[:block/string :as "string"]"`
                                    - Then it should be able to be accessed like this
                                        - `obj.string`
                        - For a deeper explanation of how this works internally and the trade offs see https://blog.wsscode.com/alternative-to-clj-js/
                    - `q`, `pull`, and variant API functions now have a timeout of 20 seconds
                        - Throws an error with message `Query and/or pull expression took too long to run.` when you run into the timeout limit
                - functions::
                    - `.q`
            - `.search`
                - Description::
                    - Searches pages and blocks matching a query string
                    - Equivalent to the "Find or Create Page" search algorithm in the UI
                    - Results are ranked by relevance using the following priority:
                        - **Rank 0**: Page title exactly matches query
                        - **Rank 1**: Page title contains query as substring
                        - **Rank 2**: Page title contains all query words (multi-word queries only)
                        - **Rank 3**: Block contains query as substring
                        - **Rank 4**: Block contains all query words (multi-word queries only)
                - Parameters::
                    - `search-str` **required**
                        - The search query string
                    - `search-blocks` **optional**
                        - Include block results
                        - default: `true`
                    - `search-pages` **optional**
                        - Include page results
                        - default: `true`
                    - `hide-code-blocks` **optional**
                        - Exclude code blocks from results
                        - default: `false`
                    - `limit` **optional**
                        - Maximum number of results to return
                        - default: `300`
                        - max: `1000`
                    - `pull` **optional**
                        - Pull pattern for customizing returned fields
                        - Can be a string or array
                        - default: `[:block/string :node/title :block/uid]`
                - Example::
                    - ```javascript
                      roamAlphaAPI.data.search({"search-str": "my query"})
                      ```
                - Returns::
                    - Array of results matching the pull pattern
            - `.roamQuery`
                - Description::
                    - Execute a Roam query and return matching blocks/pages. Similar to `.search` but for Roam's native query syntax (the same syntax used in `{{[[query]]: ...}}` blocks).
                    - Two modes of operation:
                        - **UID mode**: Pass the `uid` of an existing query block to use its stored settings
                        - **Query mode**: Pass a `query` string directly with optional display settings
                    - Returns `{total: number, results: Array}` where results use the specified pull pattern
                - Parameters::
                    - `uid` (String) - Block uid of an existing query block. Uses the block's stored display settings.
                    - `query` (String) - Direct query string, e.g. `"{and: [[project]] [[active]]}"`. Required if no `uid`.
                    - `groupByPage` (Boolean, default: `true`) - Group results by page. Query mode only.
                    - `nestUnderParent` (Boolean, default: `false`) - Collapse child matches under parent. Query mode only.
                    - `sort` (String) - Sort type. Query mode only.
                        - When `groupByPage` is true: `"page-most-recent"` (default), `"page-title"`, `"page-created-date"`, `"daily-note"`
                        - When `groupByPage` is false: `"created-date"` (default), `"edited-date"`, `"daily-note-date"`
                    - `sortOrder` (String, default: `"desc"`) - `"asc"` or `"desc"`. Query mode only.
                    - `offset` (Integer, default: `0`) - Number of results to skip.
                    - `limit` (Integer | null, default: `20`) - Max results. Pass `null` for all results.
                    - `pull` (String, default: `"[:block/string :node/title :block/uid]"`) - Pull pattern for results.
                - Example::
                    - ```javascript
                      await window.roamAlphaAPI.data.roamQuery({query: "{and: [[project]] [[active]]}"})
                      ```
                    - ```javascript
                      await window.roamAlphaAPI.data.roamQuery({uid: "abc123def"})
                      ```
                        - Execute query block's query using its stored settings
            - `.async`
                - Description::
                    - The functions under `.async` are equivalent to the non async versions, except they return promises.
                    - Eventually Roam will migrate to the async API and the sync functions will be deprecated, **if you are building a new extension you should prefer using these to avoid migrating in the future.**
                - `.q`
                - `.pull`
                - `.pull_many`
                - `.search`
                - `.fast`
                    - `.q`
            - `.backend`
                - Description::
                    - The functions under `.backend` (currently only `q`) run against the backend (off thread). 
                    - This could be useful if you have an expensive query to run.
                    - If the backend doesn't exist for a graph or it's unavailable (encrypted or offline), then it will default to running locally.
                    - **Warning**: The backend could be a few changes behind the frontend if changes are still syncing
                - `.q`
            - `.addPullWatch`
                - Description::
                    - Watches for changes on pull patterns on blocks and pages and provides a callback to execute after changes are recorded, providing the before and after state to operate on
                - Parameters::
                    - pull pattern
                        - {{[[TODO]]}} 
                        - __string__
                        - Required
                    - entity-id
                        - {{[[TODO]]}} 
                        - __string__
                        - Required
                    - callback function
                        - Takes two arguments, before and after state of the pull
                        - __function__
                        - Required
                - Returns::
                    - Promise which resolves once operation has completed
                        - More details [here](((CMKX2Zpwl)))
                - Usage::
                    - ```javascript
                      window
                        .roamAlphaAPI
                        .data
                        .addPullWatch(
                        	"[:block/children :block/string {:block/children ...}]",
                          '[:block/uid "02-21-2021"]',
                           function a(before, after) { console.log("before", before, "after", after); })
                      ```
            - `.removePullWatch`
                - Description::
                    - Removes pull watch
                        - If no callback provided, clears all watches from pull pattern
                        - If callback provided, only removes watch with that callback
                - Parameters::
                    - pull pattern
                        - {{[[TODO]]}} 
                        - __string__
                        - Required
                    - entity-id
                        - {{[[TODO]]}} 
                        - __string__
                        - Required
                    - callback function
                        - __function__
                        - Optional
                - Returns::
                    - Promise which resolves once operation has completed
                        - More details [here](((CMKX2Zpwl)))
                - Usage::
                    - ```javascript
                      const pullPattern = '[:block/children :block/string {:block/children ...}]';
                      const entity = '[:node/title "Testing Page 2"]';
                      const testFn = function a(before, after) { console.log("before", before, "after", after);};
                      
                      
                      // first of all, you'd need to add it like the following
                      window
                        .roamAlphaAPI
                        .data
                        .addPullWatch(
                        	pullPattern,
                          entity,
                           testFn);
                      
                      console.log("added pull watch")
                      
                      // MAIN: how to remove pull watches
                      window
                        .roamAlphaAPI
                        .data
                        .removePullWatch(
                        	pullPattern,
                          entity,
                           testFn); 
                      console.log("Removed pull watch")
                      ```
            - `.undo`
                - Description::
                - Parameters::
                    - None
                - Returns::
                    - Promise which resolves once operation has completed
                        - More details [here](((CMKX2Zpwl)))
                - Usage::
            - `.redo`
                - Description::
                - Parameters::
                    - None
                - Returns::
                    - Promise which resolves once operation has completed
                        - More details [here](((CMKX2Zpwl)))
                - Usage::
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
                          window
                            .roamAlphaAPI
                            .updateBlock({"block": 
                                          {"uid": "f8cXfDIRn"}})
                          ```
                            - Thank you [[Tyler Wince]] and [[@ccc]] for catching the original mistake in the docs :D 
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
