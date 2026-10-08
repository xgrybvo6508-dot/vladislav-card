import { describe, expect, it } from "vitest";
import { profile } from "./profile";

describe("public profile", () => {
  it("contains every required section and exactly four projects", () => {
    expect(profile.sections.about.heading).toBe("Who I am");
    expect(profile.sections.projects.items).toHaveLength(4);
    expect(profile.sections.collaboration.paragraphs).toHaveLength(2);
    expect(profile.sections.communication.items).toHaveLength(3);
    expect(profile.contact.heading).toBe("Contact");
  });

  it("contains only the approved public links", () => {
    const text = JSON.stringify(profile);
    const links = text.match(/https:\/\/[^"\\]+/g) ?? [];
    expect(new Set(links)).toEqual(
      new Set([
        "https://xgrybvo6508-dot.github.io/discrete-tasks/",
        "https://x.com/VladislavSsqwl",
        "https://xgrybvo6508-dot.github.io/vladislav-card/",
        "https://xgrybvo6508-dot.github.io/vladislav-card/og-image.png",
      ]),
    );
  });

  it("keeps public identity wording inside the approved boundary", () => {
    const text = JSON.stringify(profile);
    expect(profile.identity.hero.summary).toContain("18-year-old");
    expect(text).toContain("St. Petersburg area");
    expect(text).toContain("autistic");
    expect(text).toContain("ADHD");
    expect(text).toContain("2e");
    expect(text.match(/St\. Petersburg area/g)).toHaveLength(1);
    expect(text).not.toMatch(
      /(?:street|avenue|boulevard|road|apartment|postal|postcode|zip code)/i,
    );
    expect(text).not.toMatch(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/(?:\+?\d[\d ()-]{7,}\d)/);
    expect(text).not.toMatch(
      /(?:mother|father|parent|sibling|family|salary|income|bank|debt|diagnosis|medication|therapy)/i,
    );
    expect(text).not.toMatch(
      /(?:stud(?:y|ies|ied) at|enrolled at|school named|university named)/i,
    );
    expect(text).not.toMatch(/(?:api[_ -]?key|access[_ -]?token|bearer\s+[a-z0-9])/i);
  });
});
