<script lang="ts">
  import { BlobReader, BlobWriter, Writer, ZipReader } from "@zip.js/zip.js";
  import { fileTypeFromBlob } from "file-type";
  import { parseBlob, type IAudioMetadata } from "music-metadata";
  import { SvelteSet } from "svelte/reactivity";
  import MusicDetails from "./components/MusicDetails.svelte";
  import MusicCard from "./components/MusicCard.svelte";
  import { slide } from "svelte/transition";

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
    const fileItems = [...event.dataTransfer!.items].filter(
      (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = "copy";
    }
  }

  let progressMessage = $state("");

	// TODO: use async/await instead of this mess :/
  function ondrop(event: DragEvent) {
    event.preventDefault();
    songs.clear();
		dragCounter = 0;
		activeIndex = -1;

    const files = [...event.dataTransfer!.items]
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
        (entry as FileSystemFileEntry).file((file) => {
          if (!file.type.startsWith("application/")) {
            getAudioMetadata(file);
          } else {
            const reader = new ZipReader(new BlobReader(file));

            progressMessage = `Extracting ${file.name}...`;
            reader.getEntries().then((entries) => {
              for (const entry of entries) {
                if (entry.directory) {
                  continue;
                }

                let writer = new BlobWriter();
                entry.getData(writer);

                writer.getData().then((data) => {
                  fileTypeFromBlob(data).then((type) => {
                    if (
                      type?.mime.startsWith("audio/") ||
                      type?.mime.startsWith("video/")
                    ) {
                      progressMessage = `Processing ${entry.filename}...`;
                      parseBlob(data).then((metadata) => {
                        songs.add(metadata);

                        progressMessage = String();
                      });
                    }
                  });
                });
              }
            });
          }
        });
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

  let songs = $state(new SvelteSet<IAudioMetadata>());
  let activeIndex = $state(-1);
</script>

<svelte:window ondrop={handleWindowDrop} ondragover={handleWindowDragOver} />
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
    "h-full overflow-auto p-4 transition-all",
    isDragging
      ? "bg-neutral-900/50 border-dashed border-2 border-neutral-700"
      : "",
  ]}
>
  {#if songs.size === 0}
    <div class="flex flex-col justify-center items-center h-full">
      <h2 class="text-xl opacity-50">
        {#if progressMessage}
          {progressMessage}
        {:else}
          Drop audio files here to get started
        {/if}
      </h2>
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
