Project Brief & Technical Architecture: TopologyMap (Live HTTP Dependency Graph)

1. Executive Summary and Strategic Vision

In the contemporary "silent web," a single top-level page load frequently triggers hundreds of discrete background network transactions. This opaque orchestration of third-party APIs, telemetry trackers, and CDNs creates a significant blind spot for developers and security engineers. TopologyMap is a foundational security requirement designed to illuminate these dependencies in real-time. By transitioning from traditional tabular waterfall logs to an immersive, biophilic visualization, the system enables engineers to identify complex "fourth-party" data exfiltration paths—where trackers load subsequent trackers—that are nearly impossible to audit using standard tools.

The strategic differentiator lies in the application of organic spatial configurations to reduce the cognitive load of security auditing. Beyond mere debugging, TopologyMap provides a real-time defense against Magecart-style skimming attacks and unauthorized JavaScript trackers. By surfacing the hierarchical relationship of every network request, we empower architects to maintain structural integrity and verify that sensitive payloads are not being leaked to unvetted external domains.

Category	Definition & Technical Specifications
Core Objectives	Real-time interception of HTTP traffic; automated behavioral clustering; visual identification of exfiltration risks.
Target Audience	Lead Application Architects, Web Security Engineers, and Privacy-Focused Performance Leads.
Technical Constraints	Manifest V3 (MV3) compliance; handling high-frequency streams (10k+ events/sec); unblocking interception despite declarative limitations.
Strategic Impact	Reduction of decision fatigue through biophilic mapping; real-time threat detection for unauthorized JS payloads.

This vision necessitates a sophisticated architectural framework capable of bypassing the inherent monitoring restrictions of modern Chromium-based platforms.


--------------------------------------------------------------------------------


2. Modern Extension Architecture: Navigating Manifest V3

The shift from Manifest V2 to Manifest V3 mandates a transition from persistent background pages to ephemeral, event-driven Service Workers. This creates a state-persistence challenge: Service Workers are terminated by the browser after periods of inactivity. To ensure the live visualization state is not purged mid-session, TopologyMap implements a mandatory keep-alive heartbeat using the chrome.alarms API. This "heartbeat" prevents worker dormancy, ensuring a continuous data stream for the visualization engine.

Our interception strategy is multi-layered to overcome MV3’s restricted payload visibility. While the declarativeNetRequest API is now favored for blocking, TopologyMap utilizes the observational webRequest API to capture structural metadata (methods, URLs, resource types, and timing metrics). However, because webRequest.requestBody often returns a non-descript "Unknown error" in MV3 when accessing POST payloads, we implement a "Main World" script injection.

Data Flow Framework:

* Host Page (Main World): A script is injected via chrome.scripting.executeScript to monkey-patch window.fetch and XMLHttpRequest. This proxy captures JSON/Form-Data payloads that the browser-level API hides.
* Isolated World: The extension's content script receives these payloads via window.postMessage and relays them to the background.
* Background Service Worker: Synthesizes metadata from webRequest with the "Main World" payloads.
* Visualization UI: Data is streamed to the React frontend via a long-lived chrome.runtime.Port. Unlike standard sendMessage, a Port provides the persistent connection required for high-frequency, low-latency data streaming at scale.


--------------------------------------------------------------------------------


3. The Visualization Engine: Force-Directed Biophilia

To transform raw network logs into a navigable ecosystem, TopologyMap utilizes D3.js and React Flow. We move away from rectilinear, "trap-like" grid structures to a many-body force simulation that mimics natural growth patterns. The mathematical model relies on an iterative physical simulation where every domain is a node influenced by repulsion and attraction forces.

The core Many-Body Force equation ensures optimal spatial distribution: F = G \frac{m_1 m_2}{r^2} Here, G is the charge strength (tuned to a negative value to maximize whitespace), m represents the node weight, and r is the distance. We specifically use d3.curveCatmullRom for link rendering. Unlike standard linear connections, these centripetal splines avoid self-intersection and overshoot, reducing the cognitive friction of visual eye-tracking across hundreds of nodes.

Simulation Parameter	Function in TopologyMap	Desired Visual Outcome
Charge Strength	Many-Body Repulsion	Maximized whitespace and structural breathing room.
Link Distance	Geometric Constraints	Tight clustering of subdomains near root nodes.
Velocity Decay	Kinetic Friction	Fluid animations mimicking natural motion like water ripples.
Collision Radius	Centering & Repulsion	Absolute legibility by preventing node/label overlap.


--------------------------------------------------------------------------------


4. Advanced Clustering & Semantic Intelligence

Standard domain matching is insufficient for security audits. TopologyMap employs Graph Contrastive Learning (GCL) to learn deep feature representations of node behavior. This is critical for bypassing CNAME uncloaking—a tactic where trackers use subdomains to masquerade as first-party resources. GCL identifies these entities by their behavioral signatures regardless of their DNS masking.

For structural organization, the engine analyzes the Laplacian matrix (L = D - A) of the network graph. By evaluating the eigenvectors of the Laplacian, we can identify "communities" within sparse network data—revealing clusters of trackers or high-latency CDN hubs that standard proximity clustering would miss. The Domain Resolution Logic utilizes the tldts library and the Public Suffix List (PSL) to accurately group subdomains under their registered root nodes.

Semantic Categorization Visual Flags:

* First-Party: Central, stable nodes representing the primary host domain.
* CDNs: Peripheral hubs identified via Disconnect lists, serving as static asset anchors.
* Third-Party Telemetry: Rendered with distinct visual "tremors" to alert the user of active tracking behavior.
* Unsecured HTTP: Represented as "jagged" or "broken" links, providing an immediate visual cue for protocol vulnerabilities and potential downgrade attacks.


--------------------------------------------------------------------------------


5. UI/UX Specification: Premium High-Contrast Design

The interface is driven by the biophilic principles of Prospect and Refuge. The user is provided a wide "prospect" of the entire network landscape while the UI panel acts as a "refuge" of minimalist order. We strictly enforce a high-contrast black-and-white palette; neon colors and neobrutalist borders are prohibited to prevent sensory overload and maintain professional gravitas.

Interactive Security Features:

* Path Highlighting: Selecting a node illuminates all related dependencies, exposing the chain from the root page to the fourth-party tracker.
* Interactive Payload Inspection: Users can click any edge to inspect the raw data intercepted by the Main World proxy. This allows for real-time verification of whether PII (Personally Identifiable Information) is being exfiltrated in POST bodies.

This design approach is optimized for the Reduction of Decision Fatigue, a core KPI for the tool. By eliminating visual clutter, the architect can focus entirely on identifying structural anomalies and security breaches.


--------------------------------------------------------------------------------


6. Performance Engineering & Technical Constraints

Streaming 10k+ network events per second into a React frontend requires specialized performance practices. TopologyMap implements a Batching and Throttling strategy where network events are gathered into a 50ms buffer. The D3 simulation and React state are updated only once per buffer window, matching the human eye's perception while preventing "layout thrash."

Privacy is maintained through a "Client-Side Only" architecture using Zustand. By ensuring all data remains within the browser's memory, we eliminate the secondary risk of telemetry exfiltration to an external database—essentially closing the very "Magecart" loop the tool is designed to monitor.

Performance Scaling Practices:

* Hybrid Rendering: The system utilizes SVG for interaction but automatically transitions to a 2D Canvas context when the graph exceeds a 500-node threshold to maintain 60 FPS.
* Historical Downsampling: Older network interactions are automatically downsampled to preserve memory for live monitoring.
* Granular Reactivity: Zustand selectors ensure only the specific node components receiving data are re-rendered, bypassing React’s default reconciliation overhead.

TopologyMap is a deployment-ready architectural brief for a high-value tool, combining deep Chromium interception with a sophisticated, biophilic user experience for the modern security architect.
