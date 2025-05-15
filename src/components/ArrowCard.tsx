import { formatDate } from "@lib/utils"
import type { CollectionEntry } from "astro:content"

type Props = {
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
  pill?: boolean
}

const getTagBackgroundColor = (tag: string): string => {
  const tagColorMap: Record<string, string> = {
    ios: "bg-salmon",
    tutorial: "bg-periwinkle",
    uikit: "bg-torch-lake",
    "functional programming": "bg-lavender",
    // Add more tags as needed
  };

  // Convert tag to lowercase for case-insensitive matching
  const normalizedTag = tag.toLowerCase();

  // Return specific color if tag exists in map, otherwise return default
  return tagColorMap[normalizedTag] || "bg-black/5 dark:bg-some-blue";
};

export default function ArrowCard({ entry, pill }: Props) {
  return (
    <a href={`/${entry.collection}/${entry.slug}`} class="group p-4 gap-3 flex items-center border rounded-lg hover:bg-black/5 hover:dark:bg-shadow-moon/50 border-black/15 dark:border-white/20 transition-colors duration-300 ease-in-out">
      <div class="w-full group-hover:text-black group-hover:dark:text-white blend">
        <div class="flex flex-wrap items-center gap-2">
          {pill &&
            <div class="text-sm capitalize px-2 py-0.5 rounded-full border border-black/15 dark:border-white/25">
              {entry.collection === "blog" ? "post" : "project"}
            </div>
          }
          <div class="text-sm uppercase">
            {formatDate(entry.data.date)}
          </div>
        </div>
        <div class="font-semibold mt-3 text-black dark:text-white">
          {entry.data.title}
        </div>

        <div class="text-sm line-clamp-2">
          {entry.data.summary}
        </div>
        <ul class="flex flex-wrap mt-2 gap-1">
          {entry.data.tags.map((tag: string) => (
            <li class={`flex items-center justify-center text-xs font-medium py-1 px-2 rounded ${getTagBackgroundColor(tag)} text-black/80`}>
              {tag}
            </li>
          ))}
        </ul>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="stroke-current group-hover:stroke-black group-hover:dark:stroke-white">
        <line x1="5" y1="12" x2="19" y2="12" class="scale-x-0 group-hover:scale-x-100 translate-x-4 group-hover:translate-x-1 transition-all duration-300 ease-in-out" />
        <polyline points="12 5 19 12 12 19" class="translate-x-0 group-hover:translate-x-1 transition-all duration-300 ease-in-out" />
      </svg>
    </a>
  )
}
