<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    children?: Snippet;
  }

  let {
    type = "button",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<button {type} class={className} {...rest}>
  {@render children?.()}
</button>

<style>
  @layer components {
    button {
      border-radius: 0.5rem;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem 1rem;
      border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
			cursor: pointer;

			&:hover {
				background-color: color-mix(in srgb, currentColor 10%, transparent);
			}
    }
  }
</style>
