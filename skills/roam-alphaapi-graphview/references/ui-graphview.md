# window.roamAlphaAPI.ui.graphView

Quick TOC
- `.addCallback`
- `.removeCallback`
- `wholeGraph` (experimental / TODO in upstream docs)

---

            - `.graphView`
                - `addCallback`
                    - Description::
                        - Adds a callback that gets called whenever a graph view is loaded. There are two types of graph views - "all-pages" (the entire database) and "page" (a specific page and its components). Using the optional `type` parameter, you can request to only trigger callbacks on a specific type of graphs.
                        - The graph view is rendered using [[Cytoscape]], and by exposing the Cytoscape object, we hope to enable experimentation with various Cytoscape plugins, alternative UIs, etc.
                    - Parameters::
                        - `label`
                            - String label used to upsert or remove listener
                            - __string__
                        - `callback`
                            - Function called with `context` when the user selects the command in the Command Palette
                            - `context`:
                                - `cytoscape` holds a reference to the [[Cytoscape]] graph object
                                - `elements` is an array of the nodes and edges in the graph
                                - `type` is "page" | "all-pages"
                                - ```javascript
                                  { cytoscape: Core {_private: {…}},
                                    elements: [
                                      {id: "eTCpkG-HI", name: "B", weight: 7}
                                      {id: "05-04-2021", name: "May 4th, 2021", weight: 10}
                                      {id: "FrW4nHLat", name: "A", weight: 7}
                                      {id: "eTCpkG-HI-FrW4nHLat", source: "eTCpkG-HI", target: "FrW4nHLat"}
                                      {id: "eTCpkG-HI-eTCpkG-HI", source: "eTCpkG-HI", target: "eTCpkG-HI"}
                                      {id: "05-04-2021-eTCpkG-HI", source: "05-04-2021", target: "eTCpkG-HI"}
                                    ],
                                  type: "page" }
                                  ```
                            - __function__
                        - `type`
                            - Optionally specify the type of graph (`page` | `all-pages` to trigger on, if undefined, the callback triggers on all graphs
                            - __string__: "page" | "all-pages"
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `removeCallback`
                    - Description::
                        - Removes a callback with the given `label`
                    - Parameters::
                        - `label`
                            - Label provided when using `addCallback`
                            - __string__
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - {{[[TODO]]}} document `wholeGraph`
                    - New API for the new graph overview - old addCallback will not work with new graph overview
                    - examples
                        - ```javascript
                          roamAlphaAPI.ui.graphView.wholeGraph.addCallback({
                            "label": "test",
                            "callback": (x) => {
                              console.log(x);
                            }
                          })
                          
                          roamAlphaAPI.ui.graphView.wholeGraph.removeCallback({"label": "test"});
                          
                          roamAlphaAPI.ui.graphView.wholeGraph.setExplorePages(['a']);
                          const x = roamAlphaAPI.ui.graphView.wholeGraph.getExplorePages();
                          console.log(x);
                          
                          roamAlphaAPI.ui.graphView.wholeGraph.setMode("Whole Graph");
                          roamAlphaAPI.ui.graphView.wholeGraph.setMode("Explore");
                          ```
