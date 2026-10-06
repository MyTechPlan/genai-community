// Single source of truth for chapters, shared by /chapters and /chapters/[slug].
// A chapter only gets its own page once it has a `slug` plus the detail fields
// (hero, map, leads). Cities without one render as a card on the index only.

// Lead photos are imported (not referenced from public/) so <Image> can transcode
// and resize them at build time.
import lilianaPhoto from '../assets/chapters/lisbon/liliana-pereira.jpg';
import juliaPhoto from '../assets/chapters/lisbon/julia-pereira.jpg';
import julietaPhoto from '../assets/chapters/valencia/julieta-zalduendo.jpg';
import franPhoto from '../assets/chapters/valencia/jean-francois-gutierrez.jpg';

export const chapters = [
  {
    slug: 'valencia',
    city: 'Valencia',
    country: 'Spain',
    localName: 'València, Spain',
    eventCities: ['Valencia', 'València'],
    status: 'Active',
    note: "Home of the annual summit. See what's next in Valencia and meet the chapter leads, Julieta and Fran.",
    // `established` is optional; the founding year is left out until it's confirmed.
    headline: ["Where Valencia's GenAI builders", 'actually meet'],
    lede: 'The Valencia chapter of GenAI Community EU, in the city that hosts the annual GenAI Summit EU: meetups and hands-on workshops on building with generative AI in production.',
    map: {
      bbox: '-0.4250,39.4300,-0.3250,39.5100',
      lat: 39.4699,
      lon: -0.3763,
      coords: '39.4699° N · 0.3763° W',
      query: 'Valencia, Spain',
    },
    leads: [
      {
        id: 'julieta',
        name: 'Julieta Zalduendo',
        shortName: 'Julieta',
        kicker: 'Chapter lead · Community',
        role: 'Founder & CEO',
        company: 'My Tech Plan',
        modalRole: 'Founder & CEO · My Tech Plan · Valencia',
        photo: julietaPhoto,
        photoAlt: 'Julieta Zalduendo',
        photoPosition: '50% 30%',
        linkedin: 'https://www.linkedin.com/in/julietazalduendo/',
        summary:
          'Founder & CEO of My Tech Plan, building events and communities that connect companies, talent and innovation. Leads GenAI Summit EU and GenAI Community EU.',
        tags: ['Founder & CEO', 'Events & communities', 'GenAI Summit EU'],
        bio: [
          'Julieta Zalduendo is the Founder & CEO of My Tech Plan, where she creates events, communities and experiences that connect companies, talent and innovation in the tech ecosystem. Its work with technology companies spans hackathons, meetups, conferences, training programs and communities designed to strengthen positioning, employer branding and business opportunities.',
          'Over the years she has collaborated with companies such as IBM, Globant, Capgemini, Deloitte, Sika and Twilio, and she is part of the team behind València Nomads Hub, an initiative by Valencia Innovation Capital.',
          'She also leads GenAI Summit EU and GenAI Community EU, building an international ecosystem around generative AI. Her current focus is scaling GenAI Community EU across Europe and creating new partnerships at the intersection of tech, AI, communities and innovation, and she is always open to ambitious collaborations and European projects.',
        ],
      },
      {
        id: 'fran',
        name: 'Jean-François Gutierrez',
        shortName: 'Fran',
        kicker: 'Chapter lead · Technology',
        role: 'CTO',
        company: 'My Tech Plan',
        modalRole: 'AI Solution Architect & Consultant · CTO at My Tech Plan · Valencia',
        photo: franPhoto,
        photoAlt: 'Jean-François Gutierrez',
        photoPosition: '50% 35%',
        linkedin: 'https://www.linkedin.com/in/gutierrezfrancois/',
        // Optional extra links, shown beside LinkedIn on the card and in the bio.
        github: 'https://github.com/DrZuzzjen',
        website: { url: 'https://fran-ai.dev', label: 'fran-ai.dev' },
        summary:
          'AI solution architect and consultant who helps teams decide what to build with AI, design the architecture and ship it. Head of AI & Technology at GenAI Summit EU.',
        tags: ['AI architecture', 'Agents, MCP & RAG', 'GenAI Workshop Fest'],
        bio: [
          'Jean-François Gutierrez is an AI solution architect and consultant who helps teams decide what to build with AI, design the architecture and ship it. His work connects strategy, governance and hands-on implementation: agentic systems, MCP integrations, RAG and production software.',
          'He is CTO at My Tech Plan and Head of AI & Technology at GenAI Summit EU, where he leads technology, including the company’s proprietary event management platform.',
          'Alongside leading the Valencia chapter of GenAI Community EU, he is Academic Director at GenAI Workshop Fest.',
        ],
      },
    ],
  },
  {
    slug: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    localName: 'Lisboa, Portugal',
    // Every spelling an Eventbrite venue in this city might carry (matched accent-insensitively).
    eventCities: ['Lisbon', 'Lisboa'],
    status: 'Active',
    note: "See what's next in Lisbon and meet the chapter leads, Liliana and Julia.",
    established: 2026,
    // Hero headline is split so the last fragment can carry the iridescent gradient.
    headline: ["Where Lisbon's GenAI builders", 'actually meet'],
    lede: 'The Lisbon chapter of GenAI Community EU: meetups, hands-on workshops and honest conversations about building with generative AI in production.',
    map: {
      // bbox is west,south,east,north for the OpenStreetMap embed.
      bbox: '-9.2300,38.6800,-9.0900,38.7700',
      lat: 38.7223,
      lon: -9.1393,
      coords: '38.7223° N · 9.1393° W',
      query: 'Lisbon, Portugal',
    },
    leads: [
      {
        id: 'liliana',
        name: 'Liliana Catarina Freire Pereira',
        shortName: 'Liliana',
        kicker: 'Chapter lead · Engineering',
        role: 'Software Engineer',
        company: 'Coverflex',
        modalRole: 'Software Engineer · Coverflex · Lisbon',
        photo: lilianaPhoto,
        photoAlt: 'Liliana Pereira speaking at a conference',
        photoPosition: '68% 18%',
        linkedin: 'https://www.linkedin.com/in/lcfpereira/',
        summary:
          'Elixir specialist, mentor and speaker on AI-powered development workflows. Geek Girls Portugal ambassador, 2025 Portuguese Women in Tech Award winner for Best Engineer.',
        tags: ['Elixir', 'Mentor & speaker', 'WiT award 2025'],
        // `quote` is optional and rendered only when set. Leave it out unless the lead
        // has actually given us a line to attribute to them.
        bio: [
          'Liliana Catarina Freire Pereira is a software engineer, mentor and speaker based in Lisbon, currently specialising in Elixir at Coverflex. Over her career she has worked across a diverse technology stack, including PHP, TypeScript, Elixir, Docker, Kubernetes, Google Cloud, Kafka and Neo4j, applying patterns such as Event Sourcing, CQRS and microservices architectures, and collaborating with multidisciplinary, multicultural teams across the United Kingdom, the Netherlands and Germany.',
          'Alongside her engineering work, Liliana is passionate about sharing knowledge. She mentors engineers, speaks at conferences and community events, and serves as Ambassador for the Lisbon chapter of the Google Developer Group and Geek Girls Portugal, promoting diversity in technology. In 2025, she was honoured with the Portuguese Women in Tech Award for Best Engineer.',
          'Her current work in generative AI focuses on helping software engineers adopt AI effectively in their daily work. She regularly delivers talks and workshops on AI-powered development workflows, covering topics like integrating AI into the software development lifecycle, engineering productivity, code quality, testing, architecture discussions and practical AI tooling for developers.',
          'As GenAI Community Lead for Lisbon, Liliana wants to create spaces where experienced engineers, tech leaders and founders can openly share what’s actually working in practice, not just the latest trends. Her vision for the chapter’s first meetup, “One Year of GenAI in Engineering: What Actually Changed?”, brings together engineering leaders for an honest panel conversation about where AI has delivered real value in engineering teams and where it hasn’t, followed by open Q&A and networking over food and drinks.',
        ],
      },
      {
        id: 'julia',
        name: 'Julia Mariá Pereira',
        shortName: 'Julia',
        kicker: 'Chapter lead · Product',
        role: 'Product Owner',
        company: 'Portobello America',
        modalRole: 'Product Owner · Portobello America · Lisbon',
        photo: juliaPhoto,
        photoAlt: 'Julia Mariá Pereira',
        photoPosition: '50% 32%',
        linkedin: 'https://www.linkedin.com/in/juliamariap/',
        summary:
          'Product leader across startups, ecommerce, SaaS and digital transformation, ex-VTEX. Generative AI runs through nearly everything she does, from prototyping to problem-solving.',
        tags: ['Product', 'Ex-VTEX', 'Ecommerce & SaaS'],
        bio: [
          'Julia Mariá is a product leader who has spent most of her career in fast-paced technology and startup environments, working across product, ecommerce, SaaS and digital transformation. Today she works as a Product Owner at Portobello America.',
          'Generative AI has become part of almost everything Julia does: how she learns, explores ideas, prototypes, automates small tasks, and challenges her own approach to problem-solving. She’s drawn to the idea of becoming more of a builder, experimenting hands-on with new tools and figuring out where AI genuinely makes a difference beyond the hype.',
          'What fascinates her most is what comes next: how these technologies will change the way we work, create, relate to one another and live five or ten years from now, and how we make sure we build those new spaces collaboratively, in ways that strengthen human connection rather than replace it.',
          'As GenAI Community Lead for Lisbon, Julia wants to create an open, thoughtful and generous space for people. A community where people leave with a new idea, a different perspective, or a connection they wouldn’t have made otherwise. She sees Lisbon’s strong tech ecosystem, international mix of talent as fertile ground for connecting tech experts who don’t always end up in the same room. Her goal for every meetup: a warm, casual atmosphere where the content matters, but people come back because of how it made them feel.',
        ],
      },
    ],
  },
  {
    city: 'London',
    country: 'United Kingdom',
    status: 'Forming',
    note: 'Chapter in formation. First events to be announced.',
  },
];

export function getChapterPages() {
  return chapters.filter((chapter) => chapter.slug);
}
