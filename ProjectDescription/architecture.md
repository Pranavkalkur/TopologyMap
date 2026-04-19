System Architecture Document: TopologyMap Live Dependency Engine

1. Executive Architectural Foundation

The TopologyMap architecture establishes a high-fidelity observability framework designed for the "silent web," where modern applications orchestrate hundreds of discrete network transactions across third-party APIs and CDNs. In the transition to Chrome Manifest V3 (MV3), achieving real-time dependency mapping requires a shift from persistent background environments to event-driven, ephemeral execution contexts. This system implements a robust in-memory engine to maintain state integrity across fragmented browser sessions.

1.1 Platform Constraints & Service Worker Lifecycle

The move to Manifest V3 mandates the use of Service Workers (SW) rather than persistent background pages. Because SW execution is event-driven and subject to browser-initiated dormancy, the architecture implements a "keep-alive" heartbeat via the chrome.alarms API to prevent the loss of observational state during long-running sessions. The system utilizes the chrome.webRequest API for non-blocking observation, capturing high-velocity telemetry without interfering with the browser’s network stack or declarative rulesets.

1.2 Modular Separation of Concerns

To ensure consistent 60 FPS performance, the system decouples the Interception Layer (Background Service Worker) from the Visualization Layer (React-based Side Panel). This separation isolates high-frequency packet metadata processing from the UI thread, preventing DOM jank during network bursts. Data is streamed sequentially from the Service Worker to the UI via a long-lived chrome.runtime.Port, ensuring sequential data integrity and isolation.

1.3 Biophilic Design & Neurobiological Rationale

The UI follows a biophilic minimalist specification, utilizing organic spatial configurations to reduce the cognitive friction inherent in network auditing.

* Monochromatic Palette: High-contrast black and white to emphasize structural relationships over decorative noise.
* Organic Node Connections: Mandatory use of Cubic Bézier curves via d3.link() or d3.curveCatmullRom.
* Neurobiological Rationale: Organic curves are architecturally justified to mitigate "trap responses" in the primary visual cortex—a phenomenon where sharp angles trigger a survival-based focus shift, increasing visual fatigue.
* The "Refuge" Pattern: Immense whitespace surrounding clusters to provide a sense of visual safety and clarity (Prospect and Refuge principle).
* Prohibitions: Strictly forbids neobrutalist sharp angles and neon-centric "cyberpunk" aesthetics.


--------------------------------------------------------------------------------


2. Component Orchestration & Data Lifecycle

The data pipeline manages the transition from raw packet interception to visual node representation. Low-latency sequential processing is a strategic requirement to ensure the graph grows dynamically as the host page loads.

2.1 Layer 1: Interception & Metadata Capture

The observational engine monitors the HTTP lifecycle across discrete phases. Metadata capture is expanded to include origin-specific metrics and protocol versions.

Request Phase	API Event Listener	Metadata Points
Initialization	onBeforeRequest	Method, URL, Initiator, Request Type, Timestamp
Transmission	onBeforeSendHeaders	Headers, Cookies, User-Agent, Origin
Response	onHeadersReceived	Status Code, Response Headers, IP Address, Protocol
Completion	onCompleted	Total Latency, TTFB, Payload Size, Timing Metrics

2.2 Layer 2: Payload Access via Main World Injection

As the webRequest API in MV3 cannot access requestBody or responseBody directly, the architecture prescribes a Main World injection strategy. Using chrome.scripting.executeScript (world: "MAIN"), the engine monkey-patches window.fetch and XMLHttpRequest. This bypasses the standard extension sandbox for Deep Packet Inspection (DPI), allowing the system to extract JSON payloads and sensitive exfiltration data before it leaves the client context.

2.3 Layer 3: Message Passing & State Sanitization

Sanitized data flows from the Main World to the Extension World via window.postMessage, then to the Service Worker. Local sanitization is performed during this transit; sensitive HTTP headers (e.g., Authorization, Set-Cookie) are filtered or hashed locally to ensure security compliance before reaching the visualization state.

2.4 Layer 4: D3.js Force-Directed Rendering

The visualization utilizes a physical simulation to model the network.

* Many-body Repulsion: Calculated via the Barnes-Hut approximation to push nodes apart.
* Link Attraction: Geometric constraints that tether subdomains to root domains.
* Alpha Cooling: This parameter dampens the simulation "temperature." Strategic tuning ensures the graph reacts instantly to new requests while preventing perpetual "jitter," allowing the simulation to settle into a stable state that preserves the biophilic "Refuge" pattern.


--------------------------------------------------------------------------------


3. Zero-Trust Security & Privacy Framework

The "Client-Side Only" model is critical for enterprise deployment, reducing the attack surface by eliminating external telemetry dependencies.

3.1 Zero-Backend Persistence Model

The engine operates with zero external database calls. Intercepted data is processed exclusively in-memory and discarded upon session termination. This architecture prevents the extension from becoming a vector for credential theft or data leaks, as no telemetry is exfiltrated to developer-controlled servers.

3.2 CNAME Uncloaking & TLD Resolution

TopologyMap identifies hidden third-party trackers disguised as first-party subdomains (CNAME uncloaking). This is achieved by utilizing the Public Suffix List (PSL) and the tldts library to resolve base domains within 1μs. This enables the engine to distinguish between legitimate first-party sub-resources and cloaked trackers.

3.3 Enterprise Compliance Alignment

1. Fourth-Party Identification: Mapping "trackers that load other trackers," revealing hidden transitive dependencies.
2. Protocol Downgrade Detection: Visual flagging of insecure http:// calls and mixed content.
3. Sanitized Local Inspection: Deep inspection of POST bodies performed entirely within the local execution context.


--------------------------------------------------------------------------------


4. Performance Engineering & Risk Mitigation

The primary architectural risk is system degradation during high-frequency network bursts (500+ concurrent requests).

4.1 High-Frequency Message Throttling

To prevent UI saturation, the Service Worker implements a 50ms buffering window. Incoming events are batched and dispatched to the React UI using fixed-interval batching, synchronized with the browser’s refresh rate via requestAnimationFrame to maintain fluid motion.

4.2 Node Clustering via Graph Contrastive Learning

For complex network auditing, the engine moves beyond simple K-means to Graph Contrastive Learning. This methodology optimizes the distance relationship between node pairs in the embedding space:

* Similarity Maximization: High similarity is enforced for positive sample pairs (augmented views of the same domain cluster).
* Difference Minimization: Contrastive loss is used to minimize similarity for negative sample pairs (distinct third-party entities). This ensures that 100+ identical domain requests are clustered into a single weighted node with deep feature representation, reducing DOM overhead and visual noise.

4.3 Memory Management & Downsampling

To prevent memory exhaustion during long-running sessions:

* Sliding Window: Historical data older than a specified duration is subjected to downsampling or archival.
* Mandatory Purging: The chrome.tabs.onRemoved listener triggers immediate state clearance for the associated tab's network tree.

4.4 Hybrid Rendering Strategy

The system utilizes SVG for standard traffic for styling flexibility. However, when the node count exceeds a threshold of 500, the engine triggers a transition to Canvas rendering. This hybrid approach ensures the visualization maintains 60 FPS even when mapping massive, enterprise-scale dependency trees.
