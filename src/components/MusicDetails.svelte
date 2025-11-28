<script lang="ts">
  import type { IAudioMetadata, ICommonTagsResult } from "music-metadata";
  import { match } from "ts-pattern";

  function renameTagKey(key: keyof ICommonTagsResult): string {
    return match(key)
      .with("albumartist", () => "Album Artist")
      .with("totaltracks", () => "Total Tracks")
      .with("totaldiscs", () => "Total Discs")
      .with("originaldate", () => "Original Date")
      .with("releasedate", () => "Release Date")
      .with("originalalbum", () => "Original Album")
      .with("originalyear", () => "Original Year")
      .with("originalartist", () => "Original Artist")
      .with("encodedby", () => "Encoded By")
      .with("encodersettings", () => "Encode Settings")
      .with("isrc", () => "ISRC")
      .with("bpm", () => "BPM")
      .with("titlesort", () => "Title Sort")
      .with("discsubtitle", () => "Disc Subtitle")
      .with("releasetype", () => "Release Type")
      .with("releasecountry", () => "Release Country")
      .with("artistsort", () => "Artist Sort")
      .with("composersort", () => "Composer Sort")
      .with("albumartistsort", () => "Album Artist Sort")
      .with("musicbrainz_trackid", () => "MusicBrainz Track ID")
      .with("musicbrainz_albumid", () => "MusicBrainz Album ID")
      .with("musicbrainz_recordingid", () => "MusicBrainz Recording ID")
      .with("musicbrainz_artistid", () => "MusicBrainz Artist ID")
      .with("musicbrainz_albumartistid", () => "MusicBrainz Album Artist ID")
      .with("musicbrainz_workid", () => "MusicBrainz Work ID")
      .with("musicbrainz_releasegroupid", () => "MusicBrainz Release Group ID")
      .with("musicbrainz_trmid", () => "MusicBrainz TRM ID")
      .with("musicbrainz_discid", () => "MusicBrainz Disc ID")
      .with("musicip_fingerprint", () => "MusicIP Fingerprint")
      .with("musicip_puid", () => "MusicIP PUID")
      .otherwise((key) =>
        key
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .replace(/\bid/g, "ID"),
      );
  }

  interface Props {
    data: IAudioMetadata | null | undefined;
  }

  let { data }: Props = $props();
</script>

<div class="p-4 space-y-2 truncate w-96 h-full">
  {#if !data}
    <div class="flex flex-col items-center justify-center h-full">
      <h2 class="text-xl opacity-50">No track selected</h2>
      <h2 class="text-lg opacity-50">Select a track to view details</h2>
    </div>
  {:else}
    {#each Object.entries(data.common).sort( (a, b) => a[0].localeCompare(b[0]), ) as [key, value]}
      {#if typeof value !== "object" && value !== null}
        <label class="block w-full">
          <span class="text-sm opacity-50 block"
            >{renameTagKey(key as keyof ICommonTagsResult)}</span
          >
          <input type="text" readonly class="w-full truncate" {value} />
        </label>
      {/if}
    {/each}
  {/if}
</div>
