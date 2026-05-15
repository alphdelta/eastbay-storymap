// ============================================================
// East Bay Transit Equity Story Map
// ============================================================

// Dynamic polygon colors: assigned in order when polygons are toggled on
const POLYGON_SLOT_COLORS = ['#e41a1c', '#4daf4a', '#377eb8', '#984ea3']; // red, green, blue, purple
let activePolygonSlots = [null, null, null, null]; // which route is in each slot

// Legacy lookup - now computed dynamically
const ROUTE_COLORS = {};
function getRouteColor(route) {
  const slotIdx = activePolygonSlots.indexOf(route);
  if (slotIdx >= 0) return POLYGON_SLOT_COLORS[slotIdx];
  // Fallback: gold for analysis routes, neutral gray for others
  if (MAIN_ROUTES.has(route)) return '#DAA520';
  const rd = allRouteData.find(r => r.route === route);
  return rd ? rd.color : '#888';
}

const ROUTE_HIGHWAYS = {
  'L':  'I-80',
  '57': 'I-580',
  '1T': 'BART Fruitvale Branch',
  'F':  'BART Richmond Branch',
  '9':  'E. 14th St Corridor',
  '28': 'Castro Valley Corridor',
  '34': 'Estudillo-Davis Corridor',
  'E':  'Claremont Corridor',
  'V':  'Montclair-Park Blvd Corridor'
};

const MAIN_ROUTES = new Set(['L', '57', '1T', 'F', '9', '28', '34', 'E', 'V']);

const CONTROL_CORRIDORS = {
  'Ohlone Greenway': 'BART Richmond Branch',
  'Jack London Square, Oakland': 'Union Pacific Niles Division'
};

function getCorridorName(route, stopName) {
  if (route === 'CONTROL') return CONTROL_CORRIDORS[stopName] || '';
  if (route === 'F' && stopName) {
    if (stopName.startsWith('40th St') || stopName.startsWith('Shellmound') || stopName.startsWith('Market St') || stopName.startsWith('Christie') || stopName.startsWith('Stanford')) return 'I-580';
    return 'BART Richmond Branch';
  }
  return ROUTE_HIGHWAYS[route] || route;
}

const CONTROL_SITES = [
  {
    name: "Ashby x Sacramento",
    lat: 37.864360330851504,
    lon: -122.2790346887757,
    description: "A control site at the intersection of Ashby Avenue and Sacramento Street in Berkeley. This area features a well-connected grid street network without major infrastructure barriers, providing a baseline for comparison against transit-adjacent stops."
  },
  {
    name: "Ohlone Greenway",
    lat: 37.88314546283414,
    lon: -122.29071715774252,
    description: "The Ohlone Greenway follows the path of the old Santa Fe railroad right-of-way through Albany and El Cerrito. While the greenway itself is a pedestrian/bike path, the surrounding area demonstrates how legacy rail corridors shape modern walkability."
  },
  {
    name: "Oakland Jack London Square",
    lat: 37.795145,
    lon: -122.276890,
    description: "Jack London Square sits at the edge of Oakland's waterfront, bounded by rail lines, I-880, and the estuary. This site exemplifies how multiple infrastructure barriers converge to constrain pedestrian access."
  }
];

const SITE_STORIES = {
  'Channing x California, Berkeley': {
    summary: 'This control site sits in Berkeley\'s well-connected street grid, where the walk polygon stays close to circular. But the neighborhood\'s high walkability exists alongside ongoing struggles over traffic safety, displacement, and who the streets are really built for.',
    arc: [
      {
        title: 'Opening',
        text: 'Near Channing, the walk polygon stays close to isotropic: streets connect, crossings are frequent, and very little of the half-mile circle is amputated. It is useful as a control precisely because it shows what the metric looks like when the grid is mostly intact.'
      },
      {
        title: 'Countermap',
        text: 'But walkability on paper does not mean safety in practice. Adeline Street, just blocks away, is a Vision Zero High Injury Street. Residents have fought for lane reductions, safer crossings, and a greenway — demanding that the corridor serve people walking, not just cars passing through.'
      },
      {
        title: 'What the metric misses',
        text: 'A strong reach ratio is not the same as a livable street. The grid connects, but residents still organize to reclaim space from speeding traffic and displacement. Countermapping means measuring permeability and asking: permeability for whom?'
      }
    ],
    gallery: [
      {
        src: 'assets/story/channing-south-berkeley-mural.jpg',
        alt: 'The Invisible Becomes Visible mural along Ashby Avenue in South Berkeley.',
        title: 'Timeline wall',
        emotion: 'Pride + remembrance',
        caption: 'The 100-foot mural layers Ohlone history, migration, labor, and neighborhood figures into one street-facing civic timeline.',
        credit: 'Photo via Berkeleyside / Daniel McPartlan'
      },
      {
        src: 'assets/story/channing-waving-man.jpg',
        alt: 'Detail of Joseph Charles, the Waving Man, in the South Berkeley mural.',
        title: 'Neighborhood figure',
        emotion: 'Recognition',
        caption: 'Joseph Charles, the Waving Man, turns the wall from abstract history into local recognition: this is a neighborhood naming its own people.',
        credit: 'Photo via Berkeleyside / Daniel McPartlan'
      },
      {
        src: 'assets/story/channing-detail.jpg',
        alt: 'Painted detail from The Invisible Becomes Visible mural in South Berkeley.',
        title: 'Shared history detail',
        emotion: 'Care + witness',
        caption: 'Close details reveal how the mural works at pedestrian scale, rewarding slow looking instead of just drive-by visibility.',
        credit: 'Photo via Berkeleyside / Daniel McPartlan'
      }
    ],
    testimonies: [
      {
        quote: 'We envision a mixed-income transit village with a thriving Flea Market, a greenway with parks and bike lanes, housing for all — and slow streets made safe for our elders, children, drivers, transit users, pedestrians and bicyclists.',
        attribution: 'South Berkeley Now! (173 members)',
        sourceLabel: 'Berkeleyside, 2019',
        sourceUrl: 'https://www.berkeleyside.org/2019/09/06/opinion-south-berkeley-needs-safer-streets-and-more-neighbors'
      },
      {
        quote: 'South Berkeley needs safer streets and more neighbors. As currently written, the Adeline Plan will result in more of the same — speeding traffic, a lack of affordable housing, and displacement of our neighbors.',
        attribution: 'South Berkeley Now!',
        sourceLabel: 'Berkeleyside, 2019',
        sourceUrl: 'https://www.berkeleyside.org/2019/09/06/opinion-south-berkeley-needs-safer-streets-and-more-neighbors'
      },
      {
        quote: 'The City Council talks about climate urgency, they talk about banning combustion engines. But there\'s no car-free options for Telegraph? Really?',
        attribution: 'Brandon James Yung, Telegraph for People',
        sourceLabel: 'Streetsblog SF, 2022',
        sourceUrl: 'https://sf.streetsblog.org/2022/01/31/berkeley-students-craft-car-free-option-for-telegraph'
      }
    ],
    sources: [
      {
        label: 'Berkeleyside — "South Berkeley needs safer streets and more neighbors"',
        url: 'https://www.berkeleyside.org/2019/09/06/opinion-south-berkeley-needs-safer-streets-and-more-neighbors'
      },
      {
        label: 'Streetsblog SF — "Berkeley Students Craft Car-Free Option for Telegraph"',
        url: 'https://sf.streetsblog.org/2022/01/31/berkeley-students-craft-car-free-option-for-telegraph'
      },
      {
        label: 'City of Berkeley — Adeline Corridor Specific Plan',
        url: 'https://berkeleyca.gov/your-government/our-work/adopted-plans/adeline-corridor-specific-plan'
      }
    ]
  },
  'Ohlone Greenway': {
    summary: 'The Ohlone Greenway is the countermapping hinge of the project: a transportation corridor that has been reclaimed as park, shortcut, mural wall, exercise space, and neighborhood commons. Your photos make that argument better than a single metric can.',
    arc: [
      {
        title: 'Opening',
        text: 'Under the BART Richmond Branch, the greenway starts from the same corridor logic as the rest of the project: a linear infrastructure spine built for movement. But on the ground it feels different from the highway-adjacent sites.'
      },
      {
        title: 'Countermap',
        text: 'Instead of dead infrastructure, the greenway has become a daily commute route, exercise path, and neighborhood commons. 81% of surveyed users walk, run, or bike it. Over half live within a quarter mile. It is not recreational scenery — it is how people actually move through their day.'
      },
      {
        title: 'What the metric misses',
        text: 'The reach ratio captures geometric permeability, but the Greenway shows that livability also depends on lighting, safety at intersections, and whether the path feels welcoming at night. The City\'s 2023 survey of 609 residents documented exactly these gaps — the things a polygon cannot hold.'
      }
    ],
    gallery: [
      {
        src: 'assets/story/ohlone-history-wide.jpg',
        alt: 'Wide view of a history mural along the Ohlone Greenway.',
        title: 'History mural',
        emotion: 'Collective memory',
        caption: 'The panoramic wall reads like a public timeline of land, labor, transit, and migration beside the trail.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-history-detail.jpg',
        alt: 'Detail view of figures gathered in the Ohlone Greenway history mural.',
        title: 'History detail',
        emotion: 'Solidarity',
        caption: 'The close-up centers people over infrastructure, making the corridor feel inhabited rather than merely engineered.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-bike-wide.jpg',
        alt: 'Wide view of bicycle and transit mural on the Ohlone Greenway.',
        title: 'Bike + transit mural',
        emotion: 'Motion + possibility',
        caption: 'Transit, bicycling, and neighborhood life share the same wall, matching the greenway’s role as both path and commons.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-bike-detail.jpg',
        alt: 'Detail of cyclist and pedestrian from bicycle mural on the Ohlone Greenway.',
        title: 'Shared route detail',
        emotion: 'Care + continuity',
        caption: 'The cyclist and older pedestrian occupy the same painted route, suggesting mobility across pace, age, and purpose.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-flowers.jpg',
        alt: 'Floral mural and poppies along the Ohlone Greenway.',
        title: 'Floral wall',
        emotion: 'Delight',
        caption: 'Painted flowers echo planted poppies in front of them, making the corridor feel tended rather than leftover.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-face-mural.jpg',
        alt: 'Figure mural beside the Ohlone Greenway path.',
        title: 'Figure mural',
        emotion: 'Reflection',
        caption: 'A quieter portrait interrupts the faster rhythm of cycling and commuting with a more interior mood.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-ride-mural.jpg',
        alt: 'Riding past a mural on the Ohlone Greenway.',
        title: 'Rider’s-eye view',
        emotion: 'Flow',
        caption: 'This rider’s-eye photo makes the argument spatially: the art is encountered in motion, not set apart from daily travel.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-plaza.jpg',
        alt: 'Exercise and plaza space along the Ohlone Greenway.',
        title: 'Exercise plaza',
        emotion: 'Usefulness',
        caption: 'The greenway is not only scenic; it has been equipped for exercise, rest, and repeat use by neighbors.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-fire-circle.jpg',
        alt: 'Circular seating area along the Ohlone Greenway.',
        title: 'Circle of rest',
        emotion: 'Pause',
        caption: 'A circular seating area introduces gathering and lingering into a corridor otherwise defined by linear movement.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-albany-sign.jpg',
        alt: 'Blue ALBANY letter sculpture on the Ohlone Greenway.',
        title: 'ALBANY sculpture',
        emotion: 'Belonging',
        caption: 'The oversized letters work as landmark, selfie spot, and civic marker for people arriving by trail.',
        credit: 'User field photo'
      },
      {
        src: 'assets/story/ohlone-fernanda-martinez.jpg',
        alt: 'Fernanda Martinez community mural at the Ohlone Greenway in El Cerrito.',
        title: 'Fernanda Martinez mural',
        emotion: 'Warmth',
        caption: 'A recent community mural in partnership with The Little Hill shows the greenway still attracting new visual identity work.',
        credit: 'Fernanda Martinez'
      }
    ],
    testimonies: [
      {
        quote: 'Biking along the greenway from Berkeley to Albany proved to be faster than driving the same distance. Economic efficiency, better health, and personal happiness all rolled into one.',
        attribution: 'Graham Freeman, Looking Beyond Tomorrow',
        sourceLabel: 'Looking Beyond Tomorrow, 2015',
        sourceUrl: 'https://gjmf.wordpress.com/2015/12/12/ohlone-greenway/'
      },
      {
        quote: '81% of Greenway users walk, run, or bike. 57% use it for shopping and errands — not just recreation. Over half live within a quarter mile.',
        attribution: 'City of Berkeley Ohlone Greenway Survey (609 respondents)',
        sourceLabel: 'City of Berkeley, 2023',
        sourceUrl: 'https://berkeleyca.gov/sites/default/files/documents/Ohlone%20Greenway%20Online%20Survey%20Results.pdf'
      },
      {
        quote: 'The goals are to upgrade the multi-use pathway to better accommodate the needs of all users and improve safety, especially at roadway intersections and at night.',
        attribution: 'City of Berkeley, Ohlone Greenway Safety Improvements Project',
        sourceLabel: 'City of Berkeley, 2023',
        sourceUrl: 'https://berkeleyca.gov/your-government/our-work/capital-projects/ohlone-greenway-safety-improvements-project'
      }
    ],
    sources: [
      {
        label: 'User field photos — Ohlone Greenway, April 2026',
        url: ''
      },
      {
        label: 'City of Berkeley — Ohlone Greenway Safety Improvements Project',
        url: 'https://berkeleyca.gov/your-government/our-work/capital-projects/ohlone-greenway-safety-improvements-project'
      },
      {
        label: 'City of Berkeley — Ohlone Greenway Survey Results (609 respondents)',
        url: 'https://berkeleyca.gov/sites/default/files/documents/Ohlone%20Greenway%20Online%20Survey%20Results.pdf'
      },
      {
        label: 'Looking Beyond Tomorrow — Ohlone Greenway',
        url: 'https://gjmf.wordpress.com/2015/12/12/ohlone-greenway/'
      }
    ]
  },
  'Jack London Square, Oakland': {
    summary: 'Jack London is the counterexample at the other end of the spectrum: the polygon is visibly shattered by rail, freeway, and water. I-880 severs downtown Oakland from the waterfront, compressing pedestrian access into a handful of hostile underpasses.',
    arc: [
      {
        title: 'Opening',
        text: 'Here the half-mile circle fails most dramatically. Rail lines, the estuary, and I-880 compress movement into a narrow set of approaches, so the polygon exposes the corridor as a hard physical barrier.'
      },
      {
        title: 'Countermap',
        text: 'Stand in downtown Oakland and look around and it can be easy to forget it\'s a coastal city. That\'s because Interstate 880 cuts a giant, uninviting swath between the city center and the waterfront. The Walk This Way project aims to transform the underpasses into safe, walkable passageways — but the barrier remains.'
      },
      {
        title: 'What the metric misses',
        text: 'Jack London shows the project\'s full tension: more than half the ground-floor commercial space sits vacant, foot traffic has declined, and businesses have closed. A shattered polygon is not just a geometric abstraction — it means fewer people walking, fewer encounters, less public life.'
      }
    ],
    gallery: [
      {
        src: 'assets/story/jack-london-turfin.jpg',
        alt: 'Turfin mural in the Jack London district of Oakland.',
        title: 'Turfin arrival wall',
        emotion: 'Defiance',
        caption: 'Facing the train approach, this mural makes Oakland culture one of the first images riders encounter as they enter the district.',
        credit: 'Visit Oakland'
      },
      {
        src: 'assets/story/jack-london-earth-sanctuary.jpg',
        alt: 'Earth Sanctuary mural featured in Jack London mural tour.',
        title: 'Earth Sanctuary',
        emotion: 'Wonder',
        caption: 'The waterfront mural tour frames Jack London as an outdoor gallery where port infrastructure and public art occupy the same visual field.',
        credit: 'Visit Oakland'
      },
      {
        src: 'assets/story/jack-london-earth-sanctuary-2.jpg',
        alt: 'Alternate view of the Earth Sanctuary mural in Jack London Square.',
        title: 'Waterfront mural detail',
        emotion: 'Breath',
        caption: 'Oceanic imagery softens the industrial edge without pretending the edge is gone.',
        credit: 'Visit Oakland'
      },
      {
        src: 'assets/story/jack-london-muralists.jpg',
        alt: 'Artists and muralists featured at Jack London Square pop-up gallery.',
        title: 'Muralists at work',
        emotion: 'Energy',
        caption: 'The festival made the act of painting public, turning spectatorship into participation and conversation.',
        credit: 'Port of Oakland'
      }
    ],
    testimonies: [
      {
        quote: 'Stand in downtown Oakland and look around and it can be easy to forget it\'s a coastal city. That\'s because Interstate 880 cuts a giant, uninviting swath between the city center and the waterfront at Jack London Square.',
        attribution: 'Roger Rudick, Streetsblog SF',
        sourceLabel: 'Streetsblog SF, 2017',
        sourceUrl: 'https://sf.streetsblog.org/2017/05/25/spur-talk-reconnecting-oakland-to-its-waterfront/'
      },
      {
        quote: 'People detest the freeway barrier. People will organize their whole lives in a way that they don\'t have to cross the freeway to get to other parts of Oakland.',
        attribution: 'Savlan Hauser, Jack London Improvement District',
        sourceLabel: 'Streetsblog SF / SPUR, 2017',
        sourceUrl: 'https://sf.streetsblog.org/2017/05/25/spur-talk-reconnecting-oakland-to-its-waterfront/'
      },
      {
        quote: 'People are just afraid to drive out here and leave their cars parked. The market has been in a bit of a struggle.',
        attribution: 'Raul Castro, Alameda resident; Kyle Wiggins, Farmers Market Association',
        sourceLabel: 'CBS San Francisco, 2025',
        sourceUrl: 'https://www.cbsnews.com/sanfrancisco/news/oakland-jack-london-square-traffic-decline-impacts/'
      },
      {
        quote: 'This will lift those restrictions for 40 years. It\'s a game-changer, and it\'s going to help fill some of these ground-floor vacancies and bring life back to Jack London Square.',
        attribution: 'Sen. Jesse Arregu\u00edn (D-Oakland)',
        sourceLabel: 'KTVU, 2025',
        sourceUrl: 'https://www.ktvu.com/news/oaklands-jack-london-square-poised-change-new-law-loosens-restrictions'
      }
    ],
    sources: [
      {
        label: 'Streetsblog SF \u2014 "Reconnecting Oakland to its Waterfront" (SPUR)',
        url: 'https://sf.streetsblog.org/2017/05/25/spur-talk-reconnecting-oakland-to-its-waterfront/'
      },
      {
        label: 'CBS San Francisco \u2014 "Foot traffic at Jack London Square declines"',
        url: 'https://www.cbsnews.com/sanfrancisco/news/oakland-jack-london-square-traffic-decline-impacts/'
      },
      {
        label: 'KTVU \u2014 "Jack London Square poised for change with new law"',
        url: 'https://www.ktvu.com/news/oaklands-jack-london-square-poised-change-new-law-loosens-restrictions'
      }
    ]
  }
};

const ROUTE_DESCRIPTIONS = {
  'L': "Line L runs along San Pablo Avenue, paralleling the I-80 corridor. The highway acts as a wall, severing neighborhoods and reducing walkable reach for communities on either side.",
  '57': "Line 57 traverses 40th Street and MacArthur Boulevard along the I-580 corridor. The elevated freeway creates a linear barrier that fragments the street grid below.",
  '1T': "Line 1T follows International Boulevard and East 14th Street near the BART Fruitvale branch. Rail infrastructure and industrial land uses create gaps in the pedestrian network.",
  'F': "Line F serves the Adeline Street corridor near the BART Richmond branch. Rail yards and elevated tracks interrupt the neighborhood grid, forcing detours for pedestrians."
};

function buildStoryStack(siteKey) {
  const story = SITE_STORIES[siteKey];
  if (!story) return '';
  const summaryHtml = story.summary ? `<p>${story.summary}</p>` : '';

  const arcHtml = (story.arc || []).map(item => `
    <div class="story-arc-step">
      <div class="story-arc-title">${item.title}</div>
      <p>${item.text}</p>
    </div>
  `).join('');

  const galleryHtml = (story.gallery || []).map(item => `
    <article class="story-art-card">
      <img src="${item.src}" alt="${item.alt}" loading="lazy">
      <div class="story-art-meta">
        <div class="story-art-title-row">
          <div class="story-art-title">${item.title}</div>
          <div class="story-emotion">${item.emotion}</div>
        </div>
        <p>${item.caption}</p>
        <div class="story-credit">${item.credit}</div>
      </div>
    </article>
  `).join('');

  const testimonyHtml = (story.testimonies || []).map(item => `
    <div class="story-quote-card">
      <blockquote>${item.quote}</blockquote>
      <p class="interview-attr">${item.attribution}</p>
    </div>
  `).join('');

  return `
    <section class="story-stack story-stack-rich">
      <div class="story-section-card">
        <div class="story-kicker">Place story</div>
        ${summaryHtml}
        <p class="story-note">Emotion labels are interpretive reads of the images, not sourced quotations.</p>
      </div>
      <div class="story-section-card">
        <div class="story-kicker">Story arc</div>
        <div class="story-arc">${arcHtml}</div>
      </div>
      <div class="story-section-card">
        <div class="story-kicker">Public art</div>
        <div class="story-gallery">${galleryHtml}</div>
      </div>
      <div class="story-section-card">
        <div class="story-kicker">Community voice</div>
        ${testimonyHtml}
      </div>
    </section>
  `;
}

function getStoryKeyForFeatures(features) {
  if (!features || features.length !== 1) return null;
  const feature = features[0];
  if (feature.properties.route !== 'CONTROL') return null;
  return feature.properties.stop;
}

const WALKTHROUGH_SITES = [
  {
    title: "Most Constrained Stop",
    findBy: 'lowest_re',
    narrative: "This bus stop has the lowest reach ratio of any stop analyzed. The half-mile walking polygon is shattered into a fraction of what a full circle would be, revealing how infrastructure creates invisible walls around communities that depend on transit.",
    quote: "You can see the freeway from the bus stop, but to get to the other side you have to walk almost a mile out of your way. It's like living on an island.",
    attribution: "Community member, East Bay transit rider"
  },
  {
    title: "Most Circular Stop",
    findBy: 'highest_re',
    narrative: "This stop has the highest reach ratio, meaning its walking polygon most closely resembles a full circle. The street grid here is well-connected with fewer infrastructure barriers, giving residents more direct access to surrounding destinations.",
    quote: "I can walk to the grocery store, the library, the park. Everything is within reach. Not everyone in this city has that.",
    attribution: "Resident, East Bay"
  },
  {
    title: "Where Two Lines Meet",
    findBy: 'most_grouped',
    narrative: "At this location, multiple transit lines converge near major infrastructure. Riders transferring between lines must navigate the same fragmented pedestrian network. Comparing reach ratios across routes at the same location reveals how barriers affect different corridors.",
    quote: "I transfer buses here every day. The walk between stops shouldn't feel dangerous, but crossing under the freeway always does.",
    attribution: "Daily commuter"
  }
];

const GROUP_RADIUS_DEG = 0.003;
const HALF_MILE_M = 804.672;

// East Bay bounding box
const EB_BBOX = { minLat: 37.45, minLon: -122.38 };

// ============================================================
// State
// ============================================================

let map;
let layers = {};
let halfMileCircle = null;
let highlightLayer = null;
let maskLayer = null;
let allFeatures = [];      // shattered circle features
let groupedSites = [];
let currentBasemap = 'light';
let userBasemapPref = 'light';
let zoomedCenter = null;
let lightBaseLayers = [];
let overlay2Markers = null;

// Route visibility state
let routeVisibility = {};    // route_name -> boolean (line visible)
let routeLayers = {};        // route_name -> L.layerGroup (line polylines)
let allRouteData = [];       // [{route, long_name, color, is_main}]

// Polygon visibility (separate from line visibility)
let polygonVisibility = {};  // route_name -> boolean
let polygonLayers = {};      // route_name -> L.layerGroup (shattered circles per route)
const MAX_POLYGON_ROUTES = 4;

// Bus stop marker layers (per route)
let stopMarkerLayers = {};   // route_name -> L.layerGroup

// Reach Ratio view state
let reachRatioMode = false;
let reachRatioLayer = null;
// Density view state
let densityMode = false;
let densityLayer = null;
let globalDensityMin = Infinity;
let globalDensityMax = 0;
// Walkthrough state
let walkthroughMode = false;
let walkthroughIdx = 0;
const WALKTHROUGH_TOTAL = 11;
let allBusStopsData = null;  // all AC Transit stops
let allBusRoutesRaw = null;
let shatteredCirclesRaw = null;
let routeTerminals = {};     // route_name -> {origin, terminus}
let demographicsData = {};   // "route:stop_name" -> {population, pop_density, white, black, asian, ...}
let neighborhoods = [];      // [{name, lat, lon, r}]

// Global R_e min/max for gradient scaling
let globalReMin = 1.0;
let globalReMax = 0.0;

// Countermapping overlay state (independent of Re/Density)
let noiseMode = false;
let noiseLayer = null;
let communityMode = false;
let communityLayer = null;
let artifactsMode = false;
let artifactsLayer = null;

// Per-route navigation
let currentRoute = null;     // null = overview, or route name string
let currentRouteIdx = 0;     // index within current route's stop list
let routeStopPanels = {};    // route -> [{features, coordinates, geometries, groupIdx}]

// ============================================================
// Initialize Map
// ============================================================

function initMap() {
  map = L.map('map', {
    center: [37.78, -122.20],
    zoom: 11,
    zoomSnap: 0.5,
    zoomControl: true,
    maxBounds: [[37.50, -122.45], [38.00, -121.90]],
    maxBoundsViscosity: 1.0
  });

  const lightBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd'
  });
  const lightLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    pane: 'overlayPane'
  });
  lightBase.addTo(map);
  lightLabels.addTo(map);
  lightBaseLayers = [lightBase, lightLabels];

  layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri World Imagery',
    maxZoom: 19
  });

  // Basemap toggle
  document.querySelectorAll('.basemap-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.basemap;
      if (mode === currentBasemap) return;
      userBasemapPref = mode;
      setBasemap(mode);
    });
  });

  // Click outside half-mile circle returns to Overlay 1
  map.on('click', function(e) {
    if (!zoomedCenter) return;
    const dist = map.distance(e.latlng, L.latLng(zoomedCenter[0], zoomedCenter[1]));
    if (dist > HALF_MILE_M) {
      goToOverview();
    }
  });
}

function setBasemap(mode) {
  currentBasemap = mode;
  document.querySelectorAll('.basemap-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.basemap === mode);
  });

  if (mode === 'satellite') {
    lightBaseLayers.forEach(l => { if (map.hasLayer(l)) map.removeLayer(l); });
    if (!map.hasLayer(layers.satellite)) layers.satellite.addTo(map);
    layers.satellite.bringToBack();
  } else {
    if (map.hasLayer(layers.satellite)) map.removeLayer(layers.satellite);
    lightBaseLayers.forEach(l => { if (!map.hasLayer(l)) l.addTo(map); });
    lightBaseLayers[0].bringToBack();
  }
}

// ============================================================
// Data Loading
// ============================================================

async function loadJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load ${url}`);
  return resp.json();
}

function isInEastBay(lat, lon) {
  return lat >= EB_BBOX.minLat && lon >= EB_BBOX.minLon;
}

function clipLineToEastBay(coords) {
  return coords.filter(c => isInEastBay(c[1], c[0]));
}

async function loadAllData() {
  const [highways, railways, waterways, allBusRoutes, allStops, terminals, hoods, demographics] = await Promise.all([
    loadJSON('data/highways.geojson'),
    loadJSON('data/railways.geojson'),
    loadJSON('data/waterways.geojson'),
    loadJSON('data/all_bus_routes.geojson'),
    loadJSON('data/all_bus_stops.geojson'),
    loadJSON('data/route_terminals.json').catch(() => ({})),
    loadJSON('data/neighborhoods.json').catch(() => []),
    loadJSON('data/demographics.json').catch(() => ({}))
  ]);
  routeTerminals = terminals;
  neighborhoods = hoods;
  demographicsData = demographics;

  allBusRoutesRaw = allBusRoutes;

  // Filter stops to East Bay
  allBusStopsData = {
    type: 'FeatureCollection',
    features: allStops.features.filter(f => {
      const [lon, lat] = f.geometry.coordinates;
      return isInEastBay(lat, lon);
    })
  };

  let shatteredCircles = null;
  try {
    shatteredCircles = await loadJSON('data/shattered_circles.geojson');
    shatteredCirclesRaw = shatteredCircles;
  } catch (e) {
    console.warn('Shattered circles data not yet available');
  }

  // Compute global R_e min/max
  if (shatteredCircles) {
    shatteredCircles.features.forEach(f => {
      const re = f.properties.re_ratio || 0;
      if (re > 0) {
        if (re < globalReMin) globalReMin = re;
        if (re > globalReMax) globalReMax = re;
      }
    });
  }

  // Build stop coordinate set for proximity-based line weight (main routes only)
  const mainStopCoords = {};
  allBusStopsData.features.forEach(f => {
    if (MAIN_ROUTES.has(f.properties.route)) {
      const route = f.properties.route;
      if (!mainStopCoords[route]) mainStopCoords[route] = [];
      mainStopCoords[route].push([f.geometry.coordinates[1], f.geometry.coordinates[0]]);
    }
  });

  // --- Infrastructure layers ---
  layers.waterways = L.geoJSON(waterways, {
    style: { color: '#a8d8ea', weight: 1.5, opacity: 0.6 },
    interactive: false
  }).addTo(map);

  const freeways = { type: 'FeatureCollection', features: highways.features.filter(f => {
    const hw = f.properties.highway;
    return hw === 'motorway' || hw === 'motorway_link';
  })};
  layers.highways = L.geoJSON(freeways, {
    style: function(feature) {
      const hw = feature.properties.highway;
      return {
        color: '#555',
        weight: hw === 'motorway_link' ? 2.5 : 3.5,
        opacity: 0.7,
        dashArray: hw === 'motorway_link' ? '4 4' : null
      };
    },
    interactive: false
  }).addTo(map);

  layers.railways = L.geoJSON(railways, {
    style: { color: '#333', weight: 2, opacity: 0.5, dashArray: '8 4' },
    interactive: false
  }).addTo(map);

  // --- ALL Bus Routes ---
  const NEAR_STOP_DIST = 0.004;
  const seenRoutes = new Set();
  allRouteData = [];

  allBusRoutes.features.forEach(feature => {
    const rname = feature.properties.route;
    if (seenRoutes.has(rname)) return;
    seenRoutes.add(rname);

    const isMain = feature.properties.is_main;
    const color = isMain ? getRouteColor(rname) : feature.properties.color;

    allRouteData.push({
      route: rname,
      long_name: feature.properties.long_name,
      color: color,
      is_main: isMain
    });

    let coords = feature.geometry.coordinates;
    const ebCoords = clipLineToEastBay(coords);
    if (ebCoords.length < 2) return;

    const routeGroup = L.layerGroup();

    if (isMain) {
      const routeStops = mainStopCoords[rname] || [];
      const segments = [];
      let currentSeg = { near: false, coords: [] };

      for (let i = 0; i < ebCoords.length; i++) {
        const [lng, lat] = ebCoords[i];
        let nearStop = false;
        for (const [sLat, sLng] of routeStops) {
          const d = Math.sqrt(Math.pow(lat - sLat, 2) + Math.pow(lng - sLng, 2));
          if (d < NEAR_STOP_DIST) { nearStop = true; break; }
        }

        if (currentSeg.coords.length === 0) {
          currentSeg.near = nearStop;
          currentSeg.coords.push(ebCoords[i]);
        } else if (nearStop === currentSeg.near) {
          currentSeg.coords.push(ebCoords[i]);
        } else {
          currentSeg.coords.push(ebCoords[i]);
          segments.push(currentSeg);
          currentSeg = { near: nearStop, coords: [ebCoords[i]] };
        }
      }
      if (currentSeg.coords.length > 1) segments.push(currentSeg);

      segments.forEach(seg => {
        L.polyline(
          seg.coords.map(c => [c[1], c[0]]),
          { color, weight: seg.near ? 5 : 2.5, opacity: seg.near ? 0.9 : 0.35, interactive: false }
        ).addTo(routeGroup);
      });

      if (coords.length > ebCoords.length) {
        const startOrig = coords[0];
        const endOrig = coords[coords.length - 1];
        if (!isInEastBay(startOrig[1], startOrig[0])) {
          addArrowMarker(ebCoords[0], ebCoords[1], color, rname, routeGroup, true);
        }
        if (!isInEastBay(endOrig[1], endOrig[0])) {
          const last = ebCoords[ebCoords.length - 1];
          const prev = ebCoords[ebCoords.length - 2];
          addArrowMarker(last, prev, color, rname, routeGroup, false);
        }
      }
    } else {
      L.polyline(
        ebCoords.map(c => [c[1], c[0]]),
        { color, weight: 2, opacity: 0.5, interactive: false }
      ).addTo(routeGroup);
    }

    routeLayers[rname] = routeGroup;
    routeVisibility[rname] = isMain;

    if (isMain) {
      routeGroup.addTo(map);
    }
  });

  // Sort allRouteData: main first, then alphabetically
  allRouteData.sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return a.route.localeCompare(b.route, undefined, { numeric: true });
  });

  // --- Bus Stop Markers (per route, all routes) ---
  const stopsByRoute = {};
  allBusStopsData.features.forEach(f => {
    const r = f.properties.route;
    if (!stopsByRoute[r]) stopsByRoute[r] = [];
    stopsByRoute[r].push(f);
  });

  for (const [route, stops] of Object.entries(stopsByRoute)) {
    const lg = L.layerGroup();
    const color = getRouteColor(route);
    stops.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;
      const marker = L.circleMarker([lat, lng], {
        radius: 3,
        fillColor: color,
        fillOpacity: 0.8,
        color: '#fff',
        weight: 1,
        interactive: true
      });
      marker.bindTooltip(`<b>${f.properties.stop_name}</b><br>Route ${route}`, { direction: 'top', offset: [0, -4] });
      marker.addTo(lg);
    });
    stopMarkerLayers[route] = lg;
    // Show markers for visible routes
    if (routeVisibility[route]) lg.addTo(map);
  }

  // --- Shattered Circles (per route) ---
  if (shatteredCircles && shatteredCircles.features.length > 0) {
    shatteredCircles.features = shatteredCircles.features.filter(f => {
      const c = getCentroid(f.geometry);
      return isInEastBay(c[0], c[1]);
    });
    allFeatures = shatteredCircles.features;

    // Group stops from DIFFERENT routes only
    groupedSites = groupNearbyStops(allFeatures);

    // Build per-route polygon layers
    const featuresByRoute = {};
    allFeatures.forEach(f => {
      const r = f.properties.route;
      if (!featuresByRoute[r]) featuresByRoute[r] = [];
      featuresByRoute[r].push(f);
    });

    for (const [route, features] of Object.entries(featuresByRoute)) {
      const lg = L.layerGroup();
      features.forEach(feature => {
        const layer = L.geoJSON(feature, {
          style: {
            color: getRouteColor(route),
            weight: 2,
            opacity: 0.85,
            fillColor: getRouteColor(route),
            fillOpacity: Math.max(0.08, 0.35 - (feature.properties.re_ratio || 0) * 0.3)
          }
        });
        layer.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          map.closePopup();
          const groupIdx = findGroupForFeature(feature);
          if (groupIdx >= 0) {
            navigateToRouteStop(feature.properties.route, groupIdx);
          }
        });
        layer.on('mouseover', function() {
          const p = feature.properties;
          layer.getLayers()[0].bindTooltip(
            `<b>${p.stop || 'Stop'}</b><br>Route ${p.route} | R<sub>e</sub>: ${(p.re_ratio || 0).toFixed(3)}`,
            { sticky: true }
          ).openTooltip();
          layer.getLayers()[0].setStyle({ weight: 4, opacity: 1 });
        });
        layer.on('mouseout', function() {
          layer.getLayers()[0].unbindTooltip();
          layer.getLayers()[0].setStyle({
            weight: 2, opacity: 0.85
          });
        });
        layer.addTo(lg);
      });
      polygonLayers[route] = lg;
      polygonVisibility[route] = false; // Default: polygons hidden
    }

    buildRoutePanels();
  }

  // Add gold triangle markers for control sites
  const controlMarkerLayer = L.layerGroup().addTo(map);
  const controlSiteMap = {
    'Ashby x Sacramento': 'Channing x California, Berkeley',
    'Ohlone Greenway': 'Ohlone Greenway',
    'Oakland Jack London Square': 'Jack London Square, Oakland'
  };
  CONTROL_SITES.forEach(site => {
    const featureName = controlSiteMap[site.name];
    const triangleIcon = L.divIcon({
      className: 'control-triangle-marker',
      html: '<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="#DAA520" stroke="#fff" stroke-width="1.5"/></svg>',
      iconSize: [20, 20],
      iconAnchor: [10, 18]
    });
    const marker = L.marker([site.lat, site.lon], { icon: triangleIcon, interactive: true });
    marker.bindTooltip(`<b>${featureName}</b><br>Control Site`, { direction: 'top', offset: [0, -10] });
    marker.on('click', function(e) {
      L.DomEvent.stopPropagation(e);
      const feat = findControlFeature(featureName);
      if (feat) {
        const center = featureName === 'Jack London Square, Oakland' ? [37.795145, -122.276890] : getCentroid(feat.geometry);
        enterOverlay2(Array.isArray(center) ? center : [center[0], center[1]], [feat], false);
        showSitePanel({ features: [feat], center: center }, false);
      }
    });
    marker.addTo(controlMarkerLayer);
  });
  window._controlMarkerLayer = controlMarkerLayer;

  buildControlTabs();
  buildRouteGrid();

  // Reach Ratio toggle
  document.getElementById('btn-reach-ratio').addEventListener('click', toggleReachRatioView);
  document.getElementById('btn-density-view').addEventListener('click', toggleDensityView);

  // Countermapping overlay toggles
  document.getElementById('btn-noise-view').addEventListener('click', toggleNoiseView);
  document.getElementById('btn-community-view').addEventListener('click', toggleCommunityView);
  document.getElementById('btn-artifacts-view').addEventListener('click', toggleArtifactsView);

  // Update R_e legend with actual values
  updateReLegendValues();
}

function addArrowMarker(point, prevPoint, color, routeName, layerGroup, isStart) {
  const [lng, lat] = point;
  const [pLng, pLat] = prevPoint;
  const dx = lng - pLng;
  const dy = lat - pLat;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (isStart) angle += 180;

  const arrowHtml = `<div class="route-arrow" style="color:${color};transform:rotate(${-angle + 90}deg);">\u27A4</div>`;

  L.marker([lat, lng], {
    icon: L.divIcon({
      className: '',
      html: arrowHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    }),
    interactive: true
  }).bindTooltip(`Route ${routeName} continues to SF`, { direction: 'top' }).addTo(layerGroup);
}

// ============================================================
// Reach Ratio View
// ============================================================

function buildReachRatioLayer() {
  if (reachRatioLayer && reachRatioLayer.getLayers().length > 0) return;
  reachRatioLayer = L.layerGroup();

  for (const routeName of MAIN_ROUTES) {
    const routeFeature = allBusRoutesRaw.features.find(f => f.properties.route === routeName);
    if (!routeFeature) continue;

    const ebCoords = clipLineToEastBay(routeFeature.geometry.coordinates);
    if (ebCoords.length < 2) continue;

    const routeStops = [];
    if (shatteredCirclesRaw) {
      shatteredCirclesRaw.features.forEach(f => {
        if (f.properties.route === routeName) {
          const c = getCentroid(f.geometry);
          // Skip SF stops (west of -122.38 = Salesforce Transit Center area)
          if (c[1] < -122.38) return;
          routeStops.push({ lat: c[0], lon: c[1], re: f.properties.re_ratio || 0 });
        }
      });
    }

    // Max distance (~800m) beyond which a segment is "too far" from any stop
    const MAX_STOP_DIST = 0.008; // ~800m in degrees

    for (let i = 0; i < ebCoords.length - 1; i++) {
      const [lng1, lat1] = ebCoords[i];
      const [lng2, lat2] = ebCoords[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLon = (lng1 + lng2) / 2;

      let nearestRe = 0.5;
      let nearestDist = Infinity;
      for (const s of routeStops) {
        const d = Math.sqrt(Math.pow(midLat - s.lat, 2) + Math.pow(midLon - s.lon, 2));
        if (d < nearestDist) {
          nearestDist = d;
          nearestRe = s.re;
        }
      }

      // Skip segments that are too far from any analyzed stop
      if (nearestDist > MAX_STOP_DIST) continue;

      const color = reGradientColor(nearestRe);
      L.polyline([[lat1, lng1], [lat2, lng2]], {
        color: color,
        weight: 6,
        opacity: 0.9,
        interactive: false
      }).addTo(reachRatioLayer);
    }
  }
}

function reGradientColor(re) {
  // Scale to actual min/max for better gradient contrast
  const range = globalReMax - globalReMin;
  const t = range > 0 ? Math.max(0, Math.min(1, (re - globalReMin) / range)) : 0.5;
  let r, g, b;
  if (t < 0.5) {
    const u = t / 0.5;
    r = 200; g = Math.round(50 + u * 180); b = 30;
  } else {
    const u = (t - 0.5) / 0.5;
    r = Math.round(200 - u * 140); g = Math.round(230 - u * 30); b = Math.round(30 + u * 50);
  }
  return `rgb(${r},${g},${b})`;
}

function updateReLegendValues() {
  const labels = document.querySelectorAll('#re-map-legend .re-map-scale-labels span');
  if (labels.length >= 3) {
    labels[0].textContent = globalReMin.toFixed(2);
    labels[1].textContent = ((globalReMin + globalReMax) / 2).toFixed(2);
    labels[2].textContent = globalReMax.toFixed(2);
  }
}

function toggleReachRatioView() {
  reachRatioMode = !reachRatioMode;
  const btn = document.getElementById('btn-reach-ratio');
  const legend = document.getElementById('re-map-legend');

  // If turning on Re view, turn off density view first
  if (reachRatioMode && densityMode) {
    densityMode = false;
    if (densityLayer && map.hasLayer(densityLayer)) map.removeLayer(densityLayer);
    document.getElementById('btn-density-view').classList.remove('active');
    document.getElementById('density-map-legend').style.display = 'none';
  }

  if (reachRatioMode) {
    buildReachRatioLayer();
    // Hide polygons and bus stop markers
    for (const rn in polygonLayers) {
      if (map.hasLayer(polygonLayers[rn])) map.removeLayer(polygonLayers[rn]);
    }
    for (const rn in stopMarkerLayers) {
      if (map.hasLayer(stopMarkerLayers[rn])) map.removeLayer(stopMarkerLayers[rn]);
    }
    // Hide route lines (they'll be replaced by gradient)
    for (const rn in routeLayers) {
      if (map.hasLayer(routeLayers[rn])) map.removeLayer(routeLayers[rn]);
    }
    reachRatioLayer.addTo(map);
    btn.classList.add('active');
    legend.style.display = 'block';
  } else {
    if (reachRatioLayer && map.hasLayer(reachRatioLayer))
      map.removeLayer(reachRatioLayer);
    restoreLayerVisibility();
    btn.classList.remove('active');
    legend.style.display = 'none';
  }
}

// ============================================================
// Density View
// ============================================================

function buildDensityLayer() {
  if (densityLayer && densityLayer.getLayers().length > 0) return;
  densityLayer = L.layerGroup();

  // Pre-compute density values per stop to find min/max
  const stopDensities = {};
  for (const routeName of MAIN_ROUTES) {
    if (!shatteredCirclesRaw) continue;
    shatteredCirclesRaw.features.forEach(f => {
      if (f.properties.route === routeName) {
        const c = getCentroid(f.geometry);
        if (c[1] < -122.38) return; // skip SF
        const demoKey = `${routeName}:${f.properties.stop}`;
        const demo = demographicsData[demoKey];
        if (demo && demo.pop_density > 0) {
          const densitySqMi = demo.pop_density * 640;
          const key = `${routeName}:${c[0].toFixed(4)}:${c[1].toFixed(4)}`;
          stopDensities[key] = { lat: c[0], lon: c[1], density: densitySqMi, route: routeName };
          if (densitySqMi < globalDensityMin) globalDensityMin = densitySqMi;
          if (densitySqMi > globalDensityMax) globalDensityMax = densitySqMi;
        }
      }
    });
  }

  updateDensityLegendValues();

  const MAX_STOP_DIST = 0.008;

  for (const routeName of MAIN_ROUTES) {
    const routeFeature = allBusRoutesRaw.features.find(f => f.properties.route === routeName);
    if (!routeFeature) continue;

    const ebCoords = clipLineToEastBay(routeFeature.geometry.coordinates);
    if (ebCoords.length < 2) continue;

    const routeStops = Object.values(stopDensities).filter(s => s.route === routeName);

    for (let i = 0; i < ebCoords.length - 1; i++) {
      const [lng1, lat1] = ebCoords[i];
      const [lng2, lat2] = ebCoords[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLon = (lng1 + lng2) / 2;

      let nearestDensity = 0;
      let nearestDist = Infinity;
      for (const s of routeStops) {
        const d = Math.sqrt(Math.pow(midLat - s.lat, 2) + Math.pow(midLon - s.lon, 2));
        if (d < nearestDist) {
          nearestDist = d;
          nearestDensity = s.density;
        }
      }

      if (nearestDist > MAX_STOP_DIST) continue;

      const color = densityGradientColor(nearestDensity);
      L.polyline([[lat1, lng1], [lat2, lng2]], {
        color: color,
        weight: 6,
        opacity: 0.9,
        interactive: false
      }).addTo(densityLayer);
    }
  }
}

function densityGradientColor(density) {
  const range = globalDensityMax - globalDensityMin;
  const t = range > 0 ? Math.max(0, Math.min(1, (density - globalDensityMin) / range)) : 0.5;
  // Yellow -> Orange -> Dark Red (YlOrRd)
  let r, g, b;
  if (t < 0.5) {
    const u = t / 0.5;
    r = 255;
    g = Math.round(255 - u * 114);
    b = Math.round(178 - u * 118);
  } else {
    const u = (t - 0.5) / 0.5;
    r = Math.round(253 - u * 64);
    g = Math.round(141 - u * 141);
    b = Math.round(60 - u * 22);
  }
  return `rgb(${r},${g},${b})`;
}

function updateDensityLegendValues() {
  const minEl = document.getElementById('density-min');
  const midEl = document.getElementById('density-mid');
  const maxEl = document.getElementById('density-max');
  if (minEl && midEl && maxEl) {
    minEl.textContent = Math.round(globalDensityMin).toLocaleString();
    midEl.textContent = Math.round((globalDensityMin + globalDensityMax) / 2).toLocaleString();
    maxEl.textContent = Math.round(globalDensityMax).toLocaleString();
  }
}

function toggleDensityView() {
  densityMode = !densityMode;
  const btn = document.getElementById('btn-density-view');
  const legend = document.getElementById('density-map-legend');

  // If turning on density, turn off Re view first
  if (densityMode && reachRatioMode) {
    reachRatioMode = false;
    if (reachRatioLayer && map.hasLayer(reachRatioLayer)) map.removeLayer(reachRatioLayer);
    document.getElementById('btn-reach-ratio').classList.remove('active');
    document.getElementById('re-map-legend').style.display = 'none';
  }

  if (densityMode) {
    buildDensityLayer();
    for (const rn in polygonLayers) {
      if (map.hasLayer(polygonLayers[rn])) map.removeLayer(polygonLayers[rn]);
    }
    for (const rn in stopMarkerLayers) {
      if (map.hasLayer(stopMarkerLayers[rn])) map.removeLayer(stopMarkerLayers[rn]);
    }
    for (const rn in routeLayers) {
      if (map.hasLayer(routeLayers[rn])) map.removeLayer(routeLayers[rn]);
    }
    densityLayer.addTo(map);
    btn.classList.add('active');
    legend.style.display = 'block';
  } else {
    if (densityLayer && map.hasLayer(densityLayer))
      map.removeLayer(densityLayer);
    restoreLayerVisibility();
    btn.classList.remove('active');
    legend.style.display = 'none';
  }
}

// ============================================================
// Countermapping Overlays (independent of Re/Density)
// ============================================================

// Estimated dB proxy: motorway=75, trunk=68, primary=62, rail=72, light_rail=65
const ROAD_DB = { motorway: 75, motorway_link: 72, trunk: 68, trunk_link: 65, primary: 62, primary_link: 60 };
const RAIL_DB = { rail: 72, subway: 70, light_rail: 65, monorail: 60 };

function buildNoiseLayer() {
  if (noiseLayer) return;
  noiseLayer = L.layerGroup();

  // Buffer highways with pulsing circles every ~500m
  if (layers.highways) {
    layers.highways.eachLayer(layer => {
      const hw = layer.feature.properties.highway;
      const db = ROAD_DB[hw] || 60;
      const coords = layer.getLatLngs ? layer.getLatLngs() : [];
      const flat = Array.isArray(coords[0]) && coords[0] instanceof L.LatLng ? coords : (coords.length && Array.isArray(coords[0]) ? coords[0] : coords);
      for (let i = 0; i < flat.length; i += 8) {
        const pt = flat[i];
        if (!pt || !pt.lat) continue;
        const r = 10 + (db - 55) * 1.5;
        L.circleMarker([pt.lat, pt.lng], {
          radius: r,
          fillColor: `rgba(192,57,43,${0.15 + (db - 55) * 0.01})`,
          fillOpacity: 0.4,
          stroke: false,
          interactive: true
        }).bindTooltip(`~${db} dB estimated`, { direction: 'top' }).addTo(noiseLayer);
      }
    });
  }

  // Buffer railways
  if (layers.railways) {
    layers.railways.eachLayer(layer => {
      const rw = layer.feature.properties.railway;
      const db = RAIL_DB[rw] || 65;
      const coords = layer.getLatLngs ? layer.getLatLngs() : [];
      const flat = Array.isArray(coords[0]) && coords[0] instanceof L.LatLng ? coords : (coords.length && Array.isArray(coords[0]) ? coords[0] : coords);
      for (let i = 0; i < flat.length; i += 10) {
        const pt = flat[i];
        if (!pt || !pt.lat) continue;
        L.circleMarker([pt.lat, pt.lng], {
          radius: 8 + (db - 55),
          fillColor: `rgba(142,68,173,${0.15 + (db - 55) * 0.01})`,
          fillOpacity: 0.35,
          stroke: false,
          interactive: true
        }).bindTooltip(`~${db} dB rail`, { direction: 'top' }).addTo(noiseLayer);
      }
    });
  }
}

function toggleNoiseView() {
  noiseMode = !noiseMode;
  const btn = document.getElementById('btn-noise-view');
  if (noiseMode) {
    buildNoiseLayer();
    noiseLayer.addTo(map);
    btn.classList.add('active');
  } else {
    if (noiseLayer && map.hasLayer(noiseLayer)) map.removeLayer(noiseLayer);
    btn.classList.remove('active');
  }
}

// Community overlay: color each shattered polygon by non-white share
function buildCommunityLayer() {
  if (communityLayer) return;
  communityLayer = L.layerGroup();

  if (!shatteredCirclesRaw) return;
  shatteredCirclesRaw.features.forEach(f => {
    const key = `${f.properties.route}:${f.properties.stop}`;
    const demo = demographicsData[key] || {};
    const pop = demo.population || 0;
    if (pop === 0) return;
    const nonWhiteShare = 1 - ((demo.white || 0) / pop);
    // Red scale: low = light, high = dark red
    const r = Math.round(254 - nonWhiteShare * 151);
    const g = Math.round(235 - nonWhiteShare * 235);
    const b = Math.round(226 - nonWhiteShare * 213);
    L.geoJSON(f, {
      style: {
        color: `rgb(${r},${g},${b})`,
        weight: 1.5,
        opacity: 0.8,
        fillColor: `rgb(${r},${g},${b})`,
        fillOpacity: 0.5
      },
      interactive: true
    }).bindTooltip(
      `<b>${f.properties.stop}</b><br>Non-white: ${(nonWhiteShare * 100).toFixed(0)}%<br>Pop: ${pop.toLocaleString()}`,
      { sticky: true }
    ).addTo(communityLayer);
  });
}

let _preCommunityPolygonState = {};
function toggleCommunityView() {
  communityMode = !communityMode;
  const btn = document.getElementById('btn-community-view');
  const legend = document.getElementById('community-map-legend');
  if (communityMode) {
    // Save which polygon layers are currently on the map, then hide them
    _preCommunityPolygonState = {};
    for (const rn in polygonLayers) {
      _preCommunityPolygonState[rn] = map.hasLayer(polygonLayers[rn]);
      if (map.hasLayer(polygonLayers[rn])) map.removeLayer(polygonLayers[rn]);
    }
    buildCommunityLayer();
    communityLayer.addTo(map);
    btn.classList.add('active');
    legend.style.display = 'block';
  } else {
    if (communityLayer && map.hasLayer(communityLayer)) map.removeLayer(communityLayer);
    // Restore polygon layers that were visible before community was toggled on
    for (const rn in _preCommunityPolygonState) {
      if (_preCommunityPolygonState[rn] && polygonLayers[rn] && !map.hasLayer(polygonLayers[rn])) {
        polygonLayers[rn].addTo(map);
      }
    }
    _preCommunityPolygonState = {};
    btn.classList.remove('active');
    legend.style.display = 'none';
  }
}

// Geo-tagged artifacts: user photos with EXIF GPS + art locations
const ARTIFACT_DATA = [
  // Ohlone Greenway field photos (user uploads with GPS)
  { lat: 37.880008, lon: -122.289292, src: 'assets/story/ohlone-path-mural.jpg', title: 'Greenway path mural', site: 'Ohlone Greenway' },
  { lat: 37.880764, lon: -122.289606, src: 'assets/story/ohlone-bench-art.jpg', title: 'Community bench art', site: 'Ohlone Greenway' },
  { lat: 37.885411, lon: -122.291689, src: 'assets/story/ohlone-rail-corridor.jpg', title: 'Former rail corridor', site: 'Ohlone Greenway' },
  { lat: 37.886069, lon: -122.291961, src: 'assets/story/ohlone-greenway-sign.jpg', title: 'Greenway marker', site: 'Ohlone Greenway' },
  { lat: 37.891503, lon: -122.293494, src: 'assets/story/ohlone-albany-sign.jpg', title: 'Albany segment', site: 'Ohlone Greenway' },
  { lat: 37.893850, lon: -122.294397, src: 'assets/story/ohlone-face-mural.jpg', title: 'Face mural', site: 'Ohlone Greenway' },
  { lat: 37.901767, lon: -122.297883, src: 'assets/story/ohlone-fire-circle.jpg', title: 'Fire circle art', site: 'Ohlone Greenway' },
  // Channing / South Berkeley (web-sourced art)
  { lat: 37.8550, lon: -122.2678, src: 'assets/story/channing-south-berkeley-mural.jpg', title: '"The Invisible Becomes Visible" mural', site: 'Channing x California, Berkeley' },
  // Jack London Square (web-sourced art)
  { lat: 37.7959, lon: -122.2716, src: 'assets/story/jls-mural-tour.jpg', title: '"Earth Sanctuary" mural', site: 'Jack London Square, Oakland' }
];

function findNearestShatteredPolygon(lat, lon) {
  if (!shatteredCirclesRaw) return null;
  let best = null, bestDist = Infinity;
  shatteredCirclesRaw.features.forEach(f => {
    const c = getCentroid(f.geometry);
    const d = Math.sqrt(Math.pow(c[0] - lat, 2) + Math.pow(c[1] - lon, 2));
    if (d < bestDist) { bestDist = d; best = f; }
  });
  return best;
}

function buildArtifactsLayer() {
  if (artifactsLayer) return;
  artifactsLayer = L.layerGroup();

  ARTIFACT_DATA.forEach(art => {
    const icon = L.divIcon({
      className: 'artifact-marker-icon',
      html: `<img src="${art.src}" width="36" height="36" style="object-fit:cover;display:block;">`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    const marker = L.marker([art.lat, art.lon], { icon: icon, interactive: true });
    marker.bindTooltip(`<b>${art.title}</b><br>${art.site}`, { direction: 'top', offset: [0, -20] });

    marker.on('click', function() {
      const poly = findNearestShatteredPolygon(art.lat, art.lon);
      if (poly) {
        const centroid = getCentroid(poly.geometry);
        // Draw forensic line from artifact to polygon centroid
        const line = L.polyline([[art.lat, art.lon], centroid], {
          color: '#d4a017', weight: 2, dashArray: '6 4', opacity: 0.8
        }).addTo(map);
        setTimeout(() => map.removeLayer(line), 5000);

        // Show popup with artifact + polygon info
        const re = (poly.properties.re_ratio || 0).toFixed(4);
        L.popup()
          .setLatLng([art.lat, art.lon])
          .setContent(`
            <div style="max-width:220px">
              <img src="${art.src}" style="width:100%;border-radius:4px;margin-bottom:6px">
              <b>${art.title}</b><br>
              <span style="font-size:0.78rem;color:#888">${art.site}</span><br>
              <span style="font-size:0.78rem">Nearest polygon: <b>${poly.properties.stop}</b> (R<sub>e</sub> = ${re})</span>
            </div>
          `)
          .openOn(map);
      }
    });

    marker.addTo(artifactsLayer);
  });
}

function toggleArtifactsView() {
  artifactsMode = !artifactsMode;
  const btn = document.getElementById('btn-artifacts-view');
  if (artifactsMode) {
    buildArtifactsLayer();
    artifactsLayer.addTo(map);
    btn.classList.add('active');
  } else {
    if (artifactsLayer && map.hasLayer(artifactsLayer)) map.removeLayer(artifactsLayer);
    btn.classList.remove('active');
  }
}

// ============================================================
// Forensic Field Notes (Limits of the Map)
// ============================================================

const FIELD_NOTES = [
  {
    quote: 'We understand walking as map-making, a form of knowledge production generated by performative and situated storytelling along paths and in places filled with meaning.',
    cite: 'Sletto et al., "Walking, knowing, and the limits of the map," Cultural Geographies 28(4), 2021'
  },
  {
    quote: 'Post-representational cartography views maps as inherently unstable and unfinished, always in the making and thus singularly open for refolding and re-presentation.',
    cite: 'Sletto et al., 2021'
  },
  {
    quote: 'The material, performative crossings of bodies through landscapes may inspire new forms of knowledge production and destabilize Cartesian cartographic colonialities.',
    cite: 'Sletto et al., 2021'
  }
];

function buildFieldNotesHtml() {
  const notesHtml = FIELD_NOTES.map(n =>
    `<blockquote>"${n.quote}"</blockquote><div class="fn-cite">— ${n.cite}</div>`
  ).join('');
  return `
    <div class="field-notes-panel">
      <h3>Forensic Field Notes — Limits of the Map</h3>
      <p style="font-size:0.78rem;color:#666;margin-bottom:8px">
        The R<sub>e</sub> ratio measures the grid, but walking methodology captured the feeling of space that data occludes.
        What follows is not data — it is what the walker noticed that the polygon could not hold.
      </p>
      ${notesHtml}
    </div>
  `;
}

// ============================================================
// Control Tabs
// ============================================================

function buildControlTabs() {
  const tabBar = document.getElementById('tab-bar');

  tabBar.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  buildLinesTab();
}

function buildLinesTab() {
  const container = document.getElementById('lines-list');
  container.innerHTML = '';

  // Main routes section
  const mainSection = document.createElement('div');
  mainSection.className = 'lines-section';
  mainSection.innerHTML = '<div class="lines-section-title">Analysis Routes</div>';

  allRouteData.filter(r => r.is_main).forEach(r => {
    mainSection.appendChild(createRouteToggle(r, true));
  });
  container.appendChild(mainSection);

  // Polygon toggle section
  const polySection = document.createElement('div');
  polySection.className = 'lines-section';
  polySection.innerHTML = `<div class="lines-section-title">Polygon Display <span class="poly-count-badge" id="poly-count">0/${MAX_POLYGON_ROUTES}</span></div>`;
  const polyDesc = document.createElement('p');
  polyDesc.className = 'tab-pane-desc';
  polyDesc.textContent = `Show analysis polygons per route (max ${MAX_POLYGON_ROUTES} at a time).`;
  polySection.appendChild(polyDesc);

  // Show polygon toggles for ALL routes that have polygon data
  // Main routes first, then others alphabetically
  const routesWithPolygons = Object.keys(polygonLayers);
  const mainWithPolygons = routesWithPolygons.filter(r => MAIN_ROUTES.has(r)).sort();
  const otherWithPolygons = routesWithPolygons.filter(r => !MAIN_ROUTES.has(r))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  [...mainWithPolygons, ...otherWithPolygons].forEach(route => {
    polySection.appendChild(createPolygonToggle(route));
  });
  container.appendChild(polySection);

  // Other routes section
  const otherSection = document.createElement('div');
  otherSection.className = 'lines-section';
  otherSection.innerHTML = '<div class="lines-section-title">Other AC Transit Routes</div>';

  const bulkBtns = document.createElement('div');
  bulkBtns.className = 'bulk-toggle';
  bulkBtns.innerHTML = `<button class="bulk-btn" id="show-all-routes">Show All</button><button class="bulk-btn" id="hide-all-routes">Hide All</button>`;
  otherSection.appendChild(bulkBtns);

  allRouteData.filter(r => !r.is_main).forEach(r => {
    otherSection.appendChild(createRouteToggle(r, false));
  });
  container.appendChild(otherSection);

  document.getElementById('show-all-routes').addEventListener('click', () => {
    allRouteData.filter(r => !r.is_main).forEach(r => {
      setRouteVisible(r.route, true);
    });
    container.querySelectorAll('.route-toggle-input').forEach(cb => { cb.checked = true; });
  });
  document.getElementById('hide-all-routes').addEventListener('click', () => {
    allRouteData.filter(r => !r.is_main).forEach(r => {
      setRouteVisible(r.route, false);
    });
    container.querySelectorAll('.route-toggle-input:not(.main-route)').forEach(cb => { cb.checked = false; });
  });
}

function createRouteToggle(routeData, isMain) {
  const row = document.createElement('div');
  row.className = 'route-toggle-row';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = `route-toggle-input ${isMain ? 'main-route' : ''}`;
  cb.checked = !!routeVisibility[routeData.route];
  cb.dataset.route = routeData.route;
  cb.addEventListener('change', () => {
    setRouteVisible(routeData.route, cb.checked);
  });
  row.appendChild(cb);
  const dot = document.createElement('span');
  dot.className = 'route-color-dot';
  dot.style.background = routeData.color;
  row.appendChild(dot);
  const name = document.createElement('span');
  name.className = 'route-toggle-name';
  name.textContent = routeData.route;
  row.appendChild(name);
  const desc = document.createElement('span');
  desc.className = 'route-toggle-desc';
  desc.textContent = routeData.long_name;
  row.appendChild(desc);
  row.addEventListener('click', (e) => {
    if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
  });
  return row;
}

function createPolygonToggle(route) {
  const color = getRouteColor(route);
  const featureCount = allFeatures.filter(f => f.properties.route === route).length;
  const row = document.createElement('div');
  row.className = 'route-toggle-row';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'polygon-toggle-input';
  cb.checked = !!polygonVisibility[route];
  cb.dataset.route = route;
  cb.addEventListener('change', () => {
    setPolygonVisible(route, cb.checked);
  });
  row.appendChild(cb);
  const dot = document.createElement('span');
  dot.className = 'route-color-dot route-dot';
  dot.style.background = polygonVisibility[route] ? color : '#DAA520';
  row.appendChild(dot);
  const name = document.createElement('span');
  name.className = 'route-toggle-name';
  name.textContent = route;
  row.appendChild(name);
  const desc = document.createElement('span');
  desc.className = 'route-toggle-desc';
  const rd = allRouteData.find(r => r.route === route);
  desc.textContent = rd ? rd.long_name : `${featureCount} polygons`;
  row.appendChild(desc);
  row.addEventListener('click', (e) => {
    if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
  });
  return row;
}

function setRouteVisible(routeName, visible) {
  routeVisibility[routeName] = visible;
  const lg = routeLayers[routeName];
  if (lg) {
    if (visible && !map.hasLayer(lg)) lg.addTo(map);
    else if (!visible && map.hasLayer(lg)) map.removeLayer(lg);
  }
  // Also show/hide stop markers for this route (not in Overlay 2)
  if (!zoomedCenter) {
    const sm = stopMarkerLayers[routeName];
    if (sm) {
      if (visible && !map.hasLayer(sm)) sm.addTo(map);
      else if (!visible && map.hasLayer(sm)) map.removeLayer(sm);
    }
  }
  // Also show/hide polygons for this route (if polygon visibility is on)
  // But NOT when in Overlay 2 — only the current group's polygon should show
  if (!zoomedCenter) {
    const pl = polygonLayers[routeName];
    if (pl) {
      if (visible && polygonVisibility[routeName] && !map.hasLayer(pl)) pl.addTo(map);
      else if (!visible && map.hasLayer(pl)) map.removeLayer(pl);
    }
  }
}

function setPolygonVisible(route, visible) {
  if (visible) {
    // Check max polygon limit
    const activeCount = activePolygonSlots.filter(s => s !== null).length;
    if (activeCount >= MAX_POLYGON_ROUTES) {
      alert(`Maximum ${MAX_POLYGON_ROUTES} polygon layers can be shown at once.`);
      const cb = document.querySelector(`.polygon-toggle-input[data-route="${route}"]`);
      if (cb) cb.checked = false;
      return;
    }
    // Assign to next available color slot
    const freeSlot = activePolygonSlots.indexOf(null);
    if (freeSlot >= 0) activePolygonSlots[freeSlot] = route;
  } else {
    // Free the color slot
    const slotIdx = activePolygonSlots.indexOf(route);
    if (slotIdx >= 0) activePolygonSlots[slotIdx] = null;
  }

  polygonVisibility[route] = visible;
  // Re-style polygon layer with assigned color
  recolorPolygonLayer(route);
  // Don't show/hide polygon layers when in Overlay 2
  if (!zoomedCenter) {
    const pl = polygonLayers[route];
    if (pl) {
      if (visible && routeVisibility[route] && !map.hasLayer(pl)) pl.addTo(map);
      else if (!visible && map.hasLayer(pl)) map.removeLayer(pl);
    }
  }
  // Also update route line color on the overview map
  recolorRouteLine(route);
  updatePolyCount();
  updatePolygonToggleColors();
  updateLiveLegend();
  // Show/hide control triangle markers when CONTROL polygons toggled
  if (route === 'CONTROL' && window._controlMarkerLayer) {
    if (visible && !map.hasLayer(window._controlMarkerLayer)) window._controlMarkerLayer.addTo(map);
    else if (!visible && map.hasLayer(window._controlMarkerLayer)) map.removeLayer(window._controlMarkerLayer);
  }
}

function updateLiveLegend() {
  const el = document.getElementById('live-legend');
  if (!el) return;
  const items = [];
  for (let i = 0; i < activePolygonSlots.length; i++) {
    const r = activePolygonSlots[i];
    if (r) items.push(`<span class="ll-item"><span class="ll-swatch" style="background:${POLYGON_SLOT_COLORS[i]}"></span>${r}</span>`);
  }
  if (items.length === 0) {
    el.style.display = 'none';
  } else {
    el.innerHTML = items.join('');
    el.style.display = 'flex';
  }
}

function recolorPolygonLayer(route) {
  const pl = polygonLayers[route];
  if (!pl) return;
  const color = getRouteColor(route);
  pl.eachLayer(lg => {
    lg.eachLayer(layer => {
      if (layer.setStyle) {
        const re = layer.feature ? (layer.feature.properties.re_ratio || 0) : 0;
        layer.setStyle({
          color: color,
          fillColor: color,
          fillOpacity: Math.max(0.08, 0.35 - re * 0.3)
        });
      }
    });
  });
}

function recolorRouteLine(route) {
  const lg = routeLayers[route];
  if (!lg) return;
  const color = getRouteColor(route);
  lg.eachLayer(layer => {
    if (layer.setStyle) layer.setStyle({ color: color });
  });
}

function updatePolygonToggleColors() {
  document.querySelectorAll('.polygon-toggle-input').forEach(cb => {
    const route = cb.dataset.route;
    const dot = cb.parentElement.querySelector('.route-dot');
    if (dot) {
      const color = polygonVisibility[route] ? getRouteColor(route) : '#DAA520';
      dot.style.background = color;
    }
  });
}

function updatePolyCount() {
  const count = activePolygonSlots.filter(s => s !== null).length;
  const el = document.getElementById('poly-count');
  if (el) el.textContent = `${count}/${MAX_POLYGON_ROUTES}`;
}

// ============================================================
// Grouping Nearby Stops
// ============================================================

function lookupNeighborhood(lat, lon) {
  let best = null, bestDist = Infinity;
  for (const n of neighborhoods) {
    const d = Math.sqrt(Math.pow(lat - n.lat, 2) + Math.pow(lon - n.lon, 2));
    if (d < n.r && d < bestDist) { best = n.name; bestDist = d; }
  }
  return best || 'East Bay';
}

function getCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return [0, 0];
  const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] :
                 geometry.type === 'MultiPolygon' ? geometry.coordinates[0][0] :
                 [geometry.coordinates];
  let sumLat = 0, sumLon = 0;
  for (const c of coords) { sumLon += c[0]; sumLat += c[1]; }
  return [sumLat / coords.length, sumLon / coords.length];
}

function groupNearbyStops(features) {
  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < features.length; i++) {
    if (assigned.has(i)) continue;
    const centI = getCentroid(features[i].geometry);
    const routeI = features[i].properties.route;
    const group = [i];
    assigned.add(i);

    for (let j = i + 1; j < features.length; j++) {
      if (assigned.has(j)) continue;
      const routeJ = features[j].properties.route;
      // Only group stops from DIFFERENT routes; max one stop per route
      const groupRoutes = group.map(idx => features[idx].properties.route);
      if (groupRoutes.includes(routeJ)) continue;

      const centJ = getCentroid(features[j].geometry);
      const dist = Math.sqrt(
        Math.pow(centI[0] - centJ[0], 2) + Math.pow(centI[1] - centJ[1], 2)
      );
      if (dist < GROUP_RADIUS_DEG) {
        group.push(j);
        assigned.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

function findGroupForFeature(feature) {
  const p = feature.properties;
  for (let g = 0; g < groupedSites.length; g++) {
    for (const idx of groupedSites[g]) {
      const f = allFeatures[idx];
      if (f.properties.stop === p.stop && f.properties.route === p.route) return g;
    }
  }
  return -1;
}

// ============================================================
// Route Panel Building
// ============================================================

function buildRoutePanels() {
  routeStopPanels = {};

  // Build per-route panel lists for all analysis routes
  for (const route of MAIN_ROUTES) {
    const routeFeatures = allFeatures.filter(f => f.properties.route === route);
    if (routeFeatures.length === 0) continue;

    // Sort along the route (direction depends on route geometry)
    const EW_ROUTES = new Set(['57', '28', 'E']); // West to East routes
    const sorted = [...routeFeatures].sort((a, b) => {
      const cA = getCentroid(a.geometry);
      const cB = getCentroid(b.geometry);
      if (EW_ROUTES.has(route)) return cA[1] - cB[1]; // West to East
      return cB[0] - cA[0]; // North to South
    });

    routeStopPanels[route] = sorted.map(f => {
      const groupIdx = findGroupForFeature(f);
      const groupFeatures = groupIdx >= 0
        ? groupedSites[groupIdx].map(i => allFeatures[i])
        : [f];
      const coords = getCentroid(f.geometry);
      return {
        feature: f,
        features: groupFeatures,
        coordinates: coords,
        geometries: groupFeatures.map(gf => gf.geometry),
        groupIdx: groupIdx
      };
    });
  }
}

// ============================================================
// 3x3 Route Grid on Overview
// ============================================================

function buildRouteGrid() {
  const grid = document.getElementById('route-grid-3x3');
  if (!grid) return;
  grid.innerHTML = '';
  const routes = [...MAIN_ROUTES]; // L, 57, 1T, F, 9, 28, 34, E, V
  routes.forEach(route => {
    const item = document.createElement('label');
    item.className = 'route-grid-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = routeVisibility[route] || false;
    cb.addEventListener('change', () => {
      setRouteVisible(route, cb.checked);
      // Also sync with Lines tab checkboxes
      const linesCb = document.querySelector(`.route-toggle-input[data-route="${route}"]`);
      if (linesCb) linesCb.checked = cb.checked;
    });
    const dot = document.createElement('span');
    dot.className = 'route-grid-dot';
    dot.style.background = getRouteColor(route) || '#DAA520';
    const lbl = document.createElement('span');
    lbl.className = 'route-grid-label';
    lbl.textContent = `${route}`;
    item.appendChild(cb);
    item.appendChild(dot);
    item.appendChild(lbl);
    grid.appendChild(item);
  });
}

// ============================================================
// Walkthrough
// ============================================================

function findFeatureByRouteStop(route, stopName) {
  if (!shatteredCirclesRaw) return null;
  return shatteredCirclesRaw.features.find(f =>
    f.properties.route === route && f.properties.stop === stopName
  );
}

function findControlFeature(stopName) {
  if (!shatteredCirclesRaw) return null;
  return shatteredCirclesRaw.features.find(f =>
    f.properties.route === 'CONTROL' && f.properties.stop === stopName
  );
}

function findGroupFeaturesAt(lat, lon) {
  if (!shatteredCirclesRaw) return [];
  const results = [];
  const seen = new Set();
  shatteredCirclesRaw.features.forEach(f => {
    const c = getCentroid(f.geometry);
    const dist = Math.sqrt(Math.pow(c[0] - lat, 2) + Math.pow(c[1] - lon, 2));
    const key = `${f.properties.route}:${f.properties.stop}`;
    if (dist < GROUP_RADIUS_DEG && !seen.has(key)) {
      seen.add(key);
      results.push(f);
    }
  });
  return results;
}

function showWalkthroughPage() {
  clearOverlay2();
  document.querySelectorAll('.story-panel').forEach(el => el.classList.remove('active'));

  // Reset Next button state (may have been disabled on page 2)
  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; }

  const wtPanel = document.getElementById('walkthrough-panel');
  const wtContent = document.getElementById('wt-content');
  wtPanel.classList.add('active');

  switch (walkthroughIdx) {
    case 0: // Page 1: Launch
      wtContent.innerHTML = `
        <h2>Welcome</h2>
        <p>This interactive map counter-maps how freeways, BART lines, and rail corridors fragment the pedestrian network in the East Bay.</p>
        <p>At each bus stop, a half-mile walking polygon reveals how much of the surrounding area is actually reachable on foot. The comparison is a permeability ratio: actual walkable area divided by the theoretical circle.</p>
        <p>But the walkthrough also asks what the metric misses: the emotional, cultural, and social life people build within and against these corridors.</p>
        <p class="hint">Press <b>Next</b> to begin the guided tour.</p>
      `;
      setBasemap(userBasemapPref);
      restoreLayerVisibility();
      map.setView([37.78, -122.20], 11, { animate: false });
      break;

    case 1: { // Page 2: Line toggle
      const mainFour = ['L', '57', '1T', 'F'];
      let toggleHtml = mainFour.map(r => {
        const checked = polygonVisibility[r] ? 'checked' : '';
        const color = getRouteColor(r) || '#DAA520';
        return `<label class="wt-toggle-item">
          <input type="checkbox" ${checked} data-wt-route="${r}">
          <span class="wt-toggle-dot" style="background:${color}"></span>
          ${r} &mdash; ${ROUTE_HIGHWAYS[r] || r}
        </label>`;
      }).join('');
      wtContent.innerHTML = `
        <h2>Analysis Routes</h2>
        <p>Toggle the four main AC Transit corridors used for the permeability comparison:</p>
        <div class="wt-toggle-grid">${toggleHtml}</div>
        <p class="hint" id="wt-toggle-hint">Toggle all four routes on to continue.</p>
      `;
      // Bind toggle events and update Next button state
      const updateWtNextState = () => {
        const allOn = mainFour.every(r => polygonVisibility[r]);
        const nextBtn = document.getElementById('btn-next');
        if (nextBtn) {
          nextBtn.disabled = !allOn;
          nextBtn.style.opacity = allOn ? '1' : '0.4';
        }
        const hint = document.getElementById('wt-toggle-hint');
        if (hint) {
          hint.textContent = allOn ? 'All routes enabled — press Next to continue.' : 'Toggle all four routes on to continue.';
        }
      };
      wtContent.querySelectorAll('[data-wt-route]').forEach(cb => {
        cb.addEventListener('change', () => {
          const r = cb.dataset.wtRoute;
          setPolygonVisible(r, cb.checked);
          updateWtNextState();
        });
      });
      setBasemap(userBasemapPref);
      restoreLayerVisibility();
      map.setView([37.78, -122.20], 11, { animate: false });
      updateWtNextState();
      break;
    }

    case 2: { // Page 3: Channing x California, Berkeley
      const feat = findControlFeature('Channing x California, Berkeley');
      if (feat) {
        const c = getCentroid(feat.geometry);
        wtContent.innerHTML = `
          <h2>Channing &times; California, Berkeley</h2>
          <p>This control site sits in Berkeley's well-connected street grid, away from major infrastructure barriers. The walking polygon is nearly circular, showing what permeability looks like when the street network is largely intact.</p>
          <p>R<sub>e</sub> = <b>${(feat.properties.re_ratio || 0).toFixed(4)}</b></p>
          ${buildStoryStack('Channing x California, Berkeley')}
        `;
        showWalkthroughOverlay2([c[0], c[1]], [feat]);
      }
      break;
    }

    case 3: { // Page 4: Ohlone Greenway
      const feat = findControlFeature('Ohlone Greenway');
      if (feat) {
        const c = getCentroid(feat.geometry);
        wtContent.innerHTML = `
          <h2>Ohlone Greenway</h2>
          <p>The Ohlone Greenway follows a former railroad right-of-way through Albany and El Cerrito. It is the project’s clearest countermapping example: infrastructure built for linear movement, then reclaimed as path, park, mural wall, and neighborhood commons.</p>
          <p>R<sub>e</sub> = <b>${(feat.properties.re_ratio || 0).toFixed(4)}</b></p>
          ${buildStoryStack('Ohlone Greenway')}
        `;
        showWalkthroughOverlay2([c[0], c[1]], [feat]);
      }
      break;
    }

    case 4: { // Page 5: Jack London Square
      const feat = findControlFeature('Jack London Square, Oakland');
      if (feat) {
        wtContent.innerHTML = `
          <h2>Jack London Square, Oakland</h2>
          <p>Jack London Square sits at Oakland's waterfront, bounded by rail lines, I-880, and the estuary. Multiple infrastructure barriers converge here to constrain pedestrian access, creating a dramatically shattered polygon even as the district remains culturally dense.</p>
          <p>R<sub>e</sub> = <b>${(feat.properties.re_ratio || 0).toFixed(4)}</b></p>
          ${buildStoryStack('Jack London Square, Oakland')}
        `;
        showWalkthroughOverlay2([37.795145, -122.276890], [feat]);
      }
      break;
    }

    case 5: { // Page 6: Lowest R_e on L line
      const feat = findFeatureByRouteStop('L', 'Pierce St & Gateview Apts');
      if (feat) {
        const c = getCentroid(feat.geometry);
        wtContent.innerHTML = `
          <h2>Lowest R<sub>e</sub> on Line L</h2>
          <p>Pierce St & Gateview Apts has the lowest reach ratio on Line L (R<sub>e</sub> = <b>${(feat.properties.re_ratio || 0).toFixed(4)}</b>). The I-80 freeway and waterfront infrastructure severely limit how far residents can walk from this bus stop.</p>
          <p>The walking polygon covers only ${((feat.properties.re_ratio || 0) * 100).toFixed(1)}% of what a full half-mile circle would be.</p>
        `;
        showWalkthroughOverlay2([c[0], c[1]], [feat]);
      }
      break;
    }

    case 6: { // Page 7: Least circular — Shellmound (57+F)
      const features = findGroupFeaturesAt(37.83498, -122.29311);
      if (features.length > 0) {
        const c = getCentroid(features[0].geometry);
        const re = features[0].properties.re_ratio || 0;
        wtContent.innerHTML = `
          <h2>Least Circular Polygon</h2>
          <p>Shellmound St & Bay St (Routes 57 + F) has the least circular walking polygon among the four main corridor routes. With R<sub>e</sub> = <b>${re.toFixed(4)}</b>, the freeway and rail infrastructure here create an extremely elongated, fragmented walking area.</p>
          <p>This stop sits at the intersection of I-80, I-580, and the Amtrak Capitol Corridor — a convergence of barriers that dramatically constrains pedestrian movement.</p>
        `;
        showWalkthroughOverlay2([c[0], c[1]], features);
      }
      break;
    }

    case 7: { // Page 8: Re View
      // Untoggle all 4 polygon lines
      ['L', '57', '1T', 'F'].forEach(r => { if (polygonVisibility[r]) setPolygonVisible(r, false); });
      wtContent.innerHTML = `
        <h2>Reach Ratio View</h2>
        <p>This view colors each analysis route by the R<sub>e</sub> ratio at each stop along the line.</p>
        <p>Red segments indicate stops where infrastructure barriers severely constrain walking access. Green segments show stops with nearly full circular reach.</p>
        <p class="hint">The gradient reveals how pedestrian connectivity varies along each corridor.</p>
      `;
      setBasemap(userBasemapPref);
      restoreLayerVisibility();
      map.setView([37.78, -122.20], 11, { animate: false });
      // Activate Re View
      if (!reachRatioMode) toggleReachRatioView();
      break;
    }

    case 8: { // Page 9: Density View
      wtContent.innerHTML = `
        <h2>Population Density View</h2>
        <p>This view colors each analysis route by the population density within each stop's walking polygon.</p>
        <p>Dark red segments indicate densely populated areas where more people depend on pedestrian access. Yellow segments show lower density areas.</p>
        <p class="hint">Comparing density with reach ratio reveals where infrastructure barriers affect the most people.</p>
      `;
      setBasemap(userBasemapPref);
      // Switch from Re to Density view
      if (reachRatioMode) toggleReachRatioView();
      restoreLayerVisibility();
      map.setView([37.78, -122.20], 11, { animate: false });
      if (!densityMode) toggleDensityView();
      break;
    }

    case 9: { // Page 10: Thank you
      // Turn off density view
      if (densityMode) toggleDensityView();
      const allSources = Object.entries(SITE_STORIES).flatMap(([site, s]) =>
        (s.sources || []).map(src => ({ ...src, site }))
      );
      const srcHtml = allSources.map(s => s.url
        ? `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`
        : `<li>${s.label}</li>`
      ).join('');
      wtContent.innerHTML = `
        <h2>Thank You</h2>
        <p>This map was created to visualize how infrastructure corridors fragment pedestrian access in the East Bay.</p>
        <p>Continue exploring by toggling routes in the Lines tab, viewing the R<sub>e</sub> or Density gradient views, or clicking any polygon on the map to see its detail view.</p>
        <p>Use the <b>Noise</b>, <b>Community</b>, and <b>Artifacts</b> buttons above the map for additional countermapping overlays.</p>
        ${buildFieldNotesHtml()}
        <div class="story-section-card" style="margin-top:14px">
          <div class="story-kicker">Sources</div>
          <ul class="story-source-list">${srcHtml}</ul>
        </div>
        <p class="hint">Press <b>Next</b> to return to the start, or click any polygon to explore on your own.</p>
      `;
      setBasemap(userBasemapPref);
      restoreLayerVisibility();
      map.setView([37.78, -122.20], 11, { animate: false });
      break;
    }

    case 10: // Page 11: Back to launch (same as page 1)
      walkthroughIdx = 0;
      showWalkthroughPage();
      return;
  }

  updateNavigation();
}

function showWalkthroughOverlay2(center, features) {
  map.stop();
  setBasemap('satellite');
  enterOverlay2(center, features, false);

  // Append stats and pie chart to walkthrough panel
  const wtContent = document.getElementById('wt-content');
  let raceAgg = { white: 0, black: 0, asian: 0, aian: 0, nhpi: 0, other: 0, two_plus: 0 };
  let totalPop = 0;

  features.forEach(f => {
    const route = f.properties.route;
    const demoKey = `${route}:${f.properties.stop}`;
    const demo = demographicsData[demoKey] || {};
    const pop = demo.population || 0;
    const density = demo.pop_density || 0;
    const re = f.properties.re_ratio || 0;
    totalPop += pop;
    if (pop > 0) {
      for (const k in raceAgg) raceAgg[k] += (demo[k] || 0);
    }

    const corridorName = getCorridorName(route, f.properties.stop);
    const corridorCard = corridorName ? `<div class="stat-card"><div class="stat-value">${corridorName}</div><div class="stat-label">Corridor</div></div>` : '';
    const statsHtml = `
      <div class="stats-grid" style="margin-top:8px;">
        <div class="stat-card"><div class="stat-value">${re.toFixed(4)}</div><div class="stat-label">R<sub>e</sub></div></div>
        ${corridorCard}
        <div class="stat-card"><div class="stat-value">${pop.toLocaleString()}<div class="stat-sub">${(density * 640).toLocaleString(undefined, {maximumFractionDigits: 0})} / sq mi</div></div><div class="stat-label">Population</div></div>
      </div>`;
    wtContent.insertAdjacentHTML('beforeend', statsHtml);
  });

  if (totalPop > 0) {
    const raceLabels = [
      { key: 'white', label: 'White', color: '#4e79a7' },
      { key: 'black', label: 'Black', color: '#f28e2b' },
      { key: 'asian', label: 'Asian', color: '#e15759' },
      { key: 'aian', label: 'Indigenous', color: '#76b7b2' },
      { key: 'nhpi', label: 'Pacific Isl.', color: '#59a14f' },
      { key: 'other', label: 'Other', color: '#edc948' },
      { key: 'two_plus', label: 'Two+', color: '#b07aa1' }
    ];
    const raceTotal = Object.values(raceAgg).reduce((a, b) => a + b, 0);
    const pieHtml = buildPieChart(raceLabels, raceAgg, raceTotal);
    wtContent.insertAdjacentHTML('beforeend', `<div style="margin-top:10px">${pieHtml}</div>`);
  }
}

function exitWalkthrough() {
  walkthroughMode = false;
  walkthroughIdx = 0;
  goToOverview();
}

// ============================================================
// Navigation
// ============================================================

function goToOverview() {
  currentRoute = null;
  currentRouteIdx = 0;
  walkthroughMode = false;
  walkthroughIdx = 0;
  clearOverlay2();

  // Turn off reach ratio mode
  if (reachRatioMode) {
    reachRatioMode = false;
    if (reachRatioLayer && map.hasLayer(reachRatioLayer)) map.removeLayer(reachRatioLayer);
    const rrBtn = document.getElementById('btn-reach-ratio');
    if (rrBtn) rrBtn.classList.remove('active');
    document.getElementById('re-map-legend').style.display = 'none';
  }
  // Turn off density mode
  if (densityMode) {
    densityMode = false;
    if (densityLayer && map.hasLayer(densityLayer)) map.removeLayer(densityLayer);
    const dBtn = document.getElementById('btn-density-view');
    if (dBtn) dBtn.classList.remove('active');
    document.getElementById('density-map-legend').style.display = 'none';
  }

  setBasemap(userBasemapPref);
  restoreLayerVisibility();

  document.querySelectorAll('.story-panel').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-panel="intro"]').classList.add('active');

  map.setView([37.78, -122.20], 11, { animate: false });
  updateNavigation();
}

function navigateToRouteStop(route, groupIdxOrStopIdx) {
  // Find the panel index in routeStopPanels for this route and group
  const panels = routeStopPanels[route];
  if (!panels) return;

  let idx = -1;
  if (typeof groupIdxOrStopIdx === 'number') {
    // Find panel by groupIdx
    idx = panels.findIndex(p => p.groupIdx === groupIdxOrStopIdx);
    if (idx < 0) {
      // Try matching by feature
      idx = panels.findIndex(p =>
        p.features.some(f => findGroupForFeature(f) === groupIdxOrStopIdx)
      );
    }
  }
  if (idx < 0) idx = 0;

  currentRoute = route;
  currentRouteIdx = idx;
  showCurrentRoutePanel();
}

function navigateRelative(delta) {
  // Walkthrough mode navigation
  if (walkthroughMode) {
    // Block Next on page 2 (line toggle) until all 4 lines are toggled on
    if (delta > 0 && walkthroughIdx === 1) {
      const mainFour = ['L', '57', '1T', 'F'];
      const allOn = mainFour.every(r => polygonVisibility[r]);
      if (!allOn) return;
    }
    const newIdx = walkthroughIdx + delta;
    if (newIdx < 0) {
      exitWalkthrough();
      return;
    }
    if (newIdx >= WALKTHROUGH_TOTAL) {
      // Page 9 (idx 8) wraps back to page 1 (idx 0)
      walkthroughIdx = 0;
      showWalkthroughPage();
      return;
    }
    walkthroughIdx = newIdx;
    showWalkthroughPage();
    return;
  }

  if (!currentRoute) {
    // In overview mode, start walkthrough on Next
    if (delta > 0) {
      // Reset all polygon toggles before starting walkthrough
      for (const r of MAIN_ROUTES) {
        if (polygonVisibility[r]) setPolygonVisible(r, false);
      }
      // Turn off Re/Density views if active
      if (reachRatioMode) toggleReachRatioView();
      if (densityMode) toggleDensityView();
      walkthroughMode = true;
      walkthroughIdx = 0;
      showWalkthroughPage();
    }
    return;
  }

  const panels = routeStopPanels[currentRoute];
  if (!panels) return;

  const newIdx = currentRouteIdx + delta;
  if (newIdx < 0) {
    goToOverview();
    return;
  }
  if (newIdx >= panels.length) return;

  currentRouteIdx = newIdx;
  showCurrentRoutePanel();
}

function showCurrentRoutePanel() {
  if (!currentRoute) { goToOverview(); return; }
  const panels = routeStopPanels[currentRoute];
  if (!panels || currentRouteIdx >= panels.length) { goToOverview(); return; }

  const panel = panels[currentRouteIdx];
  // Skip animation if already in Overlay 2 (navigating between stops)
  const wasInOverlay2 = !!zoomedCenter;
  clearOverlay2();

  document.querySelectorAll('.story-panel').forEach(el => el.classList.remove('active'));

  showSitePanel(panel, wasInOverlay2);
  updateNavigation();
}

function clearOverlay2() {
  if (halfMileCircle) { map.removeLayer(halfMileCircle); halfMileCircle = null; }
  if (highlightLayer) { map.removeLayer(highlightLayer); highlightLayer = null; }
  if (maskLayer) { map.removeLayer(maskLayer); maskLayer = null; }
  if (overlay2Markers) { map.removeLayer(overlay2Markers); overlay2Markers = null; }
  document.getElementById('circle-legend').style.display = 'none';
  document.getElementById('btn-back-overview').style.display = 'none';
  zoomedCenter = null;
}

// ============================================================
// Panel Renderers
// ============================================================

function showSitePanel(panel, skipAnim) {
  const panelEl = document.getElementById('site-panel');
  panelEl.classList.add('active');

  const features = panel.features;
  const routes = [...new Set(features.map(f => f.properties.route))];
  const isGrouped = features.length > 1;

  const badge = document.getElementById('site-badge');
  if (routes.length > 1) {
    badge.style.background = '#555';
    badge.textContent = routes.map(r => `Route ${r}`).join(' + ');
  } else {
    badge.style.background = getRouteColor(features[0].properties.route);
    badge.textContent = `Route ${features[0].properties.route}`;
  }

  const stopNames = [...new Set(features.map(f => f.properties.stop))];
  document.getElementById('site-title').textContent = stopNames.join(' / ');

  const statsContainer = document.getElementById('site-stats-container');
  statsContainer.innerHTML = '';

  // Aggregate demographics across all features in this group
  let totalPop = 0, totalDensity = 0, totalArea = 0;
  let raceAgg = { white: 0, black: 0, asian: 0, aian: 0, nhpi: 0, other: 0, two_plus: 0 };
  let demoCount = 0;

  features.forEach((f, idx) => {
    const re = f.properties.re_ratio || 0;
    const route = f.properties.route;
    const demoKey = `${route}:${f.properties.stop}`;
    const demo = demographicsData[demoKey] || {};

    const pop = demo.population || 0;
    const density = demo.pop_density || 0;
    const polyArea = demo.poly_area_acres || 0;
    totalPop += pop;
    totalArea += polyArea;
    if (pop > 0) {
      demoCount++;
      for (const k in raceAgg) raceAgg[k] += (demo[k] || 0);
    }

    const section = document.createElement('div');
    section.className = 'group-route-section';
    const label = document.createElement('div');
    label.className = 'group-route-label';
    label.style.background = getRouteColor(route);
    const numLabel = isGrouped ? `${idx + 1}. ` : '';
    label.textContent = `${numLabel}Route ${route} \u2014 ${f.properties.stop}`;
    section.appendChild(label);
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-value">${re.toFixed(4)}</div><div class="stat-label">R<sub>e</sub> Ratio</div></div>
      <div class="stat-card"><div class="stat-value">${getCorridorName(route, f.properties.stop)}</div><div class="stat-label">Corridor</div></div>
      <div class="stat-card"><div class="stat-value">${pop.toLocaleString()}<div class="stat-sub">${(density * 640).toLocaleString(undefined, {maximumFractionDigits: 0})} / sq mi</div></div><div class="stat-label">Population</div></div>
    `;
    section.appendChild(grid);
    statsContainer.appendChild(section);
  });

  const center = panel.coordinates;
  const hood = lookupNeighborhood(center[0], center[1]);
  const storyKey = getStoryKeyForFeatures(features);
  let desc;
  if (storyKey) {
    desc = '';
  } else if (isGrouped) {
    const routeList = routes.join(', ');
    desc = `This bus stop on Routes ${routeList} serves the ${hood} neighborhood.`;
    features.forEach(f => {
      const r = f.properties.route;
      const t = routeTerminals[r];
      if (t) {
        desc += ` Route ${r} originates at ${t.origin} and terminates at ${t.terminus}.`;
      }
    });
  } else {
    const r = features[0].properties.route;
    desc = `This bus stop on Route ${r} serves the ${hood} neighborhood.`;
    const t = routeTerminals[r];
    if (t) {
      desc += ` Route ${r} originates at ${t.origin} and terminates at ${t.terminus}.`;
    }
  }
  document.getElementById('site-desc-text').textContent = desc;
  document.getElementById('site-description').style.display = storyKey ? 'none' : 'block';

  const storyStack = document.getElementById('site-story-stack');
  storyStack.innerHTML = storyKey ? buildStoryStack(storyKey) : '';
  storyStack.style.display = storyKey ? 'block' : 'none';

  // Add pie chart of demographics by race
  const pieContainer = document.getElementById('site-pie-chart');
  if (pieContainer) {
    if (totalPop > 0) {
      const raceLabels = [
        { key: 'white', label: 'White', color: '#4e79a7' },
        { key: 'black', label: 'Black', color: '#f28e2b' },
        { key: 'asian', label: 'Asian', color: '#e15759' },
        { key: 'aian', label: 'Indigenous', color: '#76b7b2' },
        { key: 'nhpi', label: 'Pacific Isl.', color: '#59a14f' },
        { key: 'other', label: 'Other', color: '#edc948' },
        { key: 'two_plus', label: 'Two+', color: '#b07aa1' }
      ];
      const raceTotal = Object.values(raceAgg).reduce((a, b) => a + b, 0);
      pieContainer.innerHTML = buildPieChart(raceLabels, raceAgg, raceTotal);
      pieContainer.style.display = 'block';
    } else {
      pieContainer.innerHTML = '';
      pieContainer.style.display = 'none';
    }
  }

  enterOverlay2(panel.coordinates, features, skipAnim);
}

function buildPieChart(raceLabels, raceAgg, raceTotal) {
  if (raceTotal <= 0) return '';
  // Build conic-gradient CSS pie chart
  let gradientParts = [];
  let cumPct = 0;
  const slices = [];
  raceLabels.forEach(r => {
    const val = raceAgg[r.key] || 0;
    const pct = (val / raceTotal) * 100;
    if (pct > 0.5) {
      slices.push({ ...r, val, pct });
    }
  });
  // Sort by descending percentage
  slices.sort((a, b) => b.pct - a.pct);
  slices.forEach(s => {
    const start = cumPct;
    cumPct += s.pct;
    gradientParts.push(`${s.color} ${start.toFixed(1)}% ${cumPct.toFixed(1)}%`);
  });
  const gradient = gradientParts.join(', ');
  
  let legendHtml = slices.map(s =>
    `<div class="pie-legend-item"><span class="pie-swatch" style="background:${s.color}"></span>${s.label} ${s.pct.toFixed(1)}%</div>`
  ).join('');

  return `
    <div class="pie-chart-title">Demographics by Race</div>
    <div class="pie-chart-row">
      <div class="pie-circle" style="background: conic-gradient(${gradient})"></div>
      <div class="pie-legend">${legendHtml}</div>
    </div>
  `;
}

function reToColor(re, baseColor) {
  const t = Math.max(0, Math.min(1, (re - 0.1) / 0.6));
  const r1 = 180, g1 = 30, b1 = 30;
  const r2 = parseInt(baseColor.slice(1, 3), 16);
  const g2 = parseInt(baseColor.slice(3, 5), 16);
  const b2 = parseInt(baseColor.slice(5, 7), 16);
  const r = Math.round(r1 + t * (r2 - r1));
  const g = Math.round(g1 + t * (g2 - g1));
  const b = Math.round(b1 + t * (b2 - b1));
  return `rgb(${r},${g},${b})`;
}

// ============================================================
// Overlay 2
// ============================================================

function enterOverlay2(center, features, skipAnimation) {
  zoomedCenter = center;
  dimLayersForZoom();
  setBasemap('satellite');

  // Switch to Story tab
  document.querySelectorAll('#tab-bar .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#tab-bar .tab-btn[data-tab="story"]').classList.add('active');
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-story').classList.add('active');

  if (skipAnimation) {
    map.setView(center, 15.5, { animate: false });
  } else {
    map.flyTo(center, 15.5, { duration: 1.2 });
  }

  halfMileCircle = L.circle(center, {
    radius: HALF_MILE_M,
    color: '#ffffff',
    weight: 4,
    opacity: 1,
    dashArray: '10 6',
    fillColor: '#ffffff',
    fillOpacity: 0.03,
    interactive: false
  }).addTo(map);

  const maskPoly = createCircleMask(center, HALF_MILE_M);
  maskLayer = L.geoJSON(maskPoly, {
    style: { fillColor: '#000', fillOpacity: 0.45, stroke: false, interactive: false },
    interactive: false
  }).addTo(map);

  if (features.length > 0) {
    const highlightGeojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        properties: f.properties,
        geometry: f.geometry
      }))
    };
    highlightLayer = L.geoJSON(highlightGeojson, {
      style: function(feature) {
        const color = getRouteColor(feature.properties.route);
        return { color: '#fff', weight: 4, opacity: 1, fillColor: color, fillOpacity: 0.3 };
      }
    }).addTo(map);
  }

  // Add bus stop circle markers for Overlay 2
  overlay2Markers = L.layerGroup();

  const servedRoutes = features.length > 0
    ? [...new Set(features.map(f => f.properties.route))]
    : [];

  // Build set of allowed stop positions: current stop + 2 before/after on served routes
  const allowedStops = new Set();
  const currentStopCoords = new Set();

  features.forEach(f => {
    const c = getCentroid(f.geometry);
    currentStopCoords.add(`${f.properties.route}:${c[0].toFixed(4)}:${c[1].toFixed(4)}`);
  });

  servedRoutes.forEach(rn => {
    const panels = routeStopPanels[rn];
    if (panels) {
      let curIdx = -1;
      for (let i = 0; i < panels.length; i++) {
        const pc = panels[i].coordinates;
        if (Math.abs(pc[0] - center[0]) < 0.001 && Math.abs(pc[1] - center[1]) < 0.001) {
          curIdx = i;
          break;
        }
      }
      if (curIdx < 0 && currentRoute === rn) curIdx = currentRouteIdx;
      if (curIdx >= 0) {
        for (let d = -2; d <= 2; d++) {
          const idx = curIdx + d;
          if (idx >= 0 && idx < panels.length) {
            const pc = panels[idx].coordinates;
            allowedStops.add(`${rn}:${pc[0].toFixed(4)}:${pc[1].toFixed(4)}`);
          }
        }
      }
    }
  });

  if (allBusStopsData) {
    allBusStopsData.features.forEach(f => {
      const [sLng, sLat] = f.geometry.coordinates;
      const dist = Math.sqrt(Math.pow(sLat - center[0], 2) + Math.pow(sLng - center[1], 2));
      if (dist > 0.015) return;

      const route = f.properties.route;
      if (!servedRoutes.includes(route)) return;

      // Always allow the current group's stops
      const isCurrentStop = currentStopCoords.has(`${route}:${sLat.toFixed(4)}:${sLng.toFixed(4)}`) ||
        [...currentStopCoords].some(k => {
          const [kr, klat, klng] = k.split(':');
          return kr === route &&
            Math.abs(parseFloat(klat) - sLat) < 0.001 &&
            Math.abs(parseFloat(klng) - sLng) < 0.001;
        });
      const stopKey = `${route}:${sLat.toFixed(4)}:${sLng.toFixed(4)}`;
      const isAllowed = isCurrentStop || allowedStops.has(stopKey) ||
        [...allowedStops].some(k => {
          const [kr, klat, klng] = k.split(':');
          return kr === route &&
            Math.abs(parseFloat(klat) - sLat) < 0.001 &&
            Math.abs(parseFloat(klng) - sLng) < 0.001;
        });
      if (!isAllowed) return;

      const isCurrentGroup = isCurrentStop;

      const stopColor = '#DAA520'; // unified gold
      const size = isCurrentGroup ? 36 : 24;
      const fontSize = isCurrentGroup ? '0.72rem' : '0.55rem';
      const zIdx = isCurrentGroup ? 1000 : 500;

      const marker = L.marker([sLat, sLng], {
        icon: L.divIcon({
          className: 'overlay2-stop-marker',
          html: `<div class="o2-stop-circle ${isCurrentGroup ? 'o2-current' : ''}" style="background:${stopColor};border-color:${stopColor};width:${size}px;height:${size}px;font-size:${fontSize}">${route}</div>`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        }),
        interactive: true,
        zIndexOffset: zIdx
      });

      marker.bindTooltip(`<b>${f.properties.stop_name}</b><br>Route ${route}`, { direction: 'top', offset: [0, -size/2] });

      marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        const matchingFeature = allFeatures.find(af =>
          af.properties.route === route &&
          Math.abs(getCentroid(af.geometry)[0] - sLat) < 0.001 &&
          Math.abs(getCentroid(af.geometry)[1] - sLng) < 0.001
        );
        if (matchingFeature) {
          const gIdx = findGroupForFeature(matchingFeature);
          if (gIdx >= 0) navigateToRouteStop(route, gIdx);
        }
      });

      marker.addTo(overlay2Markers);
    });

    // Show ~1 mile of polyline for all toggled-on routes that pass nearby
    const ONE_MILE_DEG = 0.0145;
    const addedPolylines = new Set();
    allBusRoutesRaw.features.forEach(f => {
      const rn = f.properties.route;
      if (addedPolylines.has(rn)) return;
      if (!routeVisibility[rn] && !servedRoutes.includes(rn)) return;
      const ebCoords = clipLineToEastBay(f.geometry.coordinates);
      if (ebCoords.length < 2) return;
      const nearby = ebCoords.filter(c =>
        Math.abs(c[1] - center[0]) < ONE_MILE_DEG && Math.abs(c[0] - center[1]) < ONE_MILE_DEG
      );
      if (nearby.length < 2) return;
      addedPolylines.add(rn);
      const isServed = servedRoutes.includes(rn);
      const routeData = allRouteData.find(r => r.route === rn);
      const color = getRouteColor(rn);
      L.polyline(
        nearby.map(c => [c[1], c[0]]),
        { color: color, weight: isServed ? 6 : 3, opacity: isServed ? 0.9 : 0.45, interactive: false }
      ).addTo(overlay2Markers);
    });
  }
  overlay2Markers.addTo(map);

  document.getElementById('circle-legend').style.display = 'flex';
  document.getElementById('btn-back-overview').style.display = 'block';
}

function createCircleMask(center, radiusM) {
  const [lat, lng] = center;
  const outer = [[-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]];
  const points = 64;
  const inner = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusM / 111320) * Math.cos(angle);
    const dLng = (radiusM / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    inner.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [outer.map(c => [c[1], c[0]]), inner] },
    properties: {}
  };
}

// ============================================================
// Layer Visibility
// ============================================================

function dimLayersForZoom() {
  for (const rn in polygonLayers) {
    if (map.hasLayer(polygonLayers[rn])) map.removeLayer(polygonLayers[rn]);
  }
  for (const rn in stopMarkerLayers) {
    if (map.hasLayer(stopMarkerLayers[rn])) map.removeLayer(stopMarkerLayers[rn]);
  }
  if (layers.waterways && map.hasLayer(layers.waterways))
    map.removeLayer(layers.waterways);
  for (const rn in routeLayers) {
    if (map.hasLayer(routeLayers[rn])) map.removeLayer(routeLayers[rn]);
  }
  if (reachRatioLayer && map.hasLayer(reachRatioLayer))
    map.removeLayer(reachRatioLayer);
  if (noiseLayer && map.hasLayer(noiseLayer))
    map.removeLayer(noiseLayer);
  if (communityLayer && map.hasLayer(communityLayer))
    map.removeLayer(communityLayer);
  if (artifactsLayer && map.hasLayer(artifactsLayer))
    map.removeLayer(artifactsLayer);
  if (window._controlMarkerLayer && map.hasLayer(window._controlMarkerLayer))
    map.removeLayer(window._controlMarkerLayer);
}

function restoreLayerVisibility() {
  [layers.waterways, layers.highways, layers.railways].forEach(l => {
    if (l && !map.hasLayer(l)) map.addLayer(l);
  });
  for (const rn in routeLayers) {
    if (routeVisibility[rn] && !map.hasLayer(routeLayers[rn])) {
      routeLayers[rn].addTo(map);
    }
  }
  for (const rn in stopMarkerLayers) {
    if (routeVisibility[rn] && !map.hasLayer(stopMarkerLayers[rn])) {
      stopMarkerLayers[rn].addTo(map);
    }
  }
  for (const rn in polygonLayers) {
    if (polygonVisibility[rn] && routeVisibility[rn] && !map.hasLayer(polygonLayers[rn])) {
      polygonLayers[rn].addTo(map);
    }
  }
  if (window._controlMarkerLayer && !map.hasLayer(window._controlMarkerLayer))
    window._controlMarkerLayer.addTo(map);
  if (noiseMode && noiseLayer && !map.hasLayer(noiseLayer))
    noiseLayer.addTo(map);
  if (communityMode && communityLayer && !map.hasLayer(communityLayer))
    communityLayer.addTo(map);
  if (artifactsMode && artifactsLayer && !map.hasLayer(artifactsLayer))
    artifactsLayer.addTo(map);
}

// ============================================================
// Navigation Controls
// ============================================================

function updateNavigation() {
  const counter = document.getElementById('nav-counter');
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');

  if (walkthroughMode) {
    counter.textContent = `Walkthrough: ${walkthroughIdx + 1} / ${WALKTHROUGH_TOTAL}`;
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  } else if (!currentRoute) {
    counter.textContent = 'Overview';
    prevBtn.disabled = true;
    nextBtn.disabled = false;
  } else {
    const panels = routeStopPanels[currentRoute] || [];
    counter.textContent = `Route ${currentRoute}: ${currentRouteIdx + 1} / ${panels.length}`;
    prevBtn.disabled = false;
    nextBtn.disabled = currentRouteIdx >= panels.length - 1;
  }
}

document.getElementById('btn-prev').addEventListener('click', () => {
  navigateRelative(-1);
});

document.getElementById('btn-next').addEventListener('click', () => {
  navigateRelative(1);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const ts = document.getElementById('title-screen');
    if (ts && !ts.classList.contains('hidden')) { dismissTitleScreen(); return; }
    goToOverview();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigateRelative(1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigateRelative(-1);
});

document.getElementById('btn-back-overview').addEventListener('click', () => goToOverview());

// ============================================================
// Title Screen
// ============================================================
function dismissTitleScreen() {
  const ts = document.getElementById('title-screen');
  if (!ts || ts.classList.contains('hidden')) return;
  ts.classList.add('hidden');
  setTimeout(() => { ts.style.display = 'none'; }, 400);
}

// Buttons dismiss
document.getElementById('btn-walkthrough').addEventListener('click', (e) => { e.stopPropagation(); dismissTitleScreen(); });
document.getElementById('btn-explore').addEventListener('click', (e) => { e.stopPropagation(); dismissTitleScreen(); });
// Click anywhere on overlay dismisses
document.getElementById('title-screen').addEventListener('click', dismissTitleScreen);

// ============================================================
// Init
// ============================================================

(async function main() {
  initMap();
  await loadAllData();
  goToOverview();
})();
