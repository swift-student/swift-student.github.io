import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Swift Student",
  DESCRIPTION: "Welcome to Swift Student, a blog about what I learn using Swift and more.",
  AUTHOR: "Shawn Gee",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  {
    TEXT: "Home",
    HREF: "/",
  },
  {
    TEXT: "Work",
    HREF: "/work",
  },
  {
    TEXT: "Blog",
    HREF: "/blog",
  },
  //{
  //  TEXT: "Projects",
  //  HREF: "/projects",
  //},
]

// Socials
export const SOCIALS: Socials = [
  //{
  //  NAME: "Email",
  //  ICON: "email",
  //  TEXT: "shawngee@gmail.com",
  //  HREF: "mailto:shawngee@gmail.com",
  //},
  {
    NAME: "Github",
    ICON: "github",
    TEXT: "markhorn-dev",
    HREF: "https://github.com/swift-student"
  },
  {
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "markhorn-dev",
    HREF: "https://www.linkedin.com/in/shawngee/",
  },
  {
    NAME: "Twitter",
    ICON: "twitter-x",
    TEXT: "markhorn_dev",
    HREF: "https://x.com/swift_student",
  },
]

