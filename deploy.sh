#!/bin/sh

# load env vars from file if present
# Otherwise they should already be present
if [[ -f .env.deploy ]]; then
	. .env.deploy
fi

VERBOSE=$1
OUT=/dev/null

if [[ "$VERBOSE" == "-v" ]]; then
	OUT=/dev/stdout
fi

# Run docker compose on host, force build and recreate
DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker compose -f docker-compose-prod.yml up -d --build --force-recreate > $OUT
SUCCESS=$?

if [[ $SUCCESS == 0 ]]; then
	# Post build cleanup
	echo -e "\nCleaning up build cache..."
	DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker system prune -f --filter "label=com.docker.compose.project=codenames" > $OUT

	echo "Finished!"
	exit 0
else
	echo -e "\nDeploy failed with exit code $SUCCESS"
fi

