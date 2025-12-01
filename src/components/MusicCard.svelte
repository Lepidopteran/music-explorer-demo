<script lang="ts">
  import type { IAudioMetadata } from "music-metadata";
  import type { ClassValue, HTMLButtonAttributes } from "svelte/elements";

  interface Props {
    data: IAudioMetadata;
    class?: ClassValue;
    onclick?: HTMLButtonAttributes["onclick"];
  }

  let { data, class: className, onclick }: Props = $props();

  let image = $derived(
    data.common.picture?.find(
      (p) =>
        p.type?.toLowerCase()?.includes("cover") ||
        p.type?.toLowerCase()?.includes("front") ||
        p.format === "image/jpeg" ||
        p.format === "image/png",
    ),
  );
</script>

<button
  {onclick}
  class={[
    "rounded-2xl inline-flex flex-col cursor-pointer hover:scale-105 bg-neutral-900 active:scale-95 shadow-md inset-shadow-sm shadow-black/20 inset-shadow-black/5 w-48 h-64 overflow-hidden transition-all",
    className,
  ]}
>
  {#if image}
    <img
      src={URL.createObjectURL(new Blob([image.data], { type: image.format }))}
      alt={data.common.title}
      class="w-full block shadow-md"
    />
  {/if}
  <div class="p-2">
    <div class="font-bold truncate">
      {data.common.title}
    </div>
    <div class="text-sm truncate">
      {data.common.artist}
    </div>
  </div>
</button>
