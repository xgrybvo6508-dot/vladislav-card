import {
  profile,
  type ListSection,
  type Project,
  type TextSection,
} from "../content/profile";
import { createChatPanel } from "./chat-panel";

function createExternalLink(
  label: string,
  url: string,
  className: string,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function createTextSection(content: TextSection): HTMLElement {
  const section = document.createElement("section");
  section.className = "profile-section";

  const heading = document.createElement("h2");
  heading.textContent = content.heading;
  section.append(heading);

  for (const paragraphText of content.paragraphs) {
    const paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    section.append(paragraph);
  }
  return section;
}

function createListSection(content: ListSection): HTMLElement {
  const section = document.createElement("section");
  section.className = "profile-section";

  const heading = document.createElement("h2");
  heading.textContent = content.heading;

  const list = document.createElement("ul");
  list.className = "communication-list";
  for (const itemText of content.items) {
    const item = document.createElement("li");
    item.textContent = itemText;
    list.append(item);
  }

  section.append(heading, list);
  return section;
}

function createProjectsSection(): HTMLElement {
  const content = profile.sections.projects;
  const section = document.createElement("section");
  section.className = "profile-section";

  const heading = document.createElement("h2");
  heading.textContent = content.heading;
  const introduction = document.createElement("p");
  introduction.textContent = content.introduction;

  const list = document.createElement("ul");
  list.className = "project-list";
  const projects: readonly Project[] = content.items;
  for (const project of projects) {
    const item = document.createElement("li");
    const card = document.createElement("article");
    card.className = "project-card";

    const projectHeading = document.createElement("h3");
    projectHeading.textContent = project.name;
    const description = document.createElement("p");
    description.textContent = project.description;
    card.append(projectHeading, description);

    if (project.url !== undefined && project.linkLabel !== undefined) {
      card.append(createExternalLink(project.linkLabel, project.url, "project-link"));
    }
    item.append(card);
    list.append(item);
  }

  section.append(heading, introduction, list);
  return section;
}

function createContactSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "profile-section contact-section";

  const heading = document.createElement("h2");
  heading.textContent = profile.contact.heading;
  const body = document.createElement("p");
  body.textContent = profile.contact.body;
  const link = createExternalLink(
    profile.contact.linkLabel,
    profile.contact.url,
    "secondary-action",
  );

  section.append(heading, body, link);
  return section;
}

export function mountApp(root: HTMLElement, storage: Storage): void {
  const skipLink = document.createElement("a");
  skipLink.className = "skip-link";
  skipLink.href = "#main-content";
  skipLink.textContent = "Skip to main content";

  const header = document.createElement("header");
  header.className = "page-shell site-header";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = profile.identity.hero.eyebrow;
  const heading = document.createElement("h1");
  heading.textContent = profile.identity.hero.heading;
  const summary = document.createElement("p");
  summary.className = "hero-summary";
  summary.textContent = profile.identity.hero.summary;
  const primaryAction = createExternalLink(
    profile.identity.hero.primaryAction,
    profile.contact.url,
    "primary-action",
  );
  header.append(eyebrow, heading, summary, primaryAction);

  const main = document.createElement("main");
  main.id = "main-content";
  main.className = "page-shell profile-main";
  main.tabIndex = -1;
  main.append(
    createTextSection(profile.sections.about),
    createProjectsSection(),
    createTextSection(profile.sections.collaboration),
    createListSection(profile.sections.communication),
    createContactSection(),
    createChatPanel(storage),
  );

  const footer = document.createElement("footer");
  footer.className = "page-shell site-footer";
  const footerText = document.createElement("p");
  footerText.textContent = "End of profile.";
  footer.append(footerText);

  root.replaceChildren(skipLink, header, main, footer);
}
