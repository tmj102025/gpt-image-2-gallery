export interface Prompt {
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

export interface PromptsData {
  prompts: Prompt[];
  categories: string[];
  total: number;
}
