#!/bin/sh

DEBUG=""

for arg in "$@"; do
  case "$arg" in
    --debug=*)
      DEBUG=$(echo "$arg" | sed 's/^--debug=//')
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

if [ -z "$DEBUG" ]; then
  echo "Error: --debug flag is required (true or false)"
  exit 1
fi

if [ "$DEBUG" != "true" ] && [ "$DEBUG" != "false" ]; then
  echo "Error: --debug must be either 'true' or 'false'"
  exit 1
fi

set -e

if [ "$DEBUG" = "true" ]; then
  DB_HOST="postgresdb-dev"
else
  DB_HOST="postgresdb"
fi

echo "Waiting for $DB_HOST to be available on port 5432"
while ! nc -z "$DB_HOST" 5432; do
    sleep 1
done
echo "$DB_HOST is up - running migrations and collectstatic"

npx prisma generate
npm run generate-large-file
npm run generate-desc

if [ "$DEBUG" = "true" ]; then
    npm run setup-deploy
    npm run dev
else
    npm run setup-deploy
    npm run build
    npm run start
fi
