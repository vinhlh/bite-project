# /bugs/new #

**Description**: Posts a new bug to the server.

**HTTP method**: post

**Parameters**:
```
{
  provider: string // The provider to log this bug with.
  project: string // The project to log this bug with.
  title: string
  repro: string // A description of the bug
  url: string // The URL where the bug occured.
  target_element: string // Optional. A description of the UI element associated with the bug.
  recording_link: string // A link to the recording of this bug.
  version: string // The version of the browser used.
  screenshot: string // Optional. A data url of the screenshot.
}
```

**Returns**: URL where the user can get details about the bug just created.