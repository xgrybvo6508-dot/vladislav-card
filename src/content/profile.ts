export interface Hero {
  readonly eyebrow: string;
  readonly heading: string;
  readonly summary: string;
  readonly primaryAction: string;
}

export interface Identity {
  readonly name: string;
  readonly hero: Hero;
}

export interface TextSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface ListSection {
  readonly heading: string;
  readonly items: readonly string[];
}

export interface Project {
  readonly name: string;
  readonly description: string;
  readonly linkLabel?: string;
  readonly url?: string;
}

export interface ProjectsSection {
  readonly heading: string;
  readonly introduction: string;
  readonly items: readonly Project[];
}

export interface Sections {
  readonly about: TextSection;
  readonly projects: ProjectsSection;
  readonly collaboration: TextSection;
  readonly communication: ListSection;
}

export interface Contact {
  readonly heading: string;
  readonly body: string;
  readonly handle: string;
  readonly linkLabel: string;
  readonly url: string;
}

export interface OpenGraphImageCopy {
  readonly name: string;
  readonly tagline: string;
  readonly identity: string;
  readonly contact: string;
}

export interface Metadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly openGraph: {
    readonly url: string;
    readonly type: "website";
    readonly imageUrl: string;
    readonly imageType: "image/png";
    readonly imageWidth: 1200;
    readonly imageHeight: 630;
    readonly imageAlt: string;
  };
  readonly twitter: {
    readonly card: "summary_large_image";
    readonly imageUrl: string;
  };
  readonly themeColor: "#0e0f13";
  readonly imageCopy: OpenGraphImageCopy;
}

export interface Profile {
  readonly identity: Identity;
  readonly sections: Sections;
  readonly contact: Contact;
  readonly metadata: Metadata;
}

export const profile = {
  identity: {
    name: "Vladislav Shamanov",
    hero: {
      eyebrow: "Hello, I’m Vladislav.",
      heading: "I build focused AI and learning tools.",
      summary:
        "I am an 18-year-old student in the St. Petersburg area. This page explains what I build and how to work with me.",
      primaryAction: "Contact me on X",
    },
  },
  sections: {
    about: {
      heading: "Who I am",
      paragraphs: [
        "I am autistic, have ADHD, and am twice-exceptional (2e). These are part of how I think and work.",
        "I learn through mind maps and interleaving. I prefer minimal systems with a clear structure.",
      ],
    },
    projects: {
      heading: "What I build",
      introduction: "These are the four projects and systems I am building.",
      items: [
        {
          name: "Discrete Tasks",
          description:
            "A university discrete-math practice PWA with an AI agent and memory.",
          linkLabel: "Open Discrete Tasks",
          url: "https://xgrybvo6508-dot.github.io/discrete-tasks/",
        },
        {
          name: "Daily tasks planner",
          description: "A planner for daily tasks.",
        },
        {
          name: "Idea Pulse",
          description: "An Obsidian workflow for scoring ideas.",
        },
        {
          name: "AI learning systems",
          description: "Systems for learning with mind maps and interleaving.",
        },
      ],
    },
    collaboration: {
      heading: "Who I’m looking for",
      paragraphs: [
        "I am looking for adult collaborators and cofounders (18–25+) for AI and development projects.",
        "I want to meet people through international English-language communities.",
      ],
    },
    communication: {
      heading: "How to talk to me",
      items: [
        "Please use direct, concrete text and clear expectations.",
        "Async communication is fine.",
        "Respectful questions about autism are welcome.",
      ],
    },
  },
  contact: {
    heading: "Contact",
    body: "The only public way to contact me is X.",
    handle: "@VladislavSsqwl",
    linkLabel: "@VladislavSsqwl on X",
    url: "https://x.com/VladislavSsqwl",
  },
  metadata: {
    title: "Vladislav Shamanov — AI and development projects",
    description:
      "Vladislav builds focused AI and learning tools and is looking for adult collaborators and cofounders.",
    canonicalUrl: "https://xgrybvo6508-dot.github.io/vladislav-card/",
    openGraph: {
      url: "https://xgrybvo6508-dot.github.io/vladislav-card/",
      type: "website",
      imageUrl: "https://xgrybvo6508-dot.github.io/vladislav-card/og-image.png",
      imageType: "image/png",
      imageWidth: 1200,
      imageHeight: 630,
      imageAlt: "Vladislav Shamanov — AI and development projects",
    },
    twitter: {
      card: "summary_large_image",
      imageUrl: "https://xgrybvo6508-dot.github.io/vladislav-card/og-image.png",
    },
    themeColor: "#0e0f13",
    imageCopy: {
      name: "Vladislav Shamanov",
      tagline: "AI and development projects",
      identity: "Student · autistic · ADHD · 2e",
      contact: "@VladislavSsqwl",
    },
  },
} as const satisfies Profile;
