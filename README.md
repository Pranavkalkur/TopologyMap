# TopologyMap 🛜

**Live HTTP Dependency Graph & Corporate Tracker Footprint Visualizer**

TopologyMap is a purely client-side Chrome extension that intercepts browser network traffic and visualizes it in real-time. Built with strict privacy, high performance, and an uncompromising monochrome biophilic/glassmorphic design system. 

It exposes not just *where* your requests are going, but *who* actually owns them and maps them instantly to a deterministic global tracking map or a beautiful, organized orbital physics simulation.

<p align="center">
  <img src="./extension/icons/icon-128.png" alt="TopologyMap Icon" />
</p>

## ✨ Core Features

- **Real-Time Network Interception**: Hooks natively into the Manifest V3 `chrome.webRequest` API via a persistent, self-healing port connection. It dynamically captures latency, statuses, and intercepts third-party trackers completely locally. No analytical data ever leaves your browser.
- **D3 Orbital Physics Engine**: Replaces basic visualizers with an orchestrated `d3-force` solar system layout. Safe, first-party requests orbit closely on inner tracks (200px), while third-party corporate trackers are physically pushed to the outer rim (350px). `d3.forceCollide` ensures flawless visibility preventing node overlap, while D3 `curveCatmullRom` links bend with natural liquid splines.
- **Corporate Identity Mapping**: Intercepted endpoints are passed through a local data-enrichment map, exposing the backend footprint of major megacorporations (Alphabet, Meta, Amazon, Adobe). A frosted glass, minimalist floating side-panel displays real-time aggregated metrics and market-share percentages per payload.
- **Geospatial Projection Map**: A fully integrated globe view hooks requests, hashes them securely into coordinates attached to 7 globally distributed data-centers, and draws customized interactive quadratic bezier paths looping across the world. Tracks decay elegantly with `forwards` CSS animations.
- **Biophilic & Glassmorphic UI**: High-contrast, tightly woven monochrome palette structurally avoiding neo-brutalist grid layouts. Features organic micro-animations, deep drop shadows, overlapping frosted glass elements (`backdrop-filter`), breathing idle states, and smooth radial layouts.

## 🚀 Installation & Usage

To develop or use TopologyMap on your machine, you must run it as an unpacked Chrome Extension:

1. Clone this repository:
   ```bash
   git clone https://github.com/Pranavkalkur/TopologyMap.git
   cd TopologyMap/extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open Chrome and navigate to `chrome://extensions`
5. Enable **Developer Mode** in the top right.
6. Click **Load unpacked** and select the `/TopologyMap/extension/dist` folder.
7. Pin the extension to your toolbar. Open a busy webpage (like CNN or YouTube), engage the extension to open the Side Panel, and then hit **F5 / Refresh** on the webpage to watch the network graph elements orbit into position and track requests!

## 📚 Documentation

For an in-depth breakdown of the project architecture and the design system limitations, check out the original specification documentation:
- [Product Requirements Document (PRD)](./ProjectDescription/prd.md)
- [Architecture Specifications](./ProjectDescription/architecture.md)
- [Design System Details](./ProjectDescription/design.md)

## 🛠 Tech Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite + `@crxjs/vite-plugin`
- **Simulation/Visualizations**: React Flow & D3.js (`d3-force`, `d3-geo`, `d3-shape`)
- **Map Geometries**: TopoJSON (Natural Earth Project)
- **Environment**: Chrome Extensions API (Manifest V3)
