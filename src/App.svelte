<script lang="ts">
  import { BlobReader, BlobWriter, Writer, ZipReader } from "@zip.js/zip.js";
  import { fileTypeFromBlob } from "file-type";
  import { parseBlob, type IAudioMetadata } from "music-metadata";
  import { SvelteSet } from "svelte/reactivity";
  import MusicDetails from "./components/MusicDetails.svelte";
  import MusicCard from "./components/MusicCard.svelte";
  import { slide } from "svelte/transition";
  import Button from "./components/Button.svelte";
  import Icon from "@iconify/svelte";

  let dropZone: HTMLElement;
  function handleWindowDrop(event: DragEvent) {
    if (
      [...(event.dataTransfer?.items ?? [])].some(
        (item) => item.kind === "file",
      )
    ) {
      event.preventDefault();
    }
  }

  function handleWindowDragOver(event: DragEvent) {
    const fileItems = [...(event.dataTransfer?.items ?? [])].filter(
      (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
      event.preventDefault();
      if (!dropZone.contains(event.target as Node)) {
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "none";
        }
      }
    }
  }

  let dragCounter = $state(0);
  let isDragging = $derived(dragCounter > 0);

  function ondragenter(event: DragEvent) {
    event.preventDefault();
    dragCounter++;
  }

  function ondragleave(event: DragEvent) {
    event.preventDefault();
    dragCounter--;
  }

  function ondragover(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }

    const fileItems = [...event.dataTransfer.items].filter(
      (item) => item.kind === "file",
    );

    if (fileItems.length > 0) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }

  let progressMessage = $state("");

  async function ondrop(event: DragEvent) {
    event.preventDefault();
    songs.clear();
    dragCounter = 0;
    activeIndex = -1;

    console.debug("drop", event.dataTransfer!.items.length);
    const items = event.dataTransfer!.items;
    await readItems(items);
  }

  async function readItems(items: DataTransferItemList) {
    const files = [...items]
      .filter((item) => item.kind === "file")
      .map((item) => item.webkitGetAsEntry())
      .filter(Boolean);

    for (const entry of files) {
      if (entry?.isDirectory) {
        progressMessage = `Reading ${entry.name}...`;
        readAllDirectoryEntries(
          (entry as FileSystemDirectoryEntry).createReader(),
          readSongs,
        );
      } else if (entry?.isFile) {
        (entry as FileSystemFileEntry).file(async (file) => {
          await readFile(file);
        });
      }
    }
  }

  async function readFile(file: File) {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      getAudioMetadata(file);
    } else if (["zip", "x-zip-compressed"].includes(file.type.split("/")[1])) {
      await readZip(file);
    }
  }

  async function readZip(file: File) {
    const reader = new ZipReader(new BlobReader(file));

    progressMessage = `Extracting ${file.name}...`;
    const entries = await reader.getEntries();

    for (const entry of entries) {
      if (entry.directory) {
        continue;
      }

      let writer = new BlobWriter();
      await entry.getData(writer);

      const data = await writer.getData();
      const fileType = await fileTypeFromBlob(data);

      if (
        fileType?.mime.startsWith("audio/") ||
        fileType?.mime.startsWith("video/")
      ) {
        progressMessage = `Processing ${entry.filename}...`;
        const metadata = await parseBlob(data);
        songs.add(metadata);

        progressMessage = String();
      }
    }
  }

  function readAllDirectoryEntries(
    directoryReader: FileSystemDirectoryReader,
    callback: (entries: FileSystemEntry[]) => void,
  ) {
    directoryReader.readEntries(function (entries) {
      if (entries.length === 0) return;

      callback(entries);
      readAllDirectoryEntries(directoryReader, callback);
    });
  }

  function getAudioMetadata(file: File) {
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      progressMessage = `Processing ${file.name}...`;
      parseBlob(file)
        .then((metadata) => {
          songs.add(metadata);
          progressMessage = String();
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  function readSongs(entries: FileSystemEntry[]) {
    for (const entry of entries) {
      if (entry.isFile) {
        (entry as FileSystemFileEntry).file(getAudioMetadata);
      } else if (entry.isDirectory) {
        progressMessage = `Reading ${entry.name}...`;
        readAllDirectoryEntries(
          (entry as FileSystemDirectoryEntry).createReader(),
          readSongs,
        );
      }
    }
  }

  let fileInput: HTMLInputElement | null = $state(null);
  let folderInput: HTMLInputElement | null = $state(null);
  let songs = $state(new SvelteSet<IAudioMetadata>());
  let activeIndex = $state(-1);
</script>

<svelte:window ondrop={handleWindowDrop} ondragover={handleWindowDragOver} />

<div class="absolute top-0 left-0 size-full overflow-hidden">
  <svg>
    <defs>
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.5"
          numOctaves="2"
          result="warp"
        />
        <feComposite in="SourceGraphic" in2="warp" operator="out" />
      </filter>
    </defs>
  </svg>
	<div class="absolute top-0 left-0 size-full bg-neutral-900/50" style="filter: url('#noise')"></div>
</div>

<header
  class="flex shadow-md inset-shadow-sm shadow-black/20 inset-shadow-black/50 col-span-full"
></header>
<aside class="bg-neutral-800"></aside>
<main
  bind:this={dropZone}
  {ondragover}
  {ondrop}
  {ondragenter}
  {ondragleave}
  class={[
    "h-full overflow-auto p-4 transition-all border-2 border-dashed relative",
    isDragging ? "bg-neutral-900/50 border-neutral-700" : "border-transparent",
  ]}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="audio/*, video/*, application/zip, application/x-zip-compressed"
    multiple
    hidden
    onchange={async (event) => {
      event.preventDefault();
      for (const file of (event.target as HTMLInputElement).files ?? []) {
        await readFile(file);
      }
    }}
  />

  <input
    bind:this={folderInput}
    type="file"
    webkitdirectory
    hidden
    onchange={async (event) => {
      event.preventDefault();
      for (const file of (event.target as HTMLInputElement).files ?? []) {
        await readFile(file);
      }
    }}
  />

  {#if songs.size === 0}
    <div class="flex flex-col gap-2 justify-center items-center h-full">
      {#if progressMessage}
        <h2 class="text-center">{progressMessage}</h2>
      {:else}
        <h2 class="text-center">
          <span class="block">
            Drag and drop audio/zip files or folders here.
          </span>
        </h2>
        <span class="block opacity-50"> or </span>
        <div class="flex gap-2 items-center">
          <Button onclick={() => fileInput?.click()}>
            <Icon icon="mingcute:file-fill" class="mr-2" />
            Import files
          </Button>
          <Button onclick={() => folderInput?.click()}>
            <Icon icon="mingcute:folder-fill" class="mr-2" />
            Import folder
          </Button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex flex-wrap gap-4">
      {#each Array.from(songs) as song, index}
        <MusicCard
          data={song}
          onclick={() => (activeIndex = index)}
          class={[activeIndex === index ? "bg-neutral-700!" : ""]}
        />
      {/each}
    </div>
  {/if}
</main>
<aside class="bg-neutral-900/50 h-full shadow-md shadow-black/20">
  {#if songs.size > 0 || progressMessage.length > 0}
    <div transition:slide={{ axis: "x" }} class="h-full">
      <MusicDetails
        data={activeIndex !== -1 ? Array.from(songs).at(activeIndex) : null}
      />
    </div>
  {/if}
</aside>
<footer
  class="bg-neutral-900 p-2 py-1 h-full flex justify-between items-center divide-neutral-800 col-span-full shadow-md"
>
  <div>
    Songs loaded: {songs.size}
  </div>
  <div></div>
  <div>
    {progressMessage}
  </div>
</footer>
