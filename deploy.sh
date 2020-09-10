#!/bin/bash

echo What should the version be?
read VERSION

docker build -t lesliedinh95/reddit:v$VERSION .

docker push lesliedinh95/reddit:v$VERSION

ssh root@206.189.40.235 "docker pull lesliedinh95/reddit:v$VERSION && docker tag lesliedinh95/reddit:v$VERSION dokku/api:v$VERSION && dokku tags:deploy api v$VERSION"