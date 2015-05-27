# /new\_template #
**Description**: Adds a new bug template to the server's database.

**HTTP method**: post

**Parameters**:
```
{
  id: string // A unique string identifier for this template.
  name: string // A human-readable name for this template.
  urls: string // Comma separated list of urls this template is applicable for.
  project: string // The project that this template is associated with.
  backend_project: string // An identifier for the project that is compatable with the backend provider.
  backend_provider: string // The issue tracking system that this template is associated with.
  selector_text: string // Text that should appear when the user is asked to pick a
  //      template, under 'What kind of problem are you reporting?'
  note_text: string // Text that should appear in the notes field.
  display_order: string // An integer declaring the relative position where this
  //      template should be displayed in lists. Higher numbers are displayedafter lower numbers.
}
```

**Returns**: unused