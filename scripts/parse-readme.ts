import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REPO1_PATH = path.resolve(ROOT, '../awesome-gpt-image-2/README.md');
const REPO2_PATH = path.resolve(ROOT, '../awesome-gpt-image/README.md');
const REPO3_PATH = path.resolve(ROOT, '../gpt_image_2_skill/docs/community-prompt-picks.json');
const OUTPUT_PATH = path.resolve(ROOT, 'public/prompts.json');

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  images: string[];
  author: { name: string; link?: string };
  language: string;
  featured: boolean;
  categories: string[];
  source?: string;
  size?: string;
}

// ─── Parser 1: YouMind-OpenLab/awesome-gpt-image-2 ───────────────────────────
// Same format as Nano Banana: ### No. N: sections
function parseRepo1(text: string): Prompt[] {
  const prompts: Prompt[] = [];
  const sections = text.split(/(?=^### No\. \d+:)/m);

  for (const section of sections) {
    if (!section.trim().startsWith('### No.')) continue;

    const titleMatch = section.match(/^### No\. \d+: (.+)$/m);
    if (!titleMatch) continue;
    const fullTitle = titleMatch[1].trim();

    const featured = /!\[Featured\]/.test(section);
    const langMatch = section.match(/!\[Language-([A-Z]{2})\]/);
    const language = langMatch ? langMatch[1].toLowerCase() : 'en';

    const descMatch = section.match(/#### 📖 Description\s+([\s\S]+?)(?=####|\n---)/);
    const description = descMatch ? descMatch[1].trim() : '';

    const promptMatch = section.match(/#### 📝 Prompt\s+```\s*([\s\S]+?)```/);
    if (!promptMatch) continue;
    const content = promptMatch[1].trim();

    const imageMatches = [...section.matchAll(/<img src="(https?:\/\/[^"]+)"/g)];
    const images = imageMatches.map(m => m[1]);
    if (images.length === 0) continue;

    const authorLinkMatch = section.match(/\*\*Author:\*\* \[([^\]]+)\]\(([^)]+)\)/);
    const authorPlainMatch = section.match(/\*\*Author:\*\* ([^\n\[]+)/);
    let author: { name: string; link?: string };
    if (authorLinkMatch) {
      author = { name: authorLinkMatch[1].trim(), link: authorLinkMatch[2].trim() };
    } else if (authorPlainMatch) {
      author = { name: authorPlainMatch[1].trim() };
    } else {
      author = { name: 'Unknown' };
    }

    const categories: string[] = [];
    const catIdx = fullTitle.indexOf(' - ');
    let title = fullTitle;
    if (catIdx !== -1) {
      const catPart = fullTitle.substring(0, catIdx).trim();
      title = fullTitle.substring(catIdx + 3).trim();
      if (catPart) categories.push(catPart);
    }

    prompts.push({
      id: `r1-${prompts.length + 1}`,
      title,
      description,
      content,
      images,
      author,
      language,
      featured,
      categories,
      source: 'youmind',
    });
  }

  return prompts;
}

// ─── Parser 2: ZeroLu/awesome-gpt-image ──────────────────────────────────────
// Markdown: ## Category → **bold title** + image + ```code``` + attribution
function parseRepo2(text: string): Prompt[] {
  const prompts: Prompt[] = [];

  // Split by top-level ## headings to get categories
  const categorySections = text.split(/(?=^## .+$)/m);

  for (const catSection of categorySections) {
    const catHeadingMatch = catSection.match(/^## (.+)$/m);
    if (!catHeadingMatch) continue;
    const rawCat = catHeadingMatch[1].replace(/[#*`]/g, '').trim();
    // Skip navigation / meta sections
    if (/table|content|contribut|license|resource/i.test(rawCat)) continue;

    // Find entries anchored by bold title lines
    const entryMatches = [...catSection.matchAll(/\*\*([^*\n]{3,80})\*\*([\s\S]+?)(?=\n\*\*[^*\n]+\*\*|\n## |\n---|\Z)/gm)];

    for (const match of entryMatches) {
      const title = match[1].trim();
      const body = match[2];

      // Extract images (markdown syntax + raw URLs with image extensions)
      const mdImgs = [...body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1]);
      const rawImgs = [...body.matchAll(/(https?:\/\/\S+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s)]*)?)/gi)].map(m => m[1]);
      const images = [...new Set([...mdImgs, ...rawImgs])];

      // Extract prompt from code block
      const codeMatch = body.match(/```[^\n]*\n([\s\S]+?)```/);
      if (!codeMatch) continue;
      const content = codeMatch[1].trim();
      if (!content || content.length < 10) continue;

      // Attribution: @handle, [Name](url), or Source:
      let author: { name: string; link?: string } = { name: 'Community' };
      const atMatch = body.match(/@(\w+)/);
      const linkMatch = body.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (atMatch) {
        author = { name: `@${atMatch[1]}`, link: `https://twitter.com/${atMatch[1]}` };
      } else if (linkMatch) {
        author = { name: linkMatch[1], link: linkMatch[2] };
      }

      const cjk = /[一-鿿぀-ゟ゠-ヿ]/.test(content);

      prompts.push({
        id: `r2-${prompts.length + 1}`,
        title,
        description: '',
        content,
        images,
        author,
        language: cjk ? 'zh' : 'en',
        featured: false,
        categories: [rawCat],
        source: 'zerolu',
      });
    }
  }

  // Deduplicate by prompt content fingerprint within this repo
  const seen = new Set<string>();
  return prompts.filter(p => {
    const key = p.content.slice(0, 100).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Parser 3: wuyoscar/gpt_image_2_skill ────────────────────────────────────
// Structured JSON: {id, platform, category, title, source_url, prompt, size}
interface Repo3Entry {
  id?: string | number;
  platform?: string;
  category?: string;
  title?: string;
  source_url?: string;
  source_excerpt?: string;
  prompt?: string;
  size?: string;
}

function parseRepo3(jsonText: string): Prompt[] {
  let entries: Repo3Entry[];
  try {
    const parsed = JSON.parse(jsonText);
    entries = Array.isArray(parsed) ? parsed : (parsed.data ?? parsed.prompts ?? []);
  } catch {
    console.warn('⚠️  Failed to parse repo3 JSON');
    return [];
  }

  return entries
    .filter(e => e.prompt && e.prompt.trim())
    .map((e, i) => {
      const title = e.title ?? `GPT Image 2 Prompt #${i + 1}`;
      const categories = e.category ? [e.category] : [];

      let author: { name: string; link?: string } = { name: e.platform ?? 'Community' };
      if (e.source_url) {
        const twitterMatch = e.source_url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
        if (twitterMatch) {
          author = { name: `@${twitterMatch[1]}`, link: e.source_url };
        } else {
          author = { name: e.platform ?? 'Community', link: e.source_url };
        }
      }

      const content = e.prompt!.trim();
      const cjk = /[一-鿿぀-ゟ゠-ヿ]/.test(content);

      return {
        id: `r3-${e.id ?? i + 1}`,
        title,
        description: e.source_excerpt ?? '',
        content,
        images: [],
        author,
        language: cjk ? 'zh' : 'en',
        featured: false,
        categories,
        source: 'wuyoscar',
        size: e.size,
      } satisfies Prompt;
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const allPrompts: Prompt[] = [];

if (fs.existsSync(REPO1_PATH)) {
  const text = fs.readFileSync(REPO1_PATH, 'utf-8');
  console.log(`📖 Repo 1 (YouMind): ${(text.length / 1024).toFixed(0)} KB`);
  const parsed = parseRepo1(text);
  console.log(`   ✅ ${parsed.length} prompts`);
  allPrompts.push(...parsed);
} else {
  console.warn(`⚠️  Repo 1 not found: ${REPO1_PATH}`);
}

if (fs.existsSync(REPO2_PATH)) {
  const text = fs.readFileSync(REPO2_PATH, 'utf-8');
  console.log(`📖 Repo 2 (ZeroLu): ${(text.length / 1024).toFixed(0)} KB`);
  const parsed = parseRepo2(text);
  console.log(`   ✅ ${parsed.length} prompts`);
  allPrompts.push(...parsed);
} else {
  console.warn(`⚠️  Repo 2 not found: ${REPO2_PATH}`);
}

if (fs.existsSync(REPO3_PATH)) {
  const text = fs.readFileSync(REPO3_PATH, 'utf-8');
  console.log(`📖 Repo 3 (wuyoscar): ${(text.length / 1024).toFixed(0)} KB`);
  const parsed = parseRepo3(text);
  console.log(`   ✅ ${parsed.length} prompts`);
  allPrompts.push(...parsed);
} else {
  console.warn(`⚠️  Repo 3 not found: ${REPO3_PATH}`);
}

console.log(`\n📊 Total before dedup: ${allPrompts.length}`);

// Global deduplication across repos by first 150 chars of prompt
const globalSeen = new Set<string>();
const deduped = allPrompts.filter(p => {
  const key = p.content.trim().slice(0, 150).toLowerCase();
  if (globalSeen.has(key)) return false;
  globalSeen.add(key);
  return true;
});
console.log(`   After dedup: ${deduped.length} prompts`);

const allCategories = [...new Set(deduped.flatMap(p => p.categories))].sort();
console.log(`🏷️  Categories (${allCategories.length}): ${allCategories.slice(0, 10).join(', ')}${allCategories.length > 10 ? '...' : ''}`);

const output = { prompts: deduped, categories: allCategories, total: deduped.length };
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
console.log(`💾 Written to ${OUTPUT_PATH}`);
