#! /bin/sh

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
echo "Waiting for postgresdb to be available on port 5432"
while ! nc -z postgresdb 5432; do
    sleep 1
done
echo "postgresdb is up - running migrations and collectstatic"


npx prisma generate

if [ "$DEBUG" = "true" ]; then
    npm run setup
    npm run dev
else
    npm run setup-deploy
    npm run build
    npm run start
fi