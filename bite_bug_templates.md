# Bug Template #

In bite, a New Bug Template is a JSON object in the form:
```
{
  id: string // A unique string identifier for this template.
  name: string // A human-readable name for this template.
  urls: Array // A list of urls that this template should be used for.
  project: string // The human-readable project that this template is associated with.
  backendProject: string // An identifier for the project that is compatable with the backend provider.
  backendProvider: string // The issue tracking system that this template is associated with.
  selectorText: string // Text that should appear when the user is asked to pick a
  //      template, under 'What kind of problem are you reporting?'
  noteText: string // Text that should appear in the notes field.
  displayOrder: number // An integer declaring the relative position where this
  //      template should be displayed in lists. Higher numbers are displayed after lower numbers.
}
```