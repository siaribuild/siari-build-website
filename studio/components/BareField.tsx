import {FieldProps} from 'sanity'

// NOTE: placeholder created only to let `sanity schema extract` run. The real
// BareField component is missing from the reviewed archive (see assessment).
// Field components affect Studio rendering only, never the extracted schema types.
export function BareField(props: FieldProps) {
  return props.renderDefault(props)
}
