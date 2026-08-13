// Single source of truth for chapters, shared by /chapters and /chapters/[slug].
// A chapter only gets its own page once it has a `slug` plus the detail fields
// (hero, map, leads). Cities without one render as a card on the index only.

// Lead photos are imported (not referenced from public/) so <Image> can transcode
// and resize them at build time.
import lilianaPhoto from '../assets/chapters/lisbon/liliana-pereira.jpg';
import juliaPhoto from '../assets/chapters/lisbon/julia-pereira.jpg';

export const chapters = [
  {
    city: 'Valencia',
    country: 'Spain',
    status: 'Active',
    note: 'Home of the annual summit.',
  },
  {
    slug: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    localName: 'Lisboa, Portugal',
    status: 'Active',
    note: 'Meetups, workshops and study groups, led by Liliana and Julia.',
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
        quote: "Honest conversations about what's actually working in practice, not just the latest trends.",
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
        quote: 'The content matters, but people come back because of how it made them feel.',
        bio: [
          'Julia Mariá is a product leader who has spent most of her career in fast-paced technology and startup environments, working across product, ecommerce, SaaS and digital transformation. Today she works as a Product Owner at Portobello America.',
          'Generative AI has become part of almost everything Julia does: how she learns, explores ideas, prototypes, automates small tasks, and challenges her own approach to problem-solving. She’s drawn to the idea of becoming more of a builder, experimenting hands-on with new tools and figuring out where AI genuinely makes a difference beyond the hype.',
          'What fascinates her most is what comes next: how these technologies will change the way we work, create, relate to one another and live five or ten years from now, and how we make sure we build those new spaces collaboratively, in ways that strengthen human connection rather than replace it.',
          'As GenAI Community Lead for Lisbon, Julia wants to create an open, thoughtful and generous space for people: a community where people leave with a new idea, a different perspective, or a connection they wouldn’t have made otherwise. She sees Lisbon’s strong tech ecosystem and international mix of talent as fertile ground for connecting tech experts who don’t always end up in the same room. Her goal for every meetup: a warm, casual atmosphere where the content matters, but people come back because of how it made them feel.',
        ],
      },
    ],
  },
  {
    city: 'Berlin',
    country: 'Germany',
    status: 'Forming',
    note: 'Looking for co-organizers.',
  },
];

export function getChapterPages() {
  return chapters.filter((chapter) => chapter.slug);
}
