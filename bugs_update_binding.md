# /bugs/update\_binding #
**Description**: Updates the UI element binding of a bug.

**HTTP method**: post

**Parameters**:
```
{
  id: string // Id of the bug to update.
  provider: string // The provider of the bug.
  project: string // The project the bug is under.
  action: string // One of [update, clear]
  target_element: string // The new target element to bind to, if the action is 'update'
}
```

**Returns**: { success: true } If successful