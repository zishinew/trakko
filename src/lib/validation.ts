import { z } from 'zod';
const deliverable = z.enum(['mp3', 'wav', 'stems']);
const webUrl = z.union([
  z.literal(''),
  z.url().refine((v) => v.startsWith('https://'), 'Use an https:// link'),
]);
export const reserved = new Set([
  'api',
  'dashboard',
  'login',
  'signup',
  'onboarding',
  'reset-password',
  'update-password',
  'auth',
  'purchase',
  'favicon.ico',
  'demo',
  '_next',
]);
export const storeSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9][a-z0-9_-]*$/)
    .refine((v) => !reserved.has(v), 'This username is reserved'),
  display_name: z.string().trim().min(1).max(60),
  bio: z.string().max(300).default(''),
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#626270'),
  theme: z.enum(['dark', 'light']).default('light'),
  instagram: webUrl.default(''),
  youtube: webUrl.default(''),
  website: webUrl.default(''),
  avatar_url: z.string().default(''),
  banner_url: z.string().default(''),
  published: z.boolean().default(true),
});
export const beatSchema = z.object({
  release_at: z.union([z.iso.datetime(), z.null()]).optional(),
  free_download: z.boolean().optional(),
  free_download_terms: z.string().trim().min(10).max(2000).optional(),
  title: z.string().trim().min(1).max(100),
  bpm: z.coerce.number().int().min(30).max(300),
  musical_key: z.string().max(20),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  description: z.string().max(2000).default(''),
  published: z.boolean().default(false),
});
export const licenseSchema = z.object({
  name: z.string().trim().min(1).max(40),
  price_cents: z.number().int().min(50).max(100000000),
  terms: z.string().trim().min(10).max(12000),
  active: z.boolean(),
  deliverables: z
    .array(deliverable)
    .min(1)
    .max(3)
    .refine((v) => new Set(v).size === v.length),
});
export const checkoutSchema = z
  .object({
    beat_id: z.uuid().optional(),
    license_id: z.uuid().optional(),
    bundle_id: z.uuid().optional(),
    code: z.string().max(24).optional(),
    source: z.string().max(100).optional(),
    email: z.email().max(254),
  })
  .refine(
    (v) => Boolean(v.bundle_id) !== Boolean(v.beat_id && v.license_id),
    'Choose a beat license or a bundle',
  );
export const uploadSchema = z.object({
  beat_id: z.uuid().optional(),
  kind: z.enum(['mp3', 'wav', 'stems', 'preview', 'cover', 'avatar', 'banner']),
  name: z.string().min(1).max(180),
  size: z.number().int().positive(),
  content_type: z.string().max(100),
});
export function validateUpload(kind: string, name: string, size: number, mime: string) {
  if (name.includes('/') || name.includes('\\') || name.includes('..') || /[\x00-\x1f]/.test(name))
    throw new Error('Invalid filename');
  const rules: Record<string, { ext: string[]; mime: string[]; max: number }> = {
    preview: { ext: ['mp3'], mime: ['audio/mpeg', 'audio/mp3'], max: 30 * 1024 * 1024 },
    mp3: { ext: ['mp3'], mime: ['audio/mpeg', 'audio/mp3'], max: 100 * 1024 * 1024 },
    wav: { ext: ['wav'], mime: ['audio/wav', 'audio/x-wav', 'audio/wave'], max: 500 * 1024 * 1024 },
    stems: {
      ext: ['zip'],
      mime: ['application/zip', 'application/x-zip-compressed'],
      max: 1024 * 1024 * 1024,
    },
    cover: {
      ext: ['jpg', 'jpeg', 'png', 'webp'],
      mime: ['image/jpeg', 'image/png', 'image/webp'],
      max: 8 * 1024 * 1024,
    },
    avatar: {
      ext: ['jpg', 'jpeg', 'png', 'webp'],
      mime: ['image/jpeg', 'image/png', 'image/webp'],
      max: 8 * 1024 * 1024,
    },
    banner: {
      ext: ['jpg', 'jpeg', 'png', 'webp'],
      mime: ['image/jpeg', 'image/png', 'image/webp'],
      max: 8 * 1024 * 1024,
    },
  };
  const r = rules[kind];
  if (
    !r ||
    !r.ext.includes(name.split('.').pop()!.toLowerCase()) ||
    !r.mime.includes(mime) ||
    size > r.max
  )
    throw new Error('Unsupported file type or file too large');
}
