// Ambient typings so TS resolves CSS-Module imports (`import s from './x.module.css'`)
// and plain side-effect stylesheet imports. The consuming Next.js app processes the
// actual CSS via `transpilePackages`.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.css';
declare module '*.scss';
