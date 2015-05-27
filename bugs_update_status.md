# /bugs/update\_status #
**Description**: Updates the status of a bug.

**HTTP method**: post

**Parameters**:
```
{
  id: string // Id of the bug to update.
  provider: string // The provider of the bug.
  project: string // The project the bug is under.
  status: string // The new bug status
  comment: string // A comment on this change.
}
```

**Returns**: { success: true } If successful