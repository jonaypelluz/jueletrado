#!/usr/bin/env bash

if grep -q "jueletrado.local" "/etc/hosts"; then
  echo "Host jueletrado.local found! Not modifying hosts."
else
  echo "Adding urls to hosts:"
  echo "127.0.0.1 jueletrado.local" | sudo tee -a /etc/hosts
fi
