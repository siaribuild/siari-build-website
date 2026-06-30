import {Fragment, createElement} from 'react'
import {type FieldProps} from 'sanity'

// Renders only a field's input (for an object, that's its member fields),
// dropping the field's own title/description/border. Used so a nested object
// can sit directly inside a document tab without showing a redundant group
// header (e.g. "Project Details" under the Details tab). Purely cosmetic —
// the stored data shape is unchanged.
export function BareField(props: FieldProps) {
  return createElement(Fragment, null, props.children)
}
