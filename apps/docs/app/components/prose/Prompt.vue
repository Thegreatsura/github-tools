<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { getSlotChildrenText } from '@nuxt/ui/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  description: { type: String, default: undefined },
  icon: { type: String, default: undefined },
  actions: { type: Array as () => string[], default: () => ['copy'] },
  class: { type: null, default: undefined },
  ui: { type: Object, default: undefined },
})

const slots = defineSlots()
const { copy, copied } = useClipboard()
const appConfig = useAppConfig()

const secondaryButtonUi = {
  base: 'ring-0 border border-default bg-accented text-highlighted hover:bg-muted hover:border-border-accented',
}

function getPromptText() {
  const children = slots.default?.()
  return children ? getSlotChildrenText(children).trim() : ''
}

function copyPrompt() {
  copy(getPromptText())
}

function openInCursor() {
  const url = new URL('cursor://anysphere.cursor-deeplink/prompt')
  url.searchParams.set('text', getPromptText())
  window.open(url.toString(), '_self')
}

function openInWindsurf() {
  const url = new URL('windsurf://cascade/newChat')
  url.searchParams.set('prompt', getPromptText())
  window.open(url.toString(), '_self')
}
</script>

<template>
  <div
    class="relative my-4 flex flex-wrap items-center gap-2 rounded-lg border border-default bg-muted px-3 py-2.5"
    :class="[props.class, props.ui?.root]"
    v-bind="$attrs"
  >
    <UIcon
      v-if="props.icon"
      :name="props.icon"
      class="size-4 shrink-0 text-highlighted"
      :class="props.ui?.icon"
    />

    <p
      v-if="props.description"
      class="min-w-0 flex-1 text-sm/5 text-toned"
      :class="props.ui?.description"
    >
      {{ props.description }}
    </p>

    <div
      class="prompt-actions flex shrink-0 flex-wrap items-center gap-1.5 sm:ms-auto"
      :class="props.ui?.actions"
    >
      <UButton
        v-if="props.actions.includes('copy')"
        :icon="copied ? appConfig.ui.icons.copyCheck : appConfig.ui.icons.copy"
        color="neutral"
        variant="solid"
        size="xs"
        label="Copy prompt"
        @click="copyPrompt"
      />

      <UButton
        v-if="props.actions.includes('cursor')"
        icon="i-simple-icons-cursor"
        color="neutral"
        variant="outline"
        size="xs"
        :ui="secondaryButtonUi"
        label="Cursor"
        @click="openInCursor"
      />

      <UButton
        v-if="props.actions.includes('windsurf')"
        icon="i-simple-icons-windsurf"
        color="neutral"
        variant="outline"
        size="xs"
        :ui="secondaryButtonUi"
        label="Windsurf"
        @click="openInWindsurf"
      />
    </div>
  </div>
</template>
