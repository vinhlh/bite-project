# Bug #

In BITE, a bug is a JSON object of the form:
```
{
  bug_id: string // The ID of the bug in the source (original) bug database.
  title: string // The bug's title.
  summary: string // The bug's summary.
  priority: string // The bug's priority.
  project: string // Name of the project this bug is associated with.
  provider: string // Source provider of the bug information.
  author: string // The user who first reported this bug.
  status: string // Status of the bug (eg. active, fixed, closed).
  details_link: string // Link to the bug details on the original source.
  reported_on: string // The date the bug was first opened.
  last_update: string // Date the bug was last updated in the original bug database.
  last_updater: string // The last user to update the bug.
  target_element: string // When specified, describes an element on the page the bug is associated with.
  has_target_element: boolean // Whether or not the bug has a target element.
  screenshot: string // Url to an associated screenshot.
  has_screenshot: boolean // Whether a screenshot is attached.
  url: string // The url of the page the bug is referring to.
  has_recording: boolean // True, if the bug has recorded script attached.
  recording_link: string // Link to recorded script.
}
```