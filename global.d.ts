// Re-export the JSX namespace globally so that the legacy
// `JSX.Element` references that were valid under @types/react v17/v18
// keep working without touching every game file.
//
// (React 18.3 still ships the global JSX namespace via the types package,
// but TypeScript's stricter resolution can drop it depending on tsconfig.
// This declaration is a safety net.)
import type * as React from 'react';

declare global {
    namespace JSX {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Element extends React.ReactElement {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ElementClass extends React.JSX.ElementClass {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
        type IntrinsicElements = React.JSX.IntrinsicElements;
    }
}

export {};
