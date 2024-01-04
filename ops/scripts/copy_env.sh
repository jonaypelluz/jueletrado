#!/bin/sh
if [[ -f ".env" ]]; then
    rm .env
fi

cp -n ops/docker/app/.env.development .env

if [[ -f ".env.local" ]]; then
    cat .env.local >> .env
fi
