# window.roamAlphaAPI.ui.filters

Quick TOC
- `.addGlobalFilter`
- `.removeGlobalFilter`
- `.getGlobalFilters`
- `.getPageFilters` / `.setPageFilters`
- `.getPageLinkedRefsFilters` / `.setPageLinkedRefsFilters`
- `.getSidebarWindowFilters` / `.setSidebarWindowFilters`

---

                - `.addGlobalFilter`
                    - Description::
                        - Adds a global filter, similar to clicking on the little globe on the top right of a link in the filter dialogue
                    - Parameters::
                        - `title`
                            - Page title
                            - __string__
                        - `type`
                            - One of "includes" | "removes"
                            - __string__
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.removeGlobalFilter`
                    - Description::
                        - Removes a global filter
                    - Parameters::
                        - `title`
                            - Page title
                            - __string__
                        - `type`
                            - One of "includes" | "removes"
                            - __string__
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                - `.getGlobalFilters`
                    - Description::
                        - Returns a list of global filters currently in place, distinguishing between "includes" and "removes"
                    - Parameters::
                        - __None__
                - `.getPageFilters`
                    - Description::
                        - Returns a list of filters currently in place for that page for the current user, distinguishing between "includes" and "removes"
                    - Parameters::
                        - `page`
                            - (one of `title` or `uid` is required)
                            - `uid`
                            - `title`
                    - Returns::
                        - An object containing keys "includes" and "removes", both of which have a list of page-titles as values
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FiKeG5RI0CX.png?alt=media&token=17f843dd-9f42-46e8-b7f6-9fcebb3e3aa4)
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.getPageFilters(
                            {
                              "page": 
                              {
                                "title": "test"
                              }
                            })
                          ```
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FiKeG5RI0CX.png?alt=media&token=17f843dd-9f42-46e8-b7f6-9fcebb3e3aa4)
                - `.getPageLinkedRefsFilters`
                    - Description::
                        - Returns a list of filters currently in place for that page's linked references (aka mentions) for the current user, distinguishing between "includes" and "removes"
                    - Parameters::
                        - `page`
                            - (one of `title` or `uid` is required)
                            - `uid`
                            - `title`
                    - Returns::
                        - An object containing keys "includes" and "removes", both of which have a list of page-titles as values
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FIWWqE5eMAh.png?alt=media&token=49b862e8-a86b-48eb-898b-f9ecdf8f3ba9)
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.getPageLinkedRefsFilters(
                            {
                              "page": 
                              {
                                "title": "test"
                              }
                            })
                          ```
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FIWWqE5eMAh.png?alt=media&token=49b862e8-a86b-48eb-898b-f9ecdf8f3ba9)
                - `.getSidebarWindowFilters`
                    - Description::
                        - Returns a list of filters currently in place for that page's linked references (aka mentions) for the current user, distinguishing between "includes" and "removes"
                    - Parameters::
                        - `window` 
                            - (similar input as the input of right sidebar functions)
                            - `type`
                                - Required
                            - `block-uid`
                                - Required
                    - Returns::
                        - `.getSidebarWindowFilters`
                        - An object containing keys "includes" and "removes", both of which have a list of page-titles as values
                        - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FH1CpnUwT9D.png?alt=media&token=97e38a67-4c28-469c-9090-32fd885b679f)
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.getSidebarWindowFilters(
                            {
                              "window": 
                              {
                                "block-uid": "WYlc2nIO9", 
                                "type": "outline"
                              }
                            })
                          ```
                            - ![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Froamteam%2FH1CpnUwT9D.png?alt=media&token=97e38a67-4c28-469c-9090-32fd885b679f)
                - `.setPageFilters`
                    - Description::
                        - Set a pages filters
                    - Parameters::
                        - `page`
                            - (one of `title` or `uid` is required)
                            - `uid`
                            - `title`
                        - `filters`
                            - (similar to the Returns:: of `.getPageFilters`)
                            - `includes`
                                - array of page titles
                            - `removes`
                                - array of page titles
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.setPageFilters(
                            {
                              "page": {"title": "test"},
                              "filters": {"includes": ["March 11th, 2022"]}
                            })
                          
                          // the following clears the filters
                          window.roamAlphaAPI.ui.filters.setPageFilters(
                            {
                              "page": {"title": "test"},
                              "filters": {}
                            })
                          ```
                - `.setPageLinkedRefsFilters`
                    - Description::
                        - Set a page linked references' (aka mentions') filters
                    - Parameters::
                        - `page`
                            - (one of `title` or `uid` is required)
                            - `uid`
                            - `title`
                        - `filters`
                            - (similar to the Returns:: of `.getPageLinkedRefsFilters`)
                            - `includes`
                                - array of page titles
                            - `removes`
                                - array of page titles
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.setPageLinkedRefsFilters(
                            {
                              "page": {"title": "test"},
                              "filters": {"includes": ["Author"]}
                            })
                          
                          // the following clears the filters
                          window.roamAlphaAPI.ui.filters.setPageLinkedRefsFilters(
                            {
                              "page": {"title": "test"},
                              "filters": {}
                            })
                          ```
                - `.setSidebarWindowFilters`
                    - Description::
                        - Set the filters for a right sidebar window
                    - Parameters::
                        - `window` 
                            - (similar input as the input of right sidebar functions)
                            - `type`
                                - Required
                            - `block-uid`
                                - Required
                        - `filters`
                            - (similar to the Returns:: of `.getSidebarWindowFilters`)
                            - `includes`
                                - array of page titles
                            - `removes`
                                - array of page titles
                    - Returns::
                        - Promise which resolves once operation has completed
                            - More details [here](((CMKX2Zpwl)))
                    - Usage::
                        - ```javascript
                          window.roamAlphaAPI.ui.filters.setSidebarWindowFilters(
                            {
                              "window": 
                              {
                                "block-uid": "WYlc2nIO9", 
                                "type": "outline"
                              },
                              "filters": {"includes": ["Author"]}
                            })
                          
                          // the following clears the filters
                          window.roamAlphaAPI.ui.filters.setSidebarWindowFilters(
                            {
                              "window": 
                              {
                                "block-uid": "WYlc2nIO9", 
                                "type": "outline"
                              },
                              "filters": {}
                            })
                          ```
