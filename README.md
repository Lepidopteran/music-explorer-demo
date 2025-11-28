# Music Metadata Viewer

A _little_ experiment to see how to read folders recursively, like to how [`Immich`](https://immich.app/) allows you to upload folders of images, but for music.

## Usage

To run the demo, run the `dev` script to start the development server.

```bash
bun run dev
```

## Dependencies

The frontend uses [`Svelte`](https://svelte.dev/) for the UI and [`TailwindCSS`](https://tailwindcss.com/) for styling, and [`Vite`](https://vitejs.dev/) is used to build the app.

The demo uses the following dependencies:

- [`file-type`](https://github.com/sindresorhus/file-type) - Used for getting the file type in zipped files
- [`music-metadata`](https://github.com/Borewit/music-metadata) - Used for reading metadata
- [`zip.js`](https://github.com/gildas-lormeau/zip.js) - Used for unzipping files

## Layout

- `src/App.svelte` - The main app component (Contains the logic in for reading metadata, unzipping, and reading folders)
- `src/components/`
    - `Button.svelte` - A button component (I know, hard to believe)
    - `MusicCard.svelte` - The component used for displaying the album cover, title, and artist
    - `MusicDetails.svelte` - The component used for displaying all the tags for the album/track
    
## License

[MIT](https://choosealicense.com/licenses/mit/)
