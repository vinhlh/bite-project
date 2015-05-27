# /bugs/update\_recording #
**Description**: Updates the recoding link of a bug.

**HTTP method**: post

**Parameters**:
```
{
  id: string // Id of the bug to update.
  provider: string // The provider of the bug.
  project: string // The project the bug is under.
  action: string // One of [update, clear].
  recording_link: string // The recording link, if the action is 'update'.
}
```

**Returns**: { success: true } If successful