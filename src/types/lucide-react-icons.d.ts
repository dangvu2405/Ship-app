/**
 * Type declarations for lucide-react direct icon imports.
 * Using direct imports avoids loading the entire barrel file (1,583 modules).
 * See: bundle-barrel-imports rule
 */
declare module 'lucide-react/dist/esm/icons/*' {
  import { LucideIcon } from 'lucide-react';
  const icon: LucideIcon;
  export default icon;
}
