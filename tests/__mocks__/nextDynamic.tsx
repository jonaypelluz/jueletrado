import React from 'react';

const dynamic = (_importFn: () => Promise<unknown>, _opts?: unknown) => {
    const Stub = () => null;
    Stub.displayName = 'DynamicComponent';
    return Stub;
};

export default dynamic;
