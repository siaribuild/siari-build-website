import {useState} from 'react'
import {CopyIcon} from '@sanity/icons'
import {useClient, type DocumentActionComponent} from 'sanity'
import {useRouter} from 'sanity/router'

// Replaces the default "Duplicate" for orderable document types.
// The ordering plugin stores each document's position in an `orderRank` field.
// The built-in duplicate copies every field — including orderRank — so the copy
// lands on the exact same position as the original, which triggers a
// "duplicate order" warning and forces a manual resort every time.
// This version copies everything EXCEPT orderRank, so the duplicate appears
// unranked and can simply be dragged into place once.
export const duplicateWithoutRank: DocumentActionComponent = (props) => {
  const {draft, published, type, onComplete} = props
  const client = useClient({apiVersion: '2025-06-18'})
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return {
    label: busy ? 'Duplicating…' : 'Duplicate',
    icon: CopyIcon,
    disabled: busy,
    onHandle: async () => {
      setBusy(true)
      const source: any = draft || published
      if (!source) {
        setBusy(false)
        onComplete()
        return
      }
      // Strip system fields + orderRank; keep all editorial content.
      const {_id, _rev, _createdAt, _updatedAt, orderRank, ...rest} = source
      const uuid = (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}`
      const newId = `drafts.${uuid}`
      await client.create({...rest, _id: newId, _type: type})
      setBusy(false)
      onComplete()
      router.navigateIntent('edit', {id: uuid, type})
    },
  }
}
